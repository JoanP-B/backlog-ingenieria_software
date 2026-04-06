-- init.sql: Inicialización de la base de datos para Job Matcher

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    action VARCHAR(255) NOT NULL,
    candidate_id VARCHAR(255),
    job_id VARCHAR(255),
    score DECIMAL(5,2),
    details JSONB
);

CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_candidate_job ON audit_logs(candidate_id, job_id);

-- Tabla para usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Usuario inicial de prueba para autenticación
INSERT INTO users (username, email, hashed_password, is_active)
VALUES (
    'svasquezs1',
    'svasquezs1@example.com',
    '$2b$12$37Hg7g.CE7gmNtgpIQJEPeAidfk6Vgz1ks0/rZSs4GAzU.RADIjZG',
    TRUE
)
ON CONFLICT DO NOTHING;

-- Tabla para candidatos
CREATE TABLE IF NOT EXISTS candidates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    skills JSONB NOT NULL,
    experience_years INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabla para vacantes
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    required_skills JSONB NOT NULL,
    min_experience_years INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
