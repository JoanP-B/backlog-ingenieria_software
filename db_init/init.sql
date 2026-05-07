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
DROP TABLE IF EXISTS jobs CASCADE;
CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    salary VARCHAR(100),
    min_experience_years INTEGER,
    required_skills JSONB NOT NULL,
    description TEXT,
    functions JSONB,
    offerings JSONB,
    closing TEXT,
    keywords JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insertar vacantes iniciales
INSERT INTO jobs (id, title, company, location, salary, min_experience_years, required_skills, description, functions, offerings, closing, keywords)
VALUES 
(
    'J001', 
    'Ingeniero de Software Backend', 
    'Bancolombia', 
    'Medellín — Híbrido', 
    'COP 7,500,000', 
    3, 
    '["Python", "FastAPI", "PostgreSQL", "Docker", "Git"]'::jsonb, 
    'Únete al equipo de tecnología del banco más grande de Colombia para construir microservicios financieros de alto rendimiento que procesan millones de transacciones diarias.', 
    '["Diseñar e implementar microservicios con FastAPI para el core bancario.", "Optimizar consultas sobre bases de datos PostgreSQL con millones de registros.", "Integrar servicios de pagos, notificaciones y seguridad bancaria.", "Participar en revisiones de código y cumplimiento de estándares PCI-DSS.", "Colaborar con equipos de ciberseguridad para garantizar la protección de datos."]'::jsonb, 
    '["Salario competitivo + bonificaciones por desempeño.", "Modalidad híbrida: 3 días en casa, 2 en oficina.", "Plan de salud y vida para ti y tu familia.", "Acceso a la plataforma de formación Bancolombia Academy.", "Préstamos especiales para empleados con tasas preferenciales."]'::jsonb, 
    'En Bancolombia creemos en el talento colombiano. Si quieres construir el futuro financiero del país con tecnología de punta, este es tu lugar.', 
    '["Fintech", "Backend", "Python", "Banca", "Híbrido"]'::jsonb
),
(
    'J002', 
    'Ingeniero de Datos Senior', 
    'Rappi', 
    'Bogotá — Remoto', 
    'COP 9,000,000', 
    4, 
    '["Python", "SQL", "ETL", "Cloud", "Machine Learning"]'::jsonb, 
    'Sé parte del equipo de datos que mueve a millones de usuarios en toda Latinoamérica. Construirás pipelines de datos que alimentan las decisiones de negocio en tiempo real.', 
    '["Diseñar y mantener pipelines de datos con Apache Spark y Airflow.", "Construir modelos de Machine Learning para personalización y predicción de demanda.", "Optimizar el procesamiento de más de 50 millones de eventos diarios.", "Colaborar con Product y Engineering para definir métricas clave del negocio.", "Garantizar la calidad y gobernanza de datos en toda la plataforma."]'::jsonb, 
    '["Salario con ajuste trimestral.", "Stock options en una de las startups más grandes de LATAM.", "Trabajo 100% remoto desde cualquier ciudad de Colombia.", "Budget anual para conferencias y certificaciones cloud.", "Acceso a Rappi Pro y beneficios internos."]'::jsonb, 
    'Rappi está transformando cómo LATAM consume. Si quieres impactar la vida de millones de personas con datos, aplica hoy.', 
    '["Data Engineering", "LATAM", "Remoto", "Startups", "ML"]'::jsonb
),
(
    'J003', 
    'Full Stack Developer', 
    'Globant Colombia', 
    'Bogotá — Remoto Global', 
    'COP 8,500,000', 
    3, 
    '["JavaScript", "React", "Node.js", "SQL", "Git"]'::jsonb, 
    'Globant, empresa líder en transformación digital con presencia en 30 países, busca desarrolladores Full Stack para trabajar con clientes Fortune 500 de USA y Europa.', 
    '["Desarrollar aplicaciones web escalables con React y Node.js.", "Integrarse a squads ágiles internacionales trabajando con clientes de USA.", "Participar en code reviews y definición de arquitectura de soluciones.", "Implementar mejores prácticas de CI/CD y pruebas automatizadas.", "Comunicarse directamente con stakeholders de negocio en inglés."]'::jsonb, 
    '["Proyectos con marcas globales: Disney, Electronic Arts, Google.", "Salario en pesos con bonos en dólares.", "Trabajo remoto con posibilidad de rotaciones internacionales.", "Plan de carrera: Junior → Senior → Tech Lead.", "Seguro médico complementario y días adicionales de vacaciones."]'::jsonb, 
    'En Globant trabajarás con los mejores ingenieros de LATAM en proyectos que llegan a cientos de millones de usuarios. ¿Estás listo para el desafío?', 
    '["Full Stack", "Internacional", "React", "Node.js", "Remoto"]'::jsonb
),
(
    'J004', 
    'DevOps / SRE Engineer', 
    'Grupo Éxito Tech', 
    'Medellín — Híbrido', 
    'COP 8,000,000', 
    3, 
    '["Docker", "Kubernetes", "AWS", "Linux", "CI/CD"]'::jsonb, 
    'El equipo tech del Grupo Éxito gestiona la infraestructura del e-commerce más grande de Colombia. Buscamos un SRE que garantice disponibilidad 24/7 durante picos de hasta 100K usuarios simultáneos.', 
    '["Administrar clústeres Kubernetes en AWS para el portal de e-commerce.", "Implementar pipelines CI/CD con GitHub Actions y ArgoCD.", "Monitorear sistemas con Grafana, Prometheus y CloudWatch.", "Responder a incidentes de producción y crear postmortems.", "Optimizar costos de infraestructura cloud sin sacrificar disponibilidad."]'::jsonb, 
    '["Bono de disponibilidad para guardia nocturna.", "Descuentos en todas las marcas del Grupo Éxito.", "Modalidad híbrida con oficinas en El Poblado.", "Certificaciones AWS pagadas por la empresa.", "Plan de pensión voluntaria con aporte empresarial."]'::jsonb, 
    'Sé parte del equipo que mantiene vivo el e-commerce de millones de colombianos. En Grupo Éxito Tech, cada línea de código tiene impacto real.', 
    '["DevOps", "SRE", "AWS", "E-commerce", "Colombia"]'::jsonb
),
(
    'J005', 
    'Desarrollador Mobile Flutter', 
    'Nequi', 
    'Medellín — Remoto', 
    'COP 7,000,000', 
    2, 
    '["Flutter", "Dart", "Git", "SQL", "API REST"]'::jsonb, 
    'Nequi, la app financiera con más de 20 millones de usuarios en Colombia, busca un desarrollador Mobile para seguir revolucionando cómo los colombianos manejan su dinero.', 
    '["Desarrollar nuevas funcionalidades en la app Nequi con Flutter.", "Optimizar el rendimiento y la experiencia de usuario en iOS y Android.", "Integrar APIs RESTful de forma segura y eficiente.", "Asegurar la calidad del código mediante pruebas unitarias y de integración.", "Trabajar colaborativamente en un entorno ágil con diseñadores UX/UI."]'::jsonb, 
    '["Salario competitivo con beneficios extralegales.", "Cultura ágil, dinámica y de innovación constante.", "Trabajo 100% remoto desde cualquier lugar de Colombia.", "Oportunidades de crecimiento y movilidad interna.", "Día libre de cumpleaños y días familiares adicionales."]'::jsonb, 
    'Nequi te permite estar en el día a día de las personas. Únete y ayúdanos a seguir construyendo la mejor experiencia financiera del país.', 
    '["Mobile", "Flutter", "App", "Fintech", "Remoto"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    company = EXCLUDED.company,
    location = EXCLUDED.location,
    salary = EXCLUDED.salary,
    min_experience_years = EXCLUDED.min_experience_years,
    required_skills = EXCLUDED.required_skills,
    description = EXCLUDED.description,
    functions = EXCLUDED.functions,
    offerings = EXCLUDED.offerings,
    closing = EXCLUDED.closing,
    keywords = EXCLUDED.keywords;
