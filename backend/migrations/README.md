# Migraciones de base de datos (Alembic)

Este directorio contiene las migraciones de esquema gestionadas con [Alembic](https://alembic.sqlalchemy.org/).

## Comandos

Todos los comandos se ejecutan desde `backend/` y requieren la variable de entorno
`DATABASE_URL` (la misma que usa la app). Alembic la convierte internamente al
driver síncrono `psycopg` para ejecutar las migraciones.

```bash
# Aplicar todas las migraciones pendientes
alembic upgrade head

# Ver el historial y la revisión actual
alembic history
alembic current

# Crear una nueva migración autogenerada a partir de cambios en los modelos
alembic revision --autogenerate -m "descripcion del cambio"

# Revertir la última migración
alembic downgrade -1
```

## Relación con `db_init/init.sql`

`db_init/init.sql` solo se ejecuta la **primera** vez que se crea el volumen de
PostgreSQL e incluye datos semilla (vacantes de ejemplo y un usuario de prueba).

A partir de ahí, los cambios de esquema deben hacerse mediante migraciones Alembic,
no editando `init.sql`. La migración inicial `0001_initial` refleja exactamente el
esquema que crea `init.sql`, por lo que ambos son consistentes.

En un despliegue nuevo sin datos semilla, basta con `alembic upgrade head` para
crear todo el esquema.
