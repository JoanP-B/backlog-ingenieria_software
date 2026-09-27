import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    PROJECT_NAME: str = "Job Matcher MVP API"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://jobmatcher:secretpassword@localhost:5432/jobmatcher_db")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey_for_jwt")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    # Modelo de Gemini usado para la extracción de CV. Configurable por si Google
    # cambia la disponibilidad de modelos en el nivel gratuito.
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
    # Orígenes permitidos para CORS (separados por coma). Por defecto solo el frontend local.
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:8080,http://127.0.0.1:8080,http://localhost:5678"
    )

    # Entorno de ejecución: "development" | "production"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


# Valor inseguro conocido que NO debe usarse fuera de desarrollo.
_INSECURE_JWT_SECRET = "supersecretkey_for_jwt"

settings = Settings()

# En producción, rechazar el arranque si el JWT_SECRET sigue siendo el valor por defecto inseguro.
if settings.ENVIRONMENT == "production" and settings.JWT_SECRET == _INSECURE_JWT_SECRET:
    raise RuntimeError(
        "JWT_SECRET no configurado: define un valor seguro en la variable de entorno "
        "JWT_SECRET antes de ejecutar en producción."
    )
