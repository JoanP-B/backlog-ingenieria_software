"""Configuración de logging estructurado para el backend.

En producción emite logs en formato JSON (una línea por evento), fácil de
ingerir por agregadores como CloudWatch, Loki o Datadog. En desarrollo usa un
formato legible por humanos.

No depende de librerías externas: implementa un Formatter JSON propio.
"""
import json
import logging
import sys
from datetime import datetime, timezone

from app.core.config import settings

# Atributos internos de LogRecord que no forman parte del payload "extra".
_RESERVED_ATTRS = {
    "args", "asctime", "created", "exc_info", "exc_text", "filename",
    "funcName", "levelname", "levelno", "lineno", "module", "msecs",
    "message", "msg", "name", "pathname", "process", "processName",
    "relativeCreated", "stack_info", "thread", "threadName", "taskName",
}


class JsonFormatter(logging.Formatter):
    """Formatea cada log como un objeto JSON de una sola línea."""

    def format(self, record: logging.LogRecord) -> str:
        payload = {
            "timestamp": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        # Incluye cualquier campo pasado vía logger.info("...", extra={...}).
        for key, value in record.__dict__.items():
            if key not in _RESERVED_ATTRS and not key.startswith("_"):
                payload[key] = value

        return json.dumps(payload, ensure_ascii=False, default=str)


def configure_logging() -> None:
    """Configura el logging raíz según el entorno. Idempotente."""
    level = logging.INFO
    handler = logging.StreamHandler(sys.stdout)

    if settings.ENVIRONMENT == "production":
        handler.setFormatter(JsonFormatter())
    else:
        handler.setFormatter(
            logging.Formatter(
                "%(asctime)s %(levelname)-5s [%(name)s] %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
            )
        )

    root = logging.getLogger()
    root.setLevel(level)
    # Evita handlers duplicados si se llama más de una vez (p. ej. con --reload).
    root.handlers.clear()
    root.addHandler(handler)

    # Alinea el logging de uvicorn con el nuestro para tener un formato uniforme.
    for uvicorn_logger in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        lg = logging.getLogger(uvicorn_logger)
        lg.handlers.clear()
        lg.propagate = True
