from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta

from app.core import security
from app.core.config import settings
from app.infrastructure.database import get_db
from app.domain.schemas import Token, ScoringRequest, ScoringResponse
from app.domain.models import AuditLog

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Authentication ---
@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    # Simulando autenticación
    if form_data.username == "" or form_data.password == "":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": form_data.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        from jose import jwt, JWTError
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return username

# --- Scoring ---
@router.post("/score", response_model=ScoringResponse)
def calculate_score(request: ScoringRequest, db: Session = Depends(get_db)):
    # Deshabilitado Depends(get_current_user) temporalmente para facilitar la prueba n8n MVP
    candidate = request.candidate
    job = request.job
    
    skill_match_count = sum(1 for skill in candidate.skills if skill in job.required_skills)
    total_required = len(job.required_skills)
    skill_score = (skill_match_count / total_required * 100) if total_required > 0 else 0
    
    experience_score = 0
    if candidate.experience_years >= job.min_experience_years:
        experience_score = 100
    else:
        experience_score = (candidate.experience_years / job.min_experience_years * 100) if job.min_experience_years > 0 else 0
        
    final_score = (skill_score * 0.7) + (experience_score * 0.3)
    final_score = round(final_score, 2)
    
    details = {
        "skill_match_count": skill_match_count,
        "total_required": total_required,
        "skill_score": skill_score,
        "experience_score": experience_score,
        "matched_skills": [s for s in candidate.skills if s in job.required_skills]
    }
    
    audit_entry = AuditLog(
        action="SCORING_COMPLETED",
        candidate_id=candidate.id,
        job_id=job.id,
        score=final_score,
        details=details
    )
    db.add(audit_entry)
    db.commit()
    db.refresh(audit_entry)
    
    return ScoringResponse(
        candidate_id=candidate.id,
        job_id=job.id,
        score=final_score,
        details=details
    )
