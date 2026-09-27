# Job Matcher MVP

## Integrantes del Proyecto

- Joan Stiven Peralta

## ¿Qué hace este proyecto?

Job Matcher MVP es una plataforma para calcular el "match" (compatibilidad) entre candidatos y vacantes. El sistema integra una interfaz web, un backend de scoring en FastAPI, una base de datos PostgreSQL para almacenamiento de usuarios, candidatos, vacantes y auditoría, y un flujo de automatización con n8n para coordinar las llamadas entre componentes. La extracción de datos del CV (PDF) se apoya en Google Gemini.

## Arquitectura y flujo de uso

1. El usuario se registra o inicia sesión en el frontend (autenticación con JWT).
2. Sube su hoja de vida en PDF; el backend usa Google Gemini para extraer habilidades, experiencia y ubicación.
3. El frontend solicita el ranking de vacantes al backend (`POST /score/preview`), que puntúa el perfil contra cada vacante con el motor de scoring.
4. El usuario revisa las vacantes ordenadas por match y se postula.
5. Cada postulación/scoring se registra en una tabla de auditoría en PostgreSQL, y opcionalmente pasa por un Webhook de n8n.

El cálculo del score vive únicamente en el backend (`ScoringEngine`), de modo que la lógica no se duplica en el cliente. Ponderación: 70% habilidades, 30% experiencia.

## Estructura del proyecto

- `docker-compose.yml`
  - Orquesta los servicios: PostgreSQL, n8n, backend FastAPI, pgAdmin y frontend Nginx.
  - Configura volúmenes persistentes y la inicialización de la base de datos.

- `backend/`
  - Servidor FastAPI con la lógica de scoring, autenticación y persistencia.
  - `app/main.py`: punto de entrada, CORS, logging estructurado y middleware de request.
  - `app/api/endpoints.py`: rutas (login, scoring, perfil, postulaciones, registro, extracción de CV).
  - `app/domain/`: modelos SQLAlchemy, schemas Pydantic y `scoring_engine.py`.
  - `app/core/`: configuración, seguridad (JWT/hashing) y logging.
  - `migrations/`: migraciones de esquema gestionadas con Alembic.
  - `tests/`: pruebas con pytest.

- `frontend/`
  - Interfaz web estática (HTML/JS + Tailwind vía CDN), servida con Nginx en el puerto `8080`.
  - `config.js`: centraliza las URLs de los servicios (backend y n8n).

- `db_init/`
  - `init.sql`: esquema inicial + datos semilla (vacantes de ejemplo y un usuario de prueba). Solo se ejecuta la primera vez que se crea el volumen de PostgreSQL.

- `n8n/`
  - `workflow_base.json`: definición del flujo de orquestación.

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores. Variables principales:

| Variable         | Descripción                                                                 | Por defecto (dev)                                             |
|------------------|-----------------------------------------------------------------------------|--------------------------------------------------------------|
| `DB_USER`        | Usuario de PostgreSQL                                                        | `jobmatcher`                                                 |
| `DB_PASSWORD`    | Contraseña de PostgreSQL                                                     | `secretpassword`                                             |
| `DB_NAME`        | Nombre de la base de datos                                                   | `jobmatcher_db`                                              |
| `JWT_SECRET`     | Clave para firmar los tokens JWT. **Obligatoria y segura en producción.**   | (valor inseguro solo para dev)                               |
| `ENVIRONMENT`    | `development` o `production`. En `production` el backend no arranca si `JWT_SECRET` sigue siendo el valor inseguro. | `development`                        |
| `CORS_ORIGINS`   | Orígenes permitidos para CORS, separados por coma.                          | `http://localhost:8080,http://127.0.0.1:8080,http://localhost:5678` |
| `GEMINI_API_KEY` | Clave de Google Gemini (nivel gratuito) para la extracción de CV. Sin ella, `/api/extraer-cv` responde error. Obtenla en https://aistudio.google.com/app/apikey | (vacío)              |

> Genera un `JWT_SECRET` seguro con:
> ```bash
> python -c "import secrets; print(secrets.token_urlsafe(48))"
> ```

El archivo `.env` está en `.gitignore` y no debe versionarse.

## Cómo ejecutar el proyecto

### Opción A — Todo con Docker Compose (recomendado)

1. Requisitos: Docker y Docker Compose instalados.
2. Desde la raíz del repositorio, crea tu archivo de entorno:
   ```bash
   cp .env.example .env
   ```
   (En Windows PowerShell: `Copy-Item .env.example .env`)
3. Edita `.env` y define al menos `JWT_SECRET` y, si vas a usar la extracción de CV, `GEMINI_API_KEY`.
4. Levanta los servicios:
   ```bash
   docker-compose up -d --build
   ```
5. Accede a:
   - Frontend: `http://localhost:8080`
   - Backend (Swagger): `http://localhost:8000/docs`
   - n8n: `http://localhost:5678`
   - pgAdmin: `http://localhost:5050`

El backend incluye `--reload` en desarrollo (vía el `command` de compose) y un `healthcheck`. En un despliegue de producción usa la imagen tal cual (el `CMD` del `Dockerfile` no incluye `--reload`) y define `ENVIRONMENT=production`.

### Opción B — Backend en local (sin Docker)

1. Ten una instancia de PostgreSQL accesible.
2. Desde `backend/`, crea un entorno virtual e instala dependencias:
   ```bash
   cd backend
   python -m venv .venv
   # Windows PowerShell:
   .venv\Scripts\Activate.ps1
   # Linux/Mac:
   # source .venv/bin/activate
   pip install -r requirements.txt
   ```
3. Configura las variables de entorno (mínimo `DATABASE_URL` y `JWT_SECRET`). Ejemplo:
   ```bash
   # PowerShell
   $env:DATABASE_URL = "postgresql+asyncpg://jobmatcher:secretpassword@localhost:5432/jobmatcher_db"
   $env:JWT_SECRET   = "un-valor-seguro"
   ```
4. Aplica las migraciones de base de datos (ver sección Migraciones).
5. Ejecuta el servidor:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Opción C — Frontend en local

1. Desde `frontend/`, sirve los archivos estáticos con cualquier servidor (por ejemplo):
   ```bash
   cd frontend
   python -m http.server 8080
   ```
2. Abre `http://localhost:8080`. Asegúrate de que el backend y n8n estén disponibles.
3. Si el backend o n8n corren en otras URLs, edita `frontend/config.js` (o define `window.APP_CONFIG` antes de cargarlo).

## Migraciones de base de datos (Alembic)

El esquema se gestiona con Alembic desde `backend/`. Requiere la variable `DATABASE_URL` (la misma de la app; Alembic la convierte internamente al driver síncrono `psycopg`).

```bash
cd backend

# Aplicar todas las migraciones pendientes
alembic upgrade head

# Ver historial y revisión actual
alembic history
alembic current

# Crear una migración autogenerada a partir de cambios en los modelos
alembic revision --autogenerate -m "descripcion del cambio"

# Revertir la última migración
alembic downgrade -1
```

Relación con `db_init/init.sql`: ese script solo corre en el primer arranque del volumen de PostgreSQL e incluye datos semilla. Los cambios de esquema posteriores se hacen con migraciones Alembic, no editando `init.sql`. La migración `0001_initial` refleja el mismo esquema que `init.sql`. Más detalles en `backend/migrations/README.md`.

## Pruebas

Desde `backend/`:

```bash
pip install -r requirements.txt
pytest -q
```

Las pruebas son unitarias y de contrato (motor de scoring, endpoint público `/score/preview`, guard de autenticación y validaciones), y no requieren una base de datos ni conexión de red.

## API principal

- `GET /` — Estado de la API.
- `POST /token` — Login (OAuth2 password flow), devuelve un JWT.
- `POST /api/registro` — Registro de usuario.
- `GET /jobs` — Lista de vacantes.
- `POST /score/preview` — Puntúa un perfil contra varias vacantes **sin** persistir auditoría (usado por el ranking del frontend). No requiere autenticación.
- `POST /score` — Calcula el score de un candidato para una vacante y registra auditoría. Requiere token.
- `GET /api/candidates/me`, `POST /api/candidates` — Perfil del candidato. Requieren token.
- `POST /api/apply` — Registra una postulación. Requiere token.
- `POST /api/extraer-cv` — Extrae datos de un CV en PDF con Google Gemini.

Documentación interactiva completa en `http://localhost:8000/docs`.

## Seguridad

- Autenticación con JWT; contraseñas hasheadas con bcrypt.
- CORS restringido a los orígenes definidos en `CORS_ORIGINS` (no `*`).
- En `ENVIRONMENT=production`, el backend rechaza arrancar si `JWT_SECRET` conserva el valor inseguro por defecto.
- Los errores internos no exponen detalles al cliente; se registran mediante logging estructurado.

## Observabilidad

El backend emite logs estructurados. En `production` el formato es JSON (una línea por evento, apto para agregadores como CloudWatch/Loki/Datadog); en `development` es legible por humanos. Cada petición se registra con un `request_id` (también devuelto en la cabecera `X-Request-ID`), método, ruta, status y latencia.

## Qué falta / próximos pasos

- Frontend más interactivo con manejo de estados y validación completa en la UI.
- Flujos n8n más robustos con manejo de errores y reintentos.
- Pruebas de integración y end-to-end (con base de datos de prueba).
- Despliegue en la nube con entornos `staging`/`production`.
