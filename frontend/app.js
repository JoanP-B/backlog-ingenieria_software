// ============================================================
// app.js — Job Matcher AI — Lógica unificada del Frontend
// ============================================================

function logout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
    window.location.href = "index.html";
}

// ============================================================
// 1. LOGIN PAGE (index.html)
// ============================================================
const loginForm = document.getElementById("login-form");
if (loginForm) {
    const identifierInput = document.getElementById("login-identifier");
    const passwordInput   = document.getElementById("login-password");
    const loginMessage    = document.getElementById("login-message");
    const loginBtn        = document.getElementById("login-btn");

    function showMessage(message, isError = true) {
        loginMessage.textContent = message;
        loginMessage.className = isError
            ? "p-4 rounded-xl mb-6 text-sm text-center border bg-red-500/10 border-red-500/30 text-red-400"
            : "p-4 rounded-xl mb-6 text-sm text-center border bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
        loginMessage.classList.remove("hidden");
    }

    function clearMessage() {
        loginMessage.classList.add("hidden");
    }

    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearMessage();

        const usernameOrEmail = identifierInput.value.trim();
        const password        = passwordInput.value;

        if (!usernameOrEmail || !password) {
            showMessage("Favor ingresar información válida en los campos obligatorios.");
            return;
        }

        loginBtn.disabled   = true;
        loginBtn.innerHTML  = '<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Verificando...';

        try {
            const response = await fetch("http://localhost:8000/token", {
                method:  "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body:    new URLSearchParams({ username: usernameOrEmail, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("username", usernameOrEmail);
                showMessage("¡Acceso exitoso! Redirigiendo...", false);
                setTimeout(() => window.location.href = "vistaPrincipal.html", 600);
                return;
            }

            showMessage(data.detail || "Correo o contraseña incorrectos. Intenta nuevamente.");
        } catch (_) {
            showMessage("No fue posible conectar con el servidor. Verifica que el backend esté activo.");
        } finally {
            loginBtn.disabled  = false;
            loginBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión';
        }
    });
}

// ============================================================
// 2. DASHBOARD (dashboard.html)
// ============================================================
const vacanciesList = document.getElementById("vacancies-list");
if (vacanciesList) {

    // --- Auth guard ---
    if (!localStorage.getItem("access_token")) {
        window.location.href = "index.html";
    }

    // --- Username display ---
    const usernameDisplay = document.getElementById("current-user-display");
    if (usernameDisplay) {
        usernameDisplay.textContent = localStorage.getItem("username") || "Usuario";
    }

    // --- Toast si viene del flujo de análisis ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("analyzed") === "true") {
        showToast("success-toast", 4500);
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    function showToast(id, duration = 4000) {
        const toast = document.getElementById(id);
        if (!toast) return;
        toast.classList.remove("hidden", "opacity-0", "-translate-y-2");
        toast.classList.add("opacity-100", "translate-y-0");
        setTimeout(() => {
            toast.classList.remove("opacity-100", "translate-y-0");
            toast.classList.add("opacity-0", "-translate-y-2");
            setTimeout(() => toast.classList.add("hidden"), 500);
        }, duration);
    }

    // --- Perfil del candidato (vacío hasta que suba el CV) ---
    const candidate = {
        id:               "C001",
        name:             localStorage.getItem("username") || "Candidato Demo",
        skills:           [],
        experience_years: 0
    };

    // --- Motor de scoring ---
    function computeScore(job) {
        const matched    = candidate.skills.filter(s => job.required_skills.includes(s)).length;
        const skillScore = job.required_skills.length > 0
            ? (matched / job.required_skills.length) * 100
            : 0;
        const expScore   = candidate.experience_years >= job.min_experience_years
            ? 100
            : (job.min_experience_years > 0
                ? (candidate.experience_years / job.min_experience_years) * 100
                : 0);
        return Math.round((skillScore * 0.7) + (expScore * 0.3));
    }

    // --- Vacantes ---
    const rawJobs = [
        {
            id: "J001",
            title: "Desarrollador Backend Python",
            company: "Bancolombia",
            location: "Medellín — Híbrido",
            salary: "COP 7,500,000",
            min_experience_years: 3,
            required_skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
            description: "Únete al equipo de tecnología del banco más grande de Colombia para construir microservicios financieros de alto rendimiento que procesan millones de transacciones diarias.",
            functions: [
                "Diseñar e implementar microservicios con FastAPI para el core bancario.",
                "Optimizar consultas sobre bases de datos PostgreSQL con millones de registros.",
                "Integrar servicios de pagos, notificaciones y seguridad bancaria.",
                "Participar en revisiones de código y cumplimiento de estándares PCI-DSS.",
                "Colaborar con equipos de ciberseguridad para garantizar la protección de datos."
            ],
            offerings: [
                "Salario competitivo + bonificaciones por desempeño.",
                "Modalidad híbrida: 3 días en casa, 2 en oficina.",
                "Plan de salud y vida para ti y tu familia.",
                "Acceso a la plataforma de formación Bancolombia Academy.",
                "Préstamos especiales para empleados con tasas preferenciales."
            ],
            closing: "En Bancolombia creemos en el talento colombiano. Si quieres construir el futuro financiero del país con tecnología de punta, este es tu lugar.",
            keywords: ["Fintech", "Backend", "Python", "Banca", "Híbrido"]
        },
        {
            id: "J002",
            title: "Ingeniero de Datos Senior",
            company: "Rappi",
            location: "Bogotá — Remoto",
            salary: "COP 9,000,000",
            min_experience_years: 4,
            required_skills: ["Python", "SQL", "ETL", "Cloud", "Machine Learning"],
            description: "Sé parte del equipo de datos que mueve a millones de usuarios en toda Latinoamérica. Construirás pipelines de datos que alimentan las decisiones de negocio en tiempo real.",
            functions: [
                "Diseñar y mantener pipelines de datos con Apache Spark y Airflow.",
                "Construir modelos de Machine Learning para personalización y predicción de demanda.",
                "Optimizar el procesamiento de más de 50 millones de eventos diarios.",
                "Colaborar con Product y Engineering para definir métricas clave del negocio.",
                "Garantizar la calidad y gobernanza de datos en toda la plataforma."
            ],
            offerings: [
                "Salario con ajuste trimestral.",
                "Stock options en una de las startups más grandes de LATAM.",
                "Trabajo 100% remoto desde cualquier ciudad de Colombia.",
                "Budget anual para conferencias y certificaciones cloud.",
                "Acceso a Rappi Pro y beneficios internos."
            ],
            closing: "Rappi está transformando cómo LATAM consume. Si quieres impactar la vida de millones de personas con datos, aplica hoy.",
            keywords: ["Data Engineering", "LATAM", "Remoto", "Startups", "ML"]
        },
        {
            id: "J003",
            title: "Full Stack Developer",
            company: "Globant Colombia",
            location: "Bogotá — Remoto Global",
            salary: "COP 8,500,000",
            min_experience_years: 3,
            required_skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
            description: "Globant, empresa líder en transformación digital con presencia en 30 países, busca desarrolladores Full Stack para trabajar con clientes Fortune 500 de USA y Europa.",
            functions: [
                "Desarrollar aplicaciones web escalables con React y Node.js.",
                "Integrarse a squads ágiles internacionales trabajando con clientes de USA.",
                "Participar en code reviews y definición de arquitectura de soluciones.",
                "Implementar mejores prácticas de CI/CD y pruebas automatizadas.",
                "Comunicarse directamente con stakeholders de negocio en inglés."
            ],
            offerings: [
                "Proyectos con marcas globales: Disney, Electronic Arts, Google.",
                "Salario en pesos con bonos en dólares.",
                "Trabajo remoto con posibilidad de rotaciones internacionales.",
                "Plan de carrera: Junior → Senior → Tech Lead.",
                "Seguro médico complementario y días adicionales de vacaciones."
            ],
            closing: "En Globant trabajarás con los mejores ingenieros de LATAM en proyectos que llegan a cientos de millones de usuarios. ¿Estás listo para el desafío?",
            keywords: ["Full Stack", "Internacional", "React", "Node.js", "Remoto"]
        },
        {
            id: "J004",
            title: "DevOps / SRE Engineer",
            company: "Grupo Éxito Tech",
            location: "Medellín — Híbrido",
            salary: "COP 8,000,000",
            min_experience_years: 3,
            required_skills: ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD"],
            description: "El equipo tech del Grupo Éxito gestiona la infraestructura del e-commerce más grande de Colombia. Buscamos un SRE que garantice disponibilidad 24/7 durante picos de hasta 100K usuarios simultáneos.",
            functions: [
                "Administrar clústeres Kubernetes en AWS para el portal de e-commerce.",
                "Implementar pipelines CI/CD con GitHub Actions y ArgoCD.",
                "Monitorear sistemas con Grafana, Prometheus y CloudWatch.",
                "Responder a incidentes de producción y crear postmortems.",
                "Optimizar costos de infraestructura cloud sin sacrificar disponibilidad."
            ],
            offerings: [
                "Bono de disponibilidad para guardia nocturna.",
                "Descuentos en todas las marcas del Grupo Éxito.",
                "Modalidad híbrida con oficinas en El Poblado.",
                "Certificaciones AWS pagadas por la empresa.",
                "Plan de pensión voluntaria con aporte empresarial."
            ],
            closing: "Sé parte del equipo que mantiene vivo el e-commerce de millones de colombianos. En Grupo Éxito Tech, cada línea de código tiene impacto real.",
            keywords: ["DevOps", "SRE", "AWS", "E-commerce", "Colombia"]
        },
        {
            id: "J005",
            title: "Desarrollador Mobile Flutter",
            company: "Nequi",
            location: "Medellín — Remoto",
            salary: "COP 7,000,000",
            min_experience_years: 2,
            required_skills: ["Flutter", "Dart", "Git", "SQL", "API REST"],
            description: "Nequi, la app financiera con más de 20 millones de usuarios en Colombia, busca un desarrollador Mobile para seguir revolucionando cómo los colombianos manejan su dinero.",
            functions: [
                "Desarrollar nuevas funcionalidades en la app Nequi con Flutter.",
                "Optimizar el rendimiento y la experiencia de usuario en iOS y Android.",
                "Integrar APIs bancarias y pasarelas de pago de forma segura.",
                "Participar en pruebas A/B para mejorar la conversión de usuarios.",
                "Colaborar con diseñadores UX para implementar el sistema de diseño de Nequi."
            ],
            offerings: [
                "Ser parte de una fintech colombiana con impacto social real.",
                "Trabajo 100% remoto con reuniones asíncronas.",
                "Cuenta Nequi Plus sin costo y beneficios financieros exclusivos.",
                "Bono anual por cumplimiento de metas.",
                "Ambiente de trabajo joven, diverso e innovador."
            ],
            closing: "En Nequi estamos democratizando las finanzas en Colombia. Si quieres construir tecnología con propósito y llegar a 20 millones de personas, únete.",
            keywords: ["Mobile", "Flutter", "Fintech", "Remoto", "iOS/Android"]
        },
        {
            id: "J006",
            title: "Analista de Ciberseguridad",
            company: "EPM",
            location: "Medellín — Presencial",
            salary: "COP 6,500,000",
            min_experience_years: 2,
            required_skills: ["Linux", "Redes", "Python", "Seguridad", "SQL"],
            description: "EPM, empresa de servicios públicos más grande de Colombia, busca un analista de ciberseguridad para proteger la infraestructura crítica que da agua, luz y gas a millones de hogares.",
            functions: [
                "Monitorear eventos de seguridad en el SIEM corporativo.",
                "Realizar análisis de vulnerabilidades en sistemas OT e IT.",
                "Responder a incidentes de seguridad y coordinar la contención.",
                "Implementar controles de seguridad en redes industriales.",
                "Elaborar informes de riesgo para la alta dirección."
            ],
            offerings: [
                "Estabilidad laboral en una empresa pública líder.",
                "Salario + auxilio de alimentación y transporte.",
                "Fondo de empleados con créditos a bajo interés.",
                "Plan de formación en ciberseguridad certificada.",
                "Horario de lunes a viernes sin turnos nocturnos."
            ],
            closing: "En EPM protegemos la infraestructura que hace posible la vida cotidiana de los colombianos. Únete si quieres trabajar en ciberseguridad con impacto real.",
            keywords: ["Ciberseguridad", "Infraestructura", "Linux", "EPM", "Medellín"]
        },
        {
            id: "J007",
            title: "Desarrollador Frontend React",
            company: "Addi",
            location: "Bogotá — Remoto",
            salary: "COP 6,800,000",
            min_experience_years: 2,
            required_skills: ["JavaScript", "React", "Tailwind CSS", "Git", "API REST"],
            description: "Addi es la plataforma de crédito digital más grande de Colombia con operaciones en Brasil y México. Buscamos un Frontend Developer para construir la experiencia que usan millones de compradores cada día.",
            functions: [
                "Construir componentes reutilizables con React y Tailwind CSS.",
                "Integrar el checkout de crédito en tiendas aliadas de Colombia y LATAM.",
                "Optimizar la performance y accesibilidad de la aplicación web.",
                "Colaborar con el equipo de diseño en el sistema de diseño de Addi.",
                "Implementar pruebas automatizadas con Jest y Testing Library."
            ],
            offerings: [
                "Trabajo 100% remoto con equipo distribuido en LATAM.",
                "Equity en una startup de alto crecimiento.",
                "Presupuesto mensual para home office y bienestar.",
                "Acceso a plataformas de aprendizaje como Platzi y Coursera.",
                "Días de descanso adicionales por salud mental."
            ],
            closing: "Addi está redefiniendo el acceso al crédito en Latinoamérica. Si quieres construir productos que cambian vidas, este es tu equipo.",
            keywords: ["Frontend", "React", "Fintech", "LATAM", "Remoto"]
        },
        {
            id: "J008",
            title: "Ingeniero de Machine Learning",
            company: "Frubana",
            location: "Bogotá — Híbrido",
            salary: "COP 8,200,000",
            min_experience_years: 3,
            required_skills: ["Python", "Machine Learning", "SQL", "Cloud", "Pandas"],
            description: "Frubana es el marketplace B2B de alimentos frescos más grande de Colombia y México. Usamos ML para predecir demanda, optimizar rutas y reducir el desperdicio alimentario.",
            functions: [
                "Desarrollar modelos de predicción de demanda para más de 5000 productos frescos.",
                "Optimizar algoritmos de ruteo para flota de entrega con IA.",
                "Construir pipelines de ML en producción con MLflow y Airflow.",
                "Analizar datos de más de 50,000 restaurantes y tiendas aliadas.",
                "Colaborar con equipos de operaciones para implementar soluciones en campo."
            ],
            offerings: [
                "Trabajar en un problema con impacto social: reducir el desperdicio de alimentos.",
                "Modalidad híbrida con oficina en Bogotá.",
                "Stock options en startup respaldada por SoftBank.",
                "Budget para certificaciones de ML y cloud.",
                "Almuerzo pagado en días de oficina."
            ],
            closing: "En Frubana usamos la tecnología para hacer más eficiente la cadena alimentaria de LATAM. Si te apasiona el ML con impacto real, aplica ya.",
            keywords: ["Machine Learning", "Agritech", "Python", "LATAM", "Startups"]
        },
        {
            id: "J009",
            title: "Tech Lead Backend",
            company: "Sura Asset Management",
            location: "Medellín — Híbrido",
            salary: "COP 10,500,000",
            min_experience_years: 5,
            required_skills: ["Python", "Java", "PostgreSQL", "Docker", "Liderazgo técnico"],
            description: "Sura, uno de los grupos financieros más grandes de LATAM, busca un Tech Lead para liderar el equipo de plataformas de inversión que gestiona activos de más de 20 millones de personas.",
            functions: [
                "Liderar técnicamente un equipo de 6 desarrolladores backend.",
                "Definir la arquitectura de microservicios para la plataforma de fondos de inversión.",
                "Garantizar la calidad del código mediante code reviews y estándares técnicos.",
                "Colaborar con el área de negocio para traducir requerimientos en soluciones técnicas.",
                "Mentorizar a desarrolladores junior y semi-senior del equipo."
            ],
            offerings: [
                "Salario de mercado para roles de liderazgo + bono anual.",
                "Fondo de empleados Sura con múltiples beneficios financieros.",
                "Plan médico premium para ti y tu familia.",
                "Modalidad híbrida flexible según necesidades del equipo.",
                "Programa de desarrollo de liderazgo Sura."
            ],
            closing: "En Sura liderarás la tecnología que cuida el patrimonio de millones de latinoamericanos. Es una responsabilidad enorme y una oportunidad única de carrera.",
            keywords: ["Tech Lead", "Finanzas", "Backend", "Liderazgo", "Medellín"]
        },
        {
            id: "J010",
            title: "QA Automation Engineer",
            company: "Tigo Colombia",
            location: "Bogotá — Híbrido",
            salary: "COP 5,800,000",
            min_experience_years: 2,
            required_skills: ["Python", "Selenium", "Git", "SQL", "API REST"],
            description: "Tigo, uno de los operadores de telecomunicaciones más grandes de Colombia, busca un QA Automation Engineer para garantizar la calidad de los servicios digitales que usan millones de usuarios.",
            functions: [
                "Diseñar y mantener frameworks de automatización con Selenium y Python.",
                "Crear y ejecutar pruebas de regresión para el portal web y app de Tigo.",
                "Automatizar pruebas de API REST con Postman y PyTest.",
                "Colaborar con desarrolladores en la integración de pruebas al pipeline CI/CD.",
                "Generar reportes de calidad y métricas de cobertura para el equipo de producto."
            ],
            offerings: [
                "Plan de datos Tigo ilimitado sin costo.",
                "Modalidad híbrida con oficina en el norte de Bogotá.",
                "Bono semestral por cumplimiento de metas de calidad.",
                "Acceso a cursos de certificación ISTQB pagados.",
                "Descuentos en servicios Tigo para ti y tu familia."
            ],
            closing: "En Tigo garantizamos que millones de colombianos se conecten sin interrupciones. Si te apasiona la calidad del software, aquí tu trabajo tiene impacto directo.",
            keywords: ["QA", "Automatización", "Telecomunicaciones", "Bogotá", "Testing"]
        }
    ];

    const jobs     = rawJobs.map(j => ({ ...j, score: computeScore(j) })).sort((a, b) => b.score - a.score);
    const topJobs  = jobs.filter(j => j.score >= 60);
    const otherJobs= jobs.filter(j => j.score >= 30 && j.score < 60);

    let selectedJobId = null;
    let appliedJobIds = new Set();

    function scoreColor(score) {
        if (score >= 75) return "text-brand-primary";
        if (score >= 50) return "text-yellow-400";
        return "text-slate-400";
    }

    function renderCard(job, rank) {
        const isSelected = selectedJobId === job.id;
        const isApplied  = appliedJobIds.has(job.id);
        const matched    = candidate.skills.filter(s => job.required_skills.includes(s));

        let podiumIcon = "";
        if (rank === 1)      podiumIcon = `<span title="#1 Top Match" class="rank-icon">💚</span>`;
        else if (rank === 2) podiumIcon = `<span title="#2 Top Match" class="rank-icon">💎</span>`;
        else if (rank === 3) podiumIcon = `<span title="#3 Top Match" class="rank-icon">🥇</span>`;

        return `
        <div id="card-${job.id}" onclick="selectJob('${job.id}')"
             class="card-hover cursor-pointer p-4 rounded-xl border transition-all duration-200
                    ${isSelected
                        ? "bg-slate-800 ring-2 ring-brand-primary border-transparent shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                        : "bg-slate-800/50 border-brand-border hover:bg-slate-800 hover:border-slate-500"}">
            <div class="flex justify-between items-start gap-2 mb-2">
                <div class="min-w-0 flex items-start gap-2">
                    ${podiumIcon ? `<span class="text-base shrink-0 mt-0.5">${podiumIcon}</span>` : ""}
                    <div class="min-w-0">
                        <p class="text-white font-semibold text-sm leading-snug truncate">${job.title}</p>
                        <p class="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1">
                            <i class="fa-solid fa-building text-[9px]"></i>${job.company}
                            ${isApplied ? `<span class="ml-1 inline-flex items-center gap-1 text-brand-primary text-[10px] font-medium"><i class="fa-solid fa-check-circle"></i> Postulado</span>` : ""}
                        </p>
                    </div>
                </div>
                <div class="shrink-0 text-center">
                    <span class="block text-lg font-black ${scoreColor(job.score)}">${job.score}%</span>
                    <span class="text-[9px] text-slate-500 uppercase tracking-wide">Match</span>
                </div>
            </div>
            <div class="w-full bg-slate-700 rounded-full h-1 mb-3">
                <div class="h-1 rounded-full transition-all duration-700 ${job.score >= 75 ? "bg-brand-primary" : job.score >= 50 ? "bg-yellow-400" : "bg-slate-500"}"
                     style="width: ${job.score}%"></div>
            </div>
            <div class="flex flex-wrap gap-1">
                ${job.required_skills.slice(0, 3).map(s => {
                    const hit = matched.includes(s);
                    return `<span class="text-[10px] px-1.5 py-0.5 rounded border ${hit ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary" : "bg-slate-900/80 border-slate-700 text-slate-400"}">${s}</span>`;
                }).join("")}
                ${job.required_skills.length > 3 ? `<span class="text-[10px] px-1.5 py-0.5 rounded border bg-slate-900 border-slate-700 text-slate-500">+${job.required_skills.length - 3}</span>` : ""}
            </div>
        </div>`;
    }

    function renderVacancies() {
        let html = "";
        let globalRank = 1;

        if (topJobs.length > 0) {
            html += `
            <div>
                <div class="flex items-center gap-2 mb-3 px-1">
                    <i class="fa-solid fa-trophy text-yellow-400 text-xs"></i>
                    <span class="text-xs font-bold text-yellow-400 uppercase tracking-widest">Top Matches — Tu Podio</span>
                    <span class="ml-auto text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full font-medium">${topJobs.length} vacante${topJobs.length > 1 ? "s" : ""}</span>
                </div>
                <div class="space-y-2">${topJobs.map(job => renderCard(job, globalRank++)).join("")}</div>
            </div>`;
        }

        if (otherJobs.length > 0) {
            html += `
            <div class="${topJobs.length > 0 ? "pt-2" : ""}">
                <div class="flex items-center gap-2 mb-3 px-1">
                    <i class="fa-solid fa-star-half-stroke text-slate-400 text-xs"></i>
                    <span class="text-xs font-bold text-slate-400 uppercase tracking-widest">Otras buenas opciones</span>
                    <span class="ml-auto text-[10px] bg-slate-700 text-slate-400 border border-slate-600 px-2 py-0.5 rounded-full font-medium">${otherJobs.length} vacante${otherJobs.length > 1 ? "s" : ""}</span>
                </div>
                <div class="space-y-2">${otherJobs.map(job => renderCard(job, globalRank++)).join("")}</div>
            </div>`;
        }

        if (topJobs.length === 0 && otherJobs.length === 0) {
            html = `
            <div class="text-center py-10 px-4">
                <i class="fa-solid fa-file-arrow-up text-3xl text-slate-600 mb-3"></i>
                <p class="text-slate-400 text-sm font-medium mb-1">Sube tu hoja de vida</p>
                <p class="text-slate-500 text-xs">Usa el botón de arriba para analizar tu CV con IA y ver tu ranking de vacantes</p>
            </div>`;
        }

        vacanciesList.innerHTML = html;
    }

    // ─── Matching desde CV: DENTRO del bloque if(vacanciesList) ───────────────
    // Así tiene acceso a candidate, jobs, topJobs, otherJobs, computeScore, renderVacancies
    window.runMatchingFromCV = function (datos) {
        // Actualizar perfil del candidato con datos reales del CV
        if (datos.nombre)   candidate.name             = datos.nombre;
        if (datos.skills)   candidate.skills           = datos.skills.split(',').map(s => s.trim()).filter(Boolean);
        if (datos.expYears) candidate.experience_years = Number(datos.expYears) || 0;

        // Recalcular scores
        jobs.forEach(j => { j.score = computeScore(j); });
        jobs.sort((a, b) => b.score - a.score);

        // Reclasificar
        topJobs.length  = 0;
        otherJobs.length = 0;
        jobs.forEach(j => {
            if (j.score >= 60)      topJobs.push(j);
            else if (j.score >= 30) otherJobs.push(j);
        });

        // Actualizar nombre en la UI
        const display = document.getElementById('current-user-display');
        if (display && datos.nombre) display.textContent = datos.nombre;

        // Si había una vacante seleccionada, cerrarla para mostrar el ranking actualizado
        selectedJobId = null;
        const detailsContainer = document.getElementById("job-details-container");
        const emptyState       = document.getElementById("empty-state");
        if (detailsContainer) detailsContainer.classList.add("hidden");
        if (emptyState)       emptyState.classList.remove("hidden");

        renderVacancies();
    };

    // --- Detalle de vacante ---
    window.selectJob = function (id) {
        selectedJobId = id;
        renderVacancies();

        const job              = jobs.find(j => j.id === id);
        if (!job) return;
        const detailsContainer = document.getElementById("job-details-container");
        const emptyState       = document.getElementById("empty-state");
        const isApplied        = appliedJobIds.has(job.id);
        const matched          = candidate.skills.filter(s => job.required_skills.includes(s));
        const missing          = job.required_skills.filter(s => !candidate.skills.includes(s));

        if (emptyState)       emptyState.classList.add("hidden");
        if (detailsContainer) detailsContainer.classList.remove("hidden");

        detailsContainer.innerHTML = `
        <div class="w-full max-w-4xl mx-auto">
            <div class="bg-slate-800/80 backdrop-blur border border-brand-border rounded-2xl overflow-hidden mb-5 shadow-xl">
                <div class="p-7 border-b border-brand-border bg-gradient-to-r from-slate-800 to-brand-panel">
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <div class="flex flex-wrap items-center gap-2 mb-3">
                                <span class="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Activa</span>
                                <span class="text-slate-400 text-xs"><i class="fa-regular fa-clock mr-1"></i>Publicada hoy</span>
                                <span class="text-slate-400 text-xs"><i class="fa-solid fa-location-dot mr-1"></i>${job.location}</span>
                            </div>
                            <h2 class="text-2xl lg:text-3xl font-black text-white mb-1 leading-tight">${job.title}</h2>
                            <p class="text-lg text-slate-400 flex items-center gap-2">
                                <i class="fa-solid fa-building text-slate-500"></i>${job.company}
                            </p>
                        </div>
                        <div class="shrink-0 flex flex-col items-center">
                            <div class="w-20 h-20 rounded-full border-4 ${job.score >= 75 ? "border-brand-primary" : job.score >= 50 ? "border-yellow-400" : "border-slate-600"} flex items-center justify-center shadow-lg">
                                <span class="block text-xl font-black ${scoreColor(job.score)}">${job.score}%</span>
                            </div>
                            <span class="text-[11px] text-slate-500 mt-1.5 font-medium">Compatibilidad</span>
                        </div>
                    </div>
                </div>
                <div class="px-7 py-4 flex items-center justify-between bg-slate-900/30">
                    <span class="text-slate-400 text-sm"><i class="fa-solid fa-money-bill-wave mr-2 text-brand-primary"></i>Salario mensual</span>
                    <span class="text-brand-primary font-bold text-lg">${job.salary}</span>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div class="bg-slate-800/80 border border-brand-border rounded-2xl p-5">
                    <h4 class="text-xs uppercase tracking-widest font-bold text-brand-primary mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-check-circle"></i>Skills que dominas (${matched.length}/${job.required_skills.length})
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${matched.length > 0
                            ? matched.map(s => `<span class="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-lg text-sm font-medium">${s}</span>`).join("")
                            : `<p class="text-slate-500 text-sm">Ninguna skill coincide aún</p>`}
                    </div>
                </div>
                <div class="bg-slate-800/80 border border-brand-border rounded-2xl p-5">
                    <h4 class="text-xs uppercase tracking-widest font-bold text-slate-400 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-yellow-400"></i>Skills a desarrollar (${missing.length})
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${missing.length > 0
                            ? missing.map(s => `<span class="bg-slate-700 text-slate-300 border border-slate-600 px-3 py-1.5 rounded-lg text-sm">${s}</span>`).join("")
                            : `<p class="text-brand-primary text-sm font-medium">¡Tienes todas las skills requeridas!</p>`}
                    </div>
                </div>
            </div>

            <div class="space-y-4 mb-5">
                <div class="bg-slate-800/80 border border-brand-border rounded-2xl p-5">
                    <h3 class="text-xs uppercase tracking-widest font-bold text-slate-400 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-circle-info text-brand-primary"></i>Sobre el rol
                    </h3>
                    <p class="text-slate-300 leading-relaxed text-sm">${job.description}</p>
                    <div class="mt-3 pt-3 border-t border-brand-border/50 text-xs text-slate-500">
                        <span><i class="fa-solid fa-calendar-check mr-1.5 text-slate-600"></i>${job.min_experience_years} años de experiencia mínima</span>
                    </div>
                </div>

                ${job.functions && job.functions.length > 0 ? `
                <div class="bg-slate-800/80 border border-brand-border rounded-2xl p-5">
                    <h3 class="text-xs uppercase tracking-widest font-bold text-brand-primary mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-list-check"></i>Funciones principales
                    </h3>
                    <ul class="space-y-2.5">
                        ${job.functions.map(f => `<li class="flex items-start gap-2.5 text-slate-300 text-sm leading-relaxed"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>${f}</li>`).join('')}
                    </ul>
                </div>` : ''}

                ${job.offerings && job.offerings.length > 0 ? `
                <div class="bg-slate-800/80 border border-brand-border rounded-2xl p-5">
                    <h3 class="text-xs uppercase tracking-widest font-bold text-yellow-400 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-gift"></i>Ofrecemos
                    </h3>
                    <ul class="space-y-2.5">
                        ${job.offerings.map(o => `<li class="flex items-start gap-2.5 text-slate-300 text-sm leading-relaxed"><span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0"></span>${o}</li>`).join('')}
                    </ul>
                </div>` : ''}

                ${job.closing ? `
                <div class="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl px-5 py-4">
                    <p class="text-slate-300 text-sm leading-relaxed italic">
                        <i class="fa-solid fa-quote-left text-brand-primary mr-2 opacity-60"></i>${job.closing}
                    </p>
                </div>` : ''}

                ${job.keywords && job.keywords.length > 0 ? `
                <div>
                    <p class="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2.5">Palabras clave</p>
                    <div class="flex flex-wrap gap-2">
                        ${job.keywords.map(k => `<span class="text-xs font-medium px-3 py-1 rounded-full border bg-slate-700/60 border-brand-border text-slate-300 hover:border-brand-primary hover:text-brand-primary transition-colors cursor-default">#${k}</span>`).join('')}
                    </div>
                </div>` : ''}
            </div>

            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-800/50 border border-brand-border rounded-2xl px-6 py-5">
                <div class="text-sm text-slate-400">
                    <i class="fa-solid fa-shield-halved mr-2 text-brand-primary"></i>Tu postulación es confidencial y segura.
                </div>
                ${isApplied
                    ? `<div class="flex items-center gap-2 text-brand-primary font-bold"><i class="fa-solid fa-check-circle"></i><span>¡Ya te postulaste a esta vacante!</span></div>`
                    : `<button onclick="submitApplication('${job.id}', '${job.title}', '${job.company}')" id="apply-btn-${job.id}"
                               class="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-bold px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)] hover:shadow-[0_0_35px_rgba(16,185,129,0.45)] transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap">
                               <i class="fa-solid fa-paper-plane"></i>Enviar Postulación
                           </button>`}
            </div>
        </div>`;
    };

    // --- Postulación ---
    window.submitApplication = async function (jobId, jobTitle, company) {
        const spinner  = document.getElementById("loading-spinner");
        const applyBtn = document.getElementById(`apply-btn-${jobId}`);

        if (applyBtn) {
            applyBtn.disabled  = true;
            applyBtn.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Enviando...';
        }
        if (spinner) spinner.classList.remove("hidden");

        try {
            await fetch("http://localhost:5678/webhook/apply", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    action:    "APPLICATION_SUBMITTED",
                    candidate: { id: candidate.id, name: candidate.name },
                    job:       { id: jobId, title: jobTitle, company }
                })
            });
        } catch (_) { /* n8n puede no estar corriendo */ }

        await new Promise(r => setTimeout(r, 1000));
        if (spinner) spinner.classList.add("hidden");

        appliedJobIds.add(jobId);

        const toastDetail = document.getElementById("postulation-toast-detail");
        if (toastDetail) toastDetail.textContent = `Aplicaste a "${jobTitle}" en ${company}`;
        showToast("postulation-toast", 5000);

        selectJob(jobId);
    };

    // --- Render inicial ---
    renderVacancies();

} // ← FIN del bloque if (vacanciesList)


// ============================================================
// 3. LISTENER SUBIR CV EN DASHBOARD
//    Fuera del bloque if(vacanciesList) pero usa window.runMatchingFromCV
//    que sí está dentro — esto es correcto porque window es global
// ============================================================
document.addEventListener('DOMContentLoaded', function () {
    const inputCV = document.getElementById('cvUpload');
    if (!inputCV) return;

    inputCV.addEventListener('change', async function () {
        const file = this.files[0];
        if (!file) return;

        // Validar que sea PDF
        if (file.type !== 'application/pdf') {
            mostrarEstadoCV('error', 'Solo se aceptan archivos PDF.');
            this.value = '';
            return;
        }

        mostrarEstadoCV('cargando');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/extraer-cv', {
                method: 'POST',
                body:   formData
            });

            const datos = await res.json();

            if (!res.ok) {
                // El backend retornó error — mostrar detalle
                throw new Error(datos.detail || `Error ${res.status} al analizar el CV.`);
            }

            // Verificar que el JSON tenga al menos nombre o habilidades
            if (!datos.nombre && (!datos.habilidades || datos.habilidades.length === 0)) {
                throw new Error('No se pudieron extraer datos del CV. Verifica que el PDF sea legible.');
            }

            // Disparar matching — campo exacto del backend: experiencia_anos (sin tilde)
            if (typeof window.runMatchingFromCV === 'function') {
                window.runMatchingFromCV({
                    nombre:   datos.nombre                         || '',
                    skills:   (datos.habilidades || []).join(', '),
                    expYears: datos.experiencia_anos               || 0
                });
            }

            mostrarEstadoCV('listo', datos.nombre || 'candidato');

        } catch (error) {
            console.error('Error procesando CV:', error);
            mostrarEstadoCV('error', error.message || 'Error al conectar con el servidor.');
        }

        // Limpiar el input para permitir subir el mismo archivo de nuevo
        this.value = '';
    });
});

// --- Feedback visual del botón de CV ---
function mostrarEstadoCV(estado, info) {
    const div   = document.getElementById('cv-status');
    const label = document.getElementById('cvUpload-label');
    if (!div) return;

    if (estado === 'cargando') {
        div.innerHTML = `
            <p class="flex items-center gap-2 text-xs text-blue-400 mt-1">
                <i class="fa-solid fa-spinner fa-spin"></i>
                Analizando CV con OpenAI...
            </p>`;
        if (label) label.textContent = 'Procesando...';

    } else if (estado === 'listo') {
        div.innerHTML = `
            <p class="flex items-center gap-2 text-xs text-green-400 mt-1">
                <i class="fa-solid fa-circle-check"></i>
                <span>Match actualizado para <strong>${info}</strong></span>
            </p>`;
        if (label) label.textContent = 'Subir otra Hoja de Vida (PDF)';

    } else if (estado === 'error') {
        div.innerHTML = `
            <p class="flex items-center gap-2 text-xs text-red-400 mt-1">
                <i class="fa-solid fa-triangle-exclamation"></i>
                ${info || 'Error procesando el CV. Intenta de nuevo.'}
            </p>`;
        if (label) label.textContent = 'Subir Hoja de Vida (PDF)';
    }
}