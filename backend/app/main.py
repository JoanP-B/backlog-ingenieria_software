from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router
from app.infrastructure.database import engine, Base

# No creamos las tablas automáticamente en producción con este método, 
# pero es útil para entorno local de test
# Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Matcher MVP API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "Job Matcher API is running"}

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
import sqlite3
import os

app = FastAPI(title="Vacantes API - Registro de Usuarios")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
DB_PATH = "vacantes.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre_completo TEXT NOT NULL,
            correo TEXT UNIQUE NOT NULL,
            contrasena_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


class UsuarioRegistro(BaseModel):
    nombre_completo: str
    correo: EmailStr
    contrasena: str


class UsuarioRespuesta(BaseModel):
    id: int
    nombre_completo: str
    correo: str
    created_at: str


@app.post("/api/registro", response_model=UsuarioRespuesta, status_code=201)
def registrar_usuario(datos: UsuarioRegistro):
    if len(datos.nombre_completo.strip()) < 3:
        raise HTTPException(status_code=422, detail="El nombre debe tener al menos 3 caracteres.")
    if len(datos.contrasena) < 8:
        raise HTTPException(status_code=422, detail="La contraseña debe tener al menos 8 caracteres.")

    contrasena_hash = pwd_context.hash(datos.contrasena)

    conn = get_db()
    try:
        cursor = conn.execute(
            "INSERT INTO usuarios (nombre_completo, correo, contrasena_hash) VALUES (?, ?, ?)",
            (datos.nombre_completo.strip(), datos.correo.lower(), contrasena_hash)
        )
        conn.commit()
        usuario_id = cursor.lastrowid
        usuario = conn.execute(
            "SELECT id, nombre_completo, correo, created_at FROM usuarios WHERE id = ?",
            (usuario_id,)
        ).fetchone()
        return dict(usuario)
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Ya existe una cuenta con ese correo electrónico.")
    finally:
        conn.close()


@app.get("/api/usuarios", response_model=list[UsuarioRespuesta])
def listar_usuarios():
    conn = get_db()
    usuarios = conn.execute(
        "SELECT id, nombre_completo, correo, created_at FROM usuarios ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(u) for u in usuarios]


@app.get("/")
def root():
    return {"mensaje": "API de Vacantes activa. Ir a /docs para ver la documentación."}
