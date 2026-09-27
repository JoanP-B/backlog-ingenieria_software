FROM python:3.11-slim

# Evita archivos .pyc y fuerza salida sin buffer para logs en contenedor
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Comando por defecto: producción (sin --reload, sin recarga de código).
# En desarrollo, docker-compose sobreescribe este comando para activar --reload.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
