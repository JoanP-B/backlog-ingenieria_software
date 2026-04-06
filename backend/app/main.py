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
