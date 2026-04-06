# Job Matcher MVP

## Sistema de Orquestación y Match de Candidatos

Este proyecto implementa el MVP de un sistema para calcular el "match" entre candidatos y vacantes. Está orquestado mediante n8n, utilizando un motor de scoring en FastAPI y almacenamiento de auditoría técnica en PostgreSQL. Cuenta además con una UI moderna en Vanilla HTML/JS para simular y ejecutar los flujos de "Aplicar".

---

## Flujo de Caso de Uso y Arquitectura

1. **El Usuario (UI Frontend)**: El usuario visualiza la interfaz (`http://localhost:8080`), donde ve las vacantes requeridas y una lista de candidatos potenciales ("Matches de hoy").
2. **Acción**: Al hacer clic en "Calcular Match" para un perfil (ej. "Alice Smith"), el frontend (archivo `app.js`) construye un payload JSON con las características del candidato y la vacante, enviándolo al Webhook de n8n.
3. **Orquestador (n8n)**: El nodo Webhook de n8n (que corre en el puerto 5678) recibe la llamada. El flujo de n8n (que el usuario puede importar desde `n8n/workflow_base.json`) orquesta el flujo de negocio: hace una petición HTTP `POST` interna a la API de Scoring de FastAPI en la red de Docker (`http://backend:8000/score`).
4. **Backend (FastAPI)**: 
   - Recibe y valida los datos con Pydantic (`CandidateSchema` y `JobSchema`).
   - Aplica las reglas internas de scoring: Evalúa las *skills concurrentes* (mayor peso) y *experiencia mínima* (menor peso).
   - Genera una calificación final y estructura la respuesta (Score %).
5. **Auditoría Transaccional (PostgreSQL)**: Antes de responder el endpoint, FastAPI persiste de forma automática un registro (Auditoría Técnica) en la base de datos PostgreSQL (Tabla `audit_logs`). Esta base de datos se monta usando un script SQL e inscribe permanentemente la operación en el volumen de almacenamiento de Docker.
6. **Respuesta a la Vista**: El Backend FastAPI retorna la respuesta a n8n, quien transfiere este retorno al Frontend. La interfaz visual renderiza el modal final con una animación circular al alcanzar el Score en porcentaje.

---

## Setup de Contenedores

1. **Variables de Entorno**: Copia `.env.example` a `.env` (las credenciales por defecto funcionan bien para levantar el MVP).
2. **Levantar Entorno**: Corre el comando en la raíz del proyecto para alzar todos los servicios localmente:
   ```bash
   docker-compose up -d --build
   ```
3. **Servicios Disponibles O-o-t-B (Out of the box)**:
   - **Frontend UI Premium**: [http://localhost:8080](http://localhost:8080)
   - **Orquestador n8n**: [http://localhost:5678](http://localhost:5678)
   - **FastAPI / Documentación Backend OpenAPI (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## ¿Dónde está el flujo de n8n?
El archivo JSON matriz con el flujo inicial está documentado en `n8n/workflow_base.json`. **Para activarlo**, debes entrar a la interfaz gráfica de tu n8n local, ir al menú de la derecha, y seleccionar "Import from File" cargando dicho documento. Esto iniciará de inmediato el conector de Webhook y el de API HTTP.

## ¿Dónde se almacena la información usando PostgreSQL?
La estructura de la base de datos (con las tablas como `audit_logs`, `candidates`, `jobs`) se autoconstruye al levantar el Docker Compose gracias al script ubicado en `db_init/init.sql`. Físicamente, los datos están gestionados por el contenedor de BD `job_matcher_db`, y los archivos de Postgres persisten localmente en tu host a través del volumen `postgres_data` registrado en el `docker-compose.yml`. Todos los logs de auditoría sobre quién corrió el Match y qué score dió residen ahí.
