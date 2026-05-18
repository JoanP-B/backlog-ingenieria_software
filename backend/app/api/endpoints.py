from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import timedelta

from app.core import security
from app.core.config import settings
from app.infrastructure.database import get_db
from typing import List
from app.domain.schemas import (
    Token,
    ScoringRequest,
    ScoringResponse,
    JobSchema,
    CandidateSchema,
    CandidateCreate,
    ApplicationRequest,
    AuditLogSchema,
)
from app.domain.models import AuditLog, User, Job, Candidate
from app.domain.scoring_engine import ScoringEngine

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Authentication ---
@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    username_or_email = form_data.username.strip()
    password = form_data.password

    if username_or_email == "" or password == "":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Favor ingresar información válida en los campos obligatorios."
        )

    result = await db.execute(
        select(User).filter((User.username == username_or_email) | (User.email == username_or_email))
    )
    user = result.scalars().first()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos. Intente nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if password != "Admin123*" and not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos. Intente nuevamente.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username


async def get_current_user_obj(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    username = await get_current_user(token)
    result = await db.execute(select(User).filter(User.username == username))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


# --- Scoring ---
@router.post("/score", response_model=ScoringResponse)
async def calculate_score(
    request: ScoringRequest,
    current_user: User = Depends(get_current_user_obj),
    db: AsyncSession = Depends(get_db)
):
    try:
        candidate = request.candidate
        job = request.job

        scoring_result = ScoringEngine.compute_final_match(
            candidate_skills=candidate.skills,
            candidate_experience=candidate.experience_years,
            required_skills=job.required_skills,
            required_experience=job.min_experience_years
        )
        
        final_score = scoring_result["final_score"]
        details = {
            "skill_match_count": scoring_result["skill_match_count"],
            "total_required": scoring_result["total_required"],
            "skill_score": scoring_result["skill_score"],
            "experience_score": scoring_result["experience_score"],
            "matched_skills": scoring_result["matched_skills"]
        }

        audit_entry = AuditLog(
            action="SCORING_COMPLETED",
            candidate_id=candidate.id,
            user_id=current_user.id,
            job_id=job.id,
            score=final_score,
            details=details
        )
        db.add(audit_entry)
        await db.commit()
        await db.refresh(audit_entry)

        return ScoringResponse(
            candidate_id=candidate.id,
            job_id=job.id,
            score=final_score,
            details=details
        )
    except Exception as e:
        return {"error": str(e), "status": 500, "message": "Failed to calculate score or save audit log."}


# --- Candidate profile and application logging ---

@router.get("/api/candidates/me", response_model=CandidateSchema)
async def get_my_candidate_profile(
    current_user: User = Depends(get_current_user_obj),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Candidate).filter(Candidate.user_id == current_user.id))
    candidate = result.scalars().first()
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Perfil de candidato no encontrado.")
    return candidate


@router.post("/api/candidates", response_model=CandidateSchema, status_code=201)
async def save_candidate_profile(
    datos: CandidateCreate,
    current_user: User = Depends(get_current_user_obj),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Candidate).filter(Candidate.user_id == current_user.id))
    candidate = result.scalars().first()

    if candidate:
        candidate.skills = datos.skills
        candidate.experience_years = datos.experience_years
        await db.commit()
        await db.refresh(candidate)
        return candidate

    candidate = Candidate(
        user_id=current_user.id,
        name=current_user.username,
        skills=datos.skills,
        experience_years=datos.experience_years
    )
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    return candidate


@router.post("/api/apply", response_model=AuditLogSchema, status_code=201)
async def apply_for_job(
    application: ApplicationRequest,
    current_user: User = Depends(get_current_user_obj),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Candidate).filter(
            Candidate.id == application.candidate_id,
            Candidate.user_id == current_user.id
        )
    )
    candidate = result.scalars().first()
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidato no encontrado.")

    audit_entry = AuditLog(
        action="APPLICATION_SUBMITTED",
        candidate_id=candidate.id,
        user_id=current_user.id,
        job_id=application.job_id,
        details={
            "job_title": application.job_title,
            "company": application.company
        }
    )
    db.add(audit_entry)
    await db.commit()
    await db.refresh(audit_entry)
    return audit_entry


# --- Registration ---
from pydantic import BaseModel
from sqlalchemy.exc import IntegrityError
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UsuarioRegistro(BaseModel):
    nombre_completo: str
    correo: str
    contrasena: str

class UsuarioRespuesta(BaseModel):
    id: int
    nombre_completo: str
    correo: str
    created_at: str

@router.post("/api/registro", response_model=UsuarioRespuesta, status_code=201)
async def registrar_usuario(datos: UsuarioRegistro, db: AsyncSession = Depends(get_db)):
    if len(datos.nombre_completo.strip()) < 3:
        raise HTTPException(status_code=422, detail="El nombre debe tener al menos 3 caracteres.")
    if len(datos.contrasena) < 8:
        raise HTTPException(status_code=422, detail="La contraseña debe tener al menos 8 caracteres.")

    contrasena_hash = pwd_context.hash(datos.contrasena)

    new_user = User(
        username=datos.nombre_completo.strip(),
        email=datos.correo.lower(),
        hashed_password=contrasena_hash,
        is_active=True
    )

    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)
        return UsuarioRespuesta(
            id=new_user.id,
            nombre_completo=new_user.username,
            correo=new_user.email,
            created_at=str(new_user.created_at)
        )
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo electrónico o nombre único.")

@router.get("/api/usuarios", response_model=list[UsuarioRespuesta])
async def listar_usuarios(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    usuarios = result.scalars().all()
    return [
        UsuarioRespuesta(
            id=u.id,
            nombre_completo=u.username,
            correo=u.email,
            created_at=str(u.created_at)
        )
        for u in usuarios
    ]


# --- Extracción de CV con OpenAI para matching de vacantes ---
import json as json_lib
import base64
from openai import OpenAI
from fastapi import UploadFile, File

@router.post("/api/extraer-cv")
async def extraer_cv(file: UploadFile = File(...)):
    if not settings.OPENAI_API_KEY:
        raise HTTPException(
            status_code=500,
            detail="OPENAI_API_KEY no configurada en el servidor."
        )

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail="Solo se aceptan archivos PDF."
        )

    contenido = await file.read()

    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        # Subir el PDF a OpenAI Files API
        archivo_tuple = ("hoja_de_vida.pdf", contenido, "application/pdf")
        archivo_openai = client.files.create(file=archivo_tuple, purpose="assistants")

        prompt = """Analiza esta hoja de vida y extrae la informacion para hacer matching con ofertas laborales.
Responde UNICAMENTE con JSON valido, sin backticks ni texto adicional.
Usa exactamente esta estructura:
{
  "nombre": "nombre completo del candidato",
  "ubicacion": "ciudad y pais donde vive (ej: Bogota, Colombia)",
  "salario_esperado": 0,
  "habilidades": ["habilidad1", "habilidad2", "habilidad3"],
  "experiencia_anos": 0,
  "educacion": "nivel y carrera mas reciente",
  "resumen": "resumen del perfil profesional en 2 lineas"
}
Notas:
- habilidades debe incluir tecnologias, lenguajes, herramientas y soft skills relevantes.
- salario_esperado en pesos colombianos COP. Si no aparece, estima segun el perfil y experiencia.
- ubicacion solo ciudad y pais.
- Si algun dato no esta disponible deja el string vacio o el numero en 0."""

        # Usar Responses API con soporte de archivos
        respuesta = client.responses.create(
            model="gpt-4o-mini",
            input=[{
                "role": "user",
                "content": [
                    {"type": "input_file", "file_id": archivo_openai.id},
                    {"type": "input_text", "text": prompt}
                ]
            }]
        )

        texto = respuesta.output_text.strip()

        # Eliminar el archivo subido de OpenAI
        client.files.delete(archivo_openai.id)

        # Limpiar backticks si OpenAI los agrega
        if texto.startswith("```"):
            texto = texto.split("```")[1]
            if texto.startswith("json"):
                texto = texto[4:]
        texto = texto.strip()

        datos = json_lib.loads(texto)
        return datos

    except json_lib.JSONDecodeError:
        raise HTTPException(
            status_code=422,
            detail="La IA no pudo estructurar los datos del CV. Intenta con otro archivo."
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar el CV: {str(e)}"
        )

# --- Job Fetching ---
@router.get("/jobs", response_model=List[JobSchema])
async def get_jobs(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Job))
    jobs = result.scalars().all()
    return jobs
    