# Job Matcher MVP

## Integrantes del Proyecto

- Joan Stiven Peralta
- Gisel Jaramillo
- Sebastian Vasquez
- Juan Fernando Duque

## ¿Qué hace este proyecto?

Job Matcher MVP es una plataforma de orquestación para calcular el "match" entre candidatos y vacantes. El sistema integra una interfaz web, un backend de scoring en FastAPI, una base de datos PostgreSQL para almacenamiento de usuarios, candidatos, vacantes y auditoría, y un flujo de automatización con n8n para coordinar las llamadas entre componentes.

## Arquitectura y flujo de uso

1. El usuario abre la interfaz del frontend en el navegador.
2. El frontend prepara la información del candidato y la vacante y la envía a un Webhook de n8n.
3. n8n recibe la solicitud y orquesta el proceso, enviando el payload al backend FastAPI.
4. El backend calcula el score de match y persiste un registro de auditoría en PostgreSQL.
5. n8n recibe la respuesta del backend y regresa el resultado al frontend.
6. El frontend muestra el resultado al usuario en pantalla.

## Estructura del proyecto

- `docker-compose.yml`
  - Define los servicios Docker del proyecto: PostgreSQL, n8n, backend FastAPI, pgAdmin y frontend Nginx.
  - Configura volúmenes persistentes para datos y la inicialización de la base de datos.

- `n8n/`
  - Contiene `workflow_base.json`, la definición del flujo de trabajo de n8n.
  - Este flujo maneja la recepción del Webhook, la llamada al backend y el envío de la respuesta al frontend.

- `frontend/`
  - Contiene la interfaz web estática: `index.html`, `app.js`, `dashboard.css`, y páginas de vista.
  - Se sirve usando un contenedor Nginx que expone la UI en el puerto `8080`.

- `db_init/`
  - Incluye `init.sql`, el script SQL de inicialización de la base de datos.
  - Crea tablas `users`, `candidates`, `jobs` y `audit_logs`, además de insertar datos de prueba.

- `backend/`
  - Contiene el servidor FastAPI con rutas y lógica de scoring.
  - El archivo `backend/app/main.py` expone la API principal y configura CORS.
  - Otros módulos incluyen validación, seguridad y conexión con PostgreSQL.

## Qué hace cada componente

- `docker-compose.yml`
  - Orquesta los contenedores del proyecto en un solo comando.
  - Expone puertos `8080`, `5678`, `8000`, `5050` y `5432` para frontend, n8n, backend, pgAdmin y PostgreSQL.

- `n8n/`
  - Define el flujo de orquestación que conecta la UI con el backend.
  - Permite modelar lógica de negocio sin codificar todos los pasos en el frontend o backend.

- `frontend/`
  - Contiene la aplicación web que muestra vacantes y lanza las solicitudes de match.
  - La UI interactúa con n8n y consume el resultado de scoring.

- `db_init/`
  - Proporciona el esquema inicial y los datos semilla para PostgreSQL.
  - Se ejecuta automáticamente cuando el contenedor de PostgreSQL se inicia.

- `backend/`
  - Ejecuta el motor de scoring con FastAPI.
  - Procesa el JSON de candidato/vacante, calcula la puntuación y persiste auditoría.

## Cómo ejecutar el proyecto

### Entorno local con Docker Compose

1. Abre una terminal en la raíz del repositorio:
   ```bash
   cd c:/ruta-proyecto/backlog-ingenieria_software
   ```
2. Asegúrate de tener Docker instalado.
3. Ejecuta:
   ```bash
   docker-compose up -d --build
   ```
4. Accede a:
   - Frontend: `http://localhost:8080`
   - n8n: `http://localhost:5678`
   - Backend Swagger: `http://localhost:8000/docs`
   - pgAdmin: `http://localhost:5050`

### Ejecutar solo backend localmente

1. Abre una terminal en la carpeta `backend/`:
   ```bash
   cd c:/ruta-proyecto/backlog-ingenieria_software/backend
   ```
2. Instala las dependencias de Python dentro de `backend/`.
3. Configura la variable `DATABASE_URL` con la conexión a PostgreSQL.
4. Ejecuta el servidor FastAPI desde `backend/`:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

### Ejecutar solo frontend localmente

1. Abre una terminal en la carpeta `frontend/`:
   ```bash
   cd c:/ruta-proyecto/backlog-ingenieria_software/frontend
   ```
2. Abre `frontend/index.html` directamente en el navegador o usa un servidor estático desde esa carpeta.
3. Asegúrate de que `n8n` y `backend` estén disponibles en las rutas configuradas.

## Qué falta implementar

- Validación completa y autenticación de usuarios en la UI y API.
- Un frontend más interactivo y con manejo de estados real.
- Flujos n8n más robustos con manejo de errores y reintentos.
- Pruebas automatizadas de integración y de extremo a extremo.
- Despliegue en la nube y entornos `staging`/`production` con variable de entorno segura.

## Notas adicionales

- El frontend se sirve con Nginx desde `frontend/`.
- PostgreSQL se inicializa con `db_init/init.sql` y guarda los datos en el volumen `postgres_data`.
- El backend usa `backend/app/main.py` como punto de entrada y permite peticiones CORS desde cualquier origen.
