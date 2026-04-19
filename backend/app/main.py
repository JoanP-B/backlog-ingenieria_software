from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import router

app = FastAPI(title="Job Matcher MVP API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Conectar rutas integradas con PostgreSQL
app.include_router(router)

@app.get("/")
def root():
    return {"mensaje": "API de Vacantes activa."}
