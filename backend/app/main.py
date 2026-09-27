import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.endpoints import router
from app.core.config import settings
from app.core.logging_config import configure_logging

# Configura el logging estructurado antes de crear la app.
configure_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Job Matcher API iniciada", extra={"environment": settings.ENVIRONMENT})
    yield
    logger.info("Job Matcher API detenida")


app = FastAPI(title="Job Matcher MVP API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Registra cada petición con un id de correlación, status y latencia."""
    request_id = str(uuid.uuid4())
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = round((time.perf_counter() - start) * 1000, 2)
        logger.exception(
            "Unhandled error while processing request",
            extra={
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "duration_ms": duration_ms,
            },
        )
        raise

    duration_ms = round((time.perf_counter() - start) * 1000, 2)
    logger.info(
        "request",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": duration_ms,
        },
    )
    response.headers["X-Request-ID"] = request_id
    return response


# Conectar rutas integradas con PostgreSQL
app.include_router(router)


@app.get("/")
def root():
    return {"mensaje": "API de Vacantes activa."}
