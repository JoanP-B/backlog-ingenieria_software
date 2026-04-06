import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Job Matcher MVP API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://jobmatcher:secretpassword@localhost:5432/jobmatcher_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey_for_jwt")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    class Config:
        env_file = ".env"

settings = Settings()
