from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Importa la configuración de la app y la metadata de los modelos.
from app.core.config import settings
from app.infrastructure.database import Base
# Importar los modelos registra las tablas en Base.metadata (necesario para autogenerate).
from app.domain import models  # noqa: F401

# Objeto de configuración de Alembic.
config = context.config

# Configura el logging desde alembic.ini.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata objetivo para autogenerate.
target_metadata = Base.metadata


def get_sync_database_url() -> str:
    """
    Alembic ejecuta migraciones con un driver síncrono.
    La app usa asyncpg (async); aquí lo convertimos al driver síncrono psycopg.
    """
    url = settings.DATABASE_URL
    if url.startswith("postgresql+asyncpg://"):
        return url.replace("postgresql+asyncpg://", "postgresql+psycopg://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg://", 1)
    return url


def run_migrations_offline() -> None:
    """Ejecuta migraciones en modo 'offline' (genera SQL sin conexión)."""
    context.configure(
        url=get_sync_database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecuta migraciones en modo 'online' (con conexión a la base de datos)."""
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_sync_database_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
