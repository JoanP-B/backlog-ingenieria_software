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
    const passwordInput = document.getElementById("login-password");
    const loginMessage = document.getElementById("login-message");
    const loginBtn = document.getElementById("login-btn");

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
        const password = passwordInput.value;

        if (!usernameOrEmail || !password) {
            showMessage("Favor ingresar información válida en los campos obligatorios.");
            return;
        }

        // Loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<svg class="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Verificando...';

        try {
            const response = await fetch("http://localhost:8000/token", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: new URLSearchParams({ username: usernameOrEmail, password })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("username", usernameOrEmail);
                showMessage("¡Acceso exitoso! Redirigiendo...", false);
                // ✅ Redirige a vistaPrincipal
                setTimeout(() => window.location.href = "vistaPrincipal.html", 600);
                return;
            }

            showMessage(data.detail || "Correo o contraseña incorrectos. Intenta nuevamente.");
        } catch (_) {
            showMessage("No fue posible conectar con el servidor. Verifica que el backend esté activo.");
        } finally {
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fa-solid fa-arrow-right-to-bracket"></i> Iniciar Sesión';
        }
    });
}

// ============================================================
// 2. VISTA PRINCIPAL / LANDING PAGE (vistaPrincipal.html)
// ============================================================
const dropZone = document.getElementById("drop-zone");
const cvInput = document.getElementById("cv-input");
const cvInputFooter = document.getElementById("cv-input-footer");
const fileSelected = document.getElementById("file-selected");
const fileNameEl = document.getElementById("file-name");
const analyzeBtn = document.getElementById("analyze-btn");
const quickBtn = document.getElementById("quick-analyze-btn");
const aiOverlay = document.getElementById("ai-overlay");

if (dropZone) {
    // --- Drag & Drop handlers ---
    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("drop-zone-active");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("drop-zone-active");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("drop-zone-active");
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelected(file);
    });

    // --- File input change ---
    if (cvInput) {
        cvInput.addEventListener("change", () => {
            if (cvInput.files[0]) handleFileSelected(cvInput.files[0]);
        });
    }
    if (cvInputFooter) {
        cvInputFooter.addEventListener("change", () => {
            if (cvInputFooter.files[0]) handleFileSelected(cvInputFooter.files[0]);
        });
    }

    function handleFileSelected(file) {
        if (!file) return;
        // Show file chip
        fileNameEl.textContent = file.name;
        fileSelected.classList.remove("hidden");
        document.getElementById("quick-analyze").classList.add("hidden");
    }

    // --- Analyze button ---
    if (analyzeBtn) {
        analyzeBtn.addEventListener("click", () => startAIAnalysis());
    }

    // --- Quick demo button ---
    if (quickBtn) {
        quickBtn.addEventListener("click", () => startAIAnalysis());
    }
}

// --- AI Analysis Overlay + Redirect ---
function startAIAnalysis() {
    if (!aiOverlay) return;

    // Show overlay
    aiOverlay.classList.remove("hidden");
    document.body.style.overflow = "hidden";

    // Step animation
    const steps = [
        document.getElementById("step-1"),
        document.getElementById("step-2"),
        document.getElementById("step-3"),
        document.getElementById("step-4"),
    ];

    const delays = [400, 1100, 1900, 2700];
    const doneColor = "text-brand-primary";
    const activeColor = "text-white";

    steps.forEach((step, i) => {
        if (!step) return;

        // Activate step
        setTimeout(() => {
            step.classList.remove("text-slate-500");
            step.classList.add(activeColor);
            const dot = step.querySelector(".step-dot");
            if (dot) {
                dot.classList.remove("bg-slate-600");
                dot.classList.add("bg-brand-primary", "animate-pulse");
            }
        }, delays[i]);

        // Complete step
        setTimeout(() => {
            step.classList.remove(activeColor);
            step.classList.add(doneColor);
            const dot = step.querySelector(".step-dot");
            if (dot) {
                dot.classList.add("hidden");
                const check = step.querySelector(".fa-check");
                if (check) check.classList.remove("hidden");
            }
        }, delays[i] + 600);
    });

    // Fire n8n webhook silently (fire-and-forget)
    triggerN8nSilently();

    // Redirect after animation completes
    setTimeout(() => {
        window.location.href = "dashboard.html?analyzed=true";
    }, 3800);
}

async function triggerN8nSilently() {
    const candidateMock = {
        candidate: {
            id: "C001",
            name: localStorage.getItem("username") || "Demo User",
            skills: ["Python", "FastAPI", "SQL", "Git", "Docker", "Linux"],
            experience_years: 3
        },
        job: {
            id: "J001",
            title: "Backend Developer (FastAPI)",
            required_skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
            min_experience_years: 3
        }
    };

    try {
        await fetch("http://localhost:5678/webhook/score", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(candidateMock)
        });
    } catch (_) {
        // Silently ignore — demo mode if n8n is not running
    }
}

// ============================================================
// 3. DASHBOARD (dashboard.html)
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

    // --- Toast: show if coming from AI analysis flow ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("analyzed") === "true") {
        showToast("success-toast", 4500);
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    // Generic toast helper
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

    // --- Candidate profile (in real app this would come from localStorage/API after analysis) ---
    const candidate = {
        id: "C001",
        name: localStorage.getItem("username") || "Candidato Demo",
        skills: ["Python", "FastAPI", "SQL", "Git", "Docker", "Linux"],
        experience_years: 3
    };

    // --- Pre-calculate score for each job (simulating what IA already did) ---
    function computeScore(job) {
        const matched = candidate.skills.filter(s => job.required_skills.includes(s)).length;
        const skillScore = job.required_skills.length > 0 ? (matched / job.required_skills.length) * 100 : 0;
        const expScore = candidate.experience_years >= job.min_experience_years
            ? 100
            : (job.min_experience_years > 0 ? (candidate.experience_years / job.min_experience_years) * 100 : 0);
        return Math.round((skillScore * 0.7) + (expScore * 0.3));
    }

    // --- Job data with pre-computed scores ---
    const rawJobs = [
        {
            id: "J001",
            title: "Backend Developer (FastAPI)",
            company: "TechCorp Inc.",
            location: "Medellín — Remoto",
            salary: "COP 6,000,000",
            min_experience_years: 3,
            required_skills: ["Python", "FastAPI", "PostgreSQL", "Docker", "Git"],
            description: "Buscamos un desarrollador backend semi-senior con experiencia sólida construyendo APIs asíncronas de alto rendimiento y arquitectura limpia.",
            functions: [
                "Diseñar e implementar APIs RESTful de alto rendimiento con FastAPI.",
                "Gestionar y optimizar consultas sobre bases de datos PostgreSQL.",
                "Crear y mantener contenedores Docker para ambientes de desarrollo y producción.",
                "Colaborar con el equipo de frontend para integrar servicios correctamente.",
                "Participar en revisiones de código y mejores prácticas de seguridad."
            ],
            offerings: [
                "Contrato a término indefinido desde el primer día.",
                "Salario competitivo + bonificación por desempeño trimestral.",
                "Trabajo 100% remoto con horario flexible.",
                "Acceso a cursos y certificaciones pagados por la empresa."
            ],
            closing: "Si te apasiona construir sistemas robustos y escalables, esta es tu oportunidad de crecer en una empresa en plena expansión. ¡Postula tu hoja de vida!",
            keywords: ["Backend", "FastAPI", "Python", "APIs", "Remoto"]
        },
        {
            id: "J002",
            title: "Frontend React Engineer",
            company: "StartApp",
            location: "Bogotá — Híbrido",
            salary: "COP 5,000,000",
            min_experience_years: 2,
            required_skills: ["JavaScript", "React", "Tailwind CSS", "Git"],
            description: "Únete a nuestro equipo core para construir interfaces dinámicas, dashboards interactivos y experiencias premium para nuestros usuarios.",
            functions: [
                "Construir componentes reutilizables con React y Tailwind CSS.",
                "Integrar APIs RESTful y manejar estado global con Context API.",
                "Optimizar el rendimiento y accesibilidad de las interfaces.",
                "Colaborar con el equipo de diseño UX/UI en la implementación de mockups."
            ],
            offerings: [
                "Contrato de trabajo híbrido con 2 días en oficina.",
                "Ambiente de trabajo moderno y dinero para setup de home office.",
                "Seguro médico complementario."
            ],
            closing: "Si te encanta crear interfaces hermosas y funcionales, únete a nosotros y transforma la manera en que las personas interactúan con la tecnología.",
            keywords: ["React", "Frontend", "JavaScript", "UX", "Híbrido"]
        },
        {
            id: "J003",
            title: "Data Scientist",
            company: "DataMinds",
            location: "Cali — Presencial",
            salary: "COP 8,000,000",
            min_experience_years: 4,
            required_skills: ["Python", "Machine Learning", "SQL", "Pandas"],
            description: "Analiza grandes volúmenes de datos transaccionales y crea modelos predictivos escalables para nuestra cartera de clientes internacionales.",
            functions: [
                "Diseñar y entrenar modelos de Machine Learning con scikit-learn y TensorFlow.",
                "Realizar EDA (Análisis Exploratorio de Datos) y visualizaciones con Matplotlib/Seaborn.",
                "Implementar pipelines de datos usando SQL y Pandas.",
                "Presentar hallazgos y recomendaciones a stakeholders no técnicos."
            ],
            offerings: [
                "Salario competitivo + participación en proyectos internacionales.",
                "Acceso a infraestructura cloud (AWS/GCP) de primer nivel.",
                "Plan de carrera estructurado hacia roles de ML Engineer o Data Lead."
            ],
            closing: "Si quieres convertir datos en decisiones de negocio de alto impacto, este rol es para ti. Postula y lleva tu carrera al siguiente nivel.",
            keywords: ["Data Science", "ML", "Python", "SQL", "Análisis"]
        },
        {
            id: "J004",
            title: "DevOps Cloud Architect",
            company: "CloudNexus",
            location: "Remoto — Global",
            salary: "COP 10,000,000",
            min_experience_years: 5,
            required_skills: ["Docker", "Kubernetes", "AWS", "Linux", "CI/CD"],
            description: "Diseña y mantén la infraestructura cloud de misión crítica, asegurando alta disponibilidad y despliegues automáticos seguros.",
            functions: [
                "Arquitectar soluciones cloud en AWS con enfoque en alta disponibilidad.",
                "Gestionar clústeres de Kubernetes y orquestar despliegues en producción.",
                "Diseñar e implementar pipelines de CI/CD con GitHub Actions o Jenkins.",
                "Monitorear sistemas y responder a incidentes de disponibilidad 24/7.",
                "Documentar arquitecturas y capacitar a equipos de desarrollo."
            ],
            offerings: [
                "Salario en dólares + equity de la compañía.",
                "Trabajo 100% remoto desde cualquier lugar del mundo.",
                "Budget anual para conferencias y certificaciones (AWS, CKA, etc.).",
                "Equipo de élite con proyectos de escala global."
            ],
            closing: "Si eres un experto en infraestructura cloud y te emociona resolver retos de escala global, esta posición fue hecha para ti.",
            keywords: ["DevOps", "AWS", "Kubernetes", "Docker", "Cloud"]
        },
        {
            id: "J005",
            title: "Analista Administrativo - Sede Principal Salud",
            company: "QualityFirst",
            location: "Medellín — Presencial",
            salary: "COP 4,500,000",
            min_experience_years: 2,
            required_skills: ["Python", "Selenium", "Git", "SQL"],
            description: "Apoya la gestión administrativa y operativa de la sede principal, contribuyendo a la eficiencia de los procesos institucionales.",
            functions: [
                "Apoyar procesos administrativos y operativos del área asignada.",
                "Gestión y organización de documentación institucional.",
                "Atención básica al usuario interno y externo.",
                "Apoyo en registro y actualización de información en sistemas.",
                "Acompañamiento a procesos del área según lineamientos institucionales."
            ],
            offerings: [
                "Contrato de aprendizaje SENA.",
                "Apoyo de sostenimiento según normativa vigente.",
                "Oportunidad de aprendizaje en una institución reconocida.",
                "Acompañamiento y formación práctica."
            ],
            closing: "Si buscas adquirir experiencia y fortalecer tus competencias en el sector salud, esta es tu oportunidad. Postula tu hoja de vida.",
            keywords: ["Aprendiz", "SENA", "Prácticas", "Etapa productiva"]
        }
    ];

    // Attach computed score to each job and sort desc
    const jobs = rawJobs
        .map(j => ({ ...j, score: computeScore(j) }))
        .sort((a, b) => b.score - a.score);

    // Split into categories
    const topJobs = jobs.filter(j => j.score >= 60);
    const otherJobs = jobs.filter(j => j.score >= 30 && j.score < 60);

    let selectedJobId = null;
    let appliedJobIds = new Set();

    // --- Score color helper ---
    function scoreColor(score) {
        if (score >= 75) return "text-brand-primary";
        if (score >= 50) return "text-yellow-400";
        return "text-slate-400";
    }
    function scoreBgBorder(score) {
        if (score >= 75) return "bg-brand-primary/10 border-brand-primary/30 text-brand-primary";
        if (score >= 50) return "bg-yellow-50/50 border-yellow-300 text-yellow-600";
        return "bg-gray-50 border-gray-200 text-slate-500";
    }

    // --- Render a single vacancy card (rank = 1-based global position across all sections) ---
    function renderCard(job, rank) {
        const isSelected = selectedJobId === job.id;
        const isApplied = appliedJobIds.has(job.id);
        const matched = candidate.skills.filter(s => job.required_skills.includes(s));

        // Podium icon: only for top 3 globally
        let podiumIcon = "";
        if (rank === 1) podiumIcon = `<span title="#1 Top Match" class="rank-icon">💚</span>`;
        else if (rank === 2) podiumIcon = `<span title="#2 Top Match" class="rank-icon">💎</span>`;
        else if (rank === 3) podiumIcon = `<span title="#3 Top Match" class="rank-icon">🥇</span>`;

        return `
        <div
            id="card-${job.id}"
            onclick="selectJob('${job.id}')"
            class="card-hover cursor-pointer p-4 rounded-xl border transition-all duration-200
                   ${isSelected
                ? "bg-white ring-2 ring-brand-primary border-transparent shadow-[0_0_20px_rgba(16,185,129,0.12)]"
                : "bg-white border-gray-200 hover:bg-slate-50 hover:border-gray-300 shadow-sm"}"
        >
            <div class="flex justify-between items-start gap-2 mb-2">
                <div class="min-w-0 flex items-start gap-2">
                    ${podiumIcon ? `<span class="text-base shrink-0 mt-0.5">${podiumIcon}</span>` : ""}
                    <div class="min-w-0">
                        <p class="text-slate-900 font-bold text-sm leading-snug truncate">${job.title}</p>
                        <p class="text-slate-500 text-[11px] mt-0.5 flex items-center gap-1">
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

            <!-- Progress bar -->
            <div class="w-full bg-gray-200 rounded-full h-1 mb-3">
                <div class="h-1 rounded-full transition-all duration-700 ${job.score >= 75 ? "bg-brand-primary" : job.score >= 50 ? "bg-yellow-500" : "bg-slate-400"}"
                     style="width: ${job.score}%"></div>
            </div>

            <!-- Skills badges -->
            <div class="flex flex-wrap gap-1">
                ${job.required_skills.slice(0, 3).map(s => {
                    const hit = matched.includes(s);
                    return `<span class="text-[10px] px-1.5 py-0.5 rounded border
                        ${hit ? "bg-brand-primary/10 border-brand-primary/30 text-brand-primary" : "bg-gray-50 border-gray-200 text-slate-600"}">${s}</span>`;
                }).join("")}
                ${job.required_skills.length > 3
                ? `<span class="text-[10px] px-1.5 py-0.5 rounded border bg-gray-50 border-gray-200 text-slate-500">+${job.required_skills.length - 3}</span>`
                : ""}
            </div>
        </div>`;
    }

    // --- Render both sections with global rank tracking ---
    function renderVacancies() {
        let html = "";
        let globalRank = 1; // tracks position across both sections for podium icons

        if (topJobs.length > 0) {
            html += `
            <div>
                <div class="flex items-center gap-2 mb-3 px-1">
                    <i class="fa-solid fa-trophy text-yellow-400 text-xs"></i>
                    <span class="text-xs font-bold text-yellow-400 uppercase tracking-widest">Top Matches — Tu Podio</span>
                    <span class="ml-auto text-[10px] bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 px-2 py-0.5 rounded-full font-medium">${topJobs.length} vacante${topJobs.length > 1 ? "s" : ""}</span>
                </div>
                <div class="space-y-2">
                    ${topJobs.map(job => renderCard(job, globalRank++)).join("")}
                </div>
            </div>`;
        }

        if (otherJobs.length > 0) {
            html += `
            <div class="${topJobs.length > 0 ? "pt-2" : ""}">
                <div class="flex items-center gap-2 mb-3 px-1">
                    <i class="fa-solid fa-star-half-stroke text-slate-400 text-xs"></i>
                    <span class="text-xs font-bold text-slate-500 uppercase tracking-widest">Otras buenas opciones</span>
                    <span class="ml-auto text-[10px] bg-slate-100 text-slate-500 border border-gray-200 px-2 py-0.5 rounded-full font-medium">${otherJobs.length} vacante${otherJobs.length > 1 ? "s" : ""}</span>
                </div>
                <div class="space-y-2">
                    ${otherJobs.map(job => renderCard(job, globalRank++)).join("")}
                </div>
            </div>`;
        }

        vacanciesList.innerHTML = html;
    }

    // --- Select job & render detail panel ---
    window.selectJob = function (id) {
        selectedJobId = id;
        renderVacancies(); // re-render cards to update selection state

        const job = jobs.find(j => j.id === id);
        const detailsContainer = document.getElementById("job-details-container");
        const emptyState = document.getElementById("empty-state");
        const isApplied = appliedJobIds.has(job.id);
        const matched = candidate.skills.filter(s => job.required_skills.includes(s));
        const missing = job.required_skills.filter(s => !candidate.skills.includes(s));

        emptyState.classList.add("hidden");
        detailsContainer.classList.remove("hidden");

        detailsContainer.innerHTML = `
        <div class="w-full max-w-4xl mx-auto">

            <!-- Header -->
            <div class="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-5 shadow-sm">
                <div class="p-7 border-b border-gray-200 bg-slate-50">
                    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div>
                            <div class="flex flex-wrap items-center gap-2 mb-3">
                                <span class="bg-blue-50 text-blue-600 border border-blue-200 text-[11px] px-2 py-1 rounded-md font-bold uppercase tracking-wider">Activa</span>
                                <span class="text-slate-500 text-xs"><i class="fa-regular fa-clock mr-1"></i>Publicada hoy</span>
                                <span class="text-slate-500 text-xs"><i class="fa-solid fa-location-dot mr-1"></i>${job.location}</span>
                            </div>
                            <h2 class="text-2xl lg:text-3xl font-black text-slate-900 mb-1 leading-tight">${job.title}</h2>
                            <p class="text-lg text-slate-600 flex items-center gap-2">
                                <i class="fa-solid fa-building text-slate-400"></i>${job.company}
                            </p>
                        </div>
                        <!-- Score ring -->
                        <div class="shrink-0 flex flex-col items-center">
                            <div class="w-20 h-20 bg-white rounded-full border-4 ${job.score >= 75 ? "border-brand-primary" : job.score >= 50 ? "border-yellow-500" : "border-gray-200"}
                                        flex items-center justify-center shadow-sm">
                                <div class="text-center">
                                    <span class="block text-xl font-black ${scoreColor(job.score)}">${job.score}%</span>
                                </div>
                            </div>
                            <span class="text-[11px] text-slate-500 mt-1.5 font-medium">Compatibilidad</span>
                        </div>
                    </div>
                </div>

                <!-- Salary -->
                <div class="px-7 py-4 flex items-center justify-between bg-white">
                    <span class="text-slate-600 text-sm"><i class="fa-solid fa-money-bill-wave mr-2 text-brand-primary"></i>Salario mensual</span>
                    <span class="text-brand-primary font-bold text-lg">${job.salary}</span>
                </div>
            </div>

            <!-- Skills breakdown -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <!-- Matched skills -->
                <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h4 class="text-xs uppercase tracking-widest font-bold text-brand-primary mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-check-circle"></i>Skills que dominas (${matched.length}/${job.required_skills.length})
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${matched.length > 0
                ? matched.map(s => `<span class="bg-brand-primary/10 text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-lg text-sm font-medium">${s}</span>`).join("")
                : `<p class="text-slate-500 text-sm">Ninguna skill coincide aún</p>`}
                    </div>
                </div>
                <!-- Missing skills -->
                <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h4 class="text-xs uppercase tracking-widest font-bold text-slate-500 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation text-yellow-500"></i>Skills a desarrollar (${missing.length})
                    </h4>
                    <div class="flex flex-wrap gap-2">
                        ${missing.length > 0
                ? missing.map(s => `<span class="bg-gray-50 text-slate-600 border border-gray-200 px-3 py-1.5 rounded-lg text-sm">${s}</span>`).join("")
                : `<p class="text-brand-primary text-sm font-medium">¡Tienes todas las skills requeridas!</p>`}
                    </div>
                </div>
            </div>

            <!-- Description + Functions + Offerings + Keywords -->
            <div class="space-y-4 mb-5">

                <!-- Descripción corta -->
                <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 class="text-xs uppercase tracking-widest font-bold text-slate-500 mb-3 flex items-center gap-2">
                        <i class="fa-solid fa-circle-info text-brand-primary"></i>Sobre el rol
                    </h3>
                    <p class="text-slate-600 leading-relaxed text-sm">${job.description}</p>
                    <div class="mt-3 pt-3 border-t border-gray-100 flex items-center gap-4 text-xs text-slate-500">
                        <span><i class="fa-solid fa-calendar-check mr-1.5 text-slate-400"></i>${job.min_experience_years} años de experiencia mínima</span>
                    </div>
                </div>

                <!-- Funciones principales -->
                ${job.functions && job.functions.length > 0 ? `
                <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 class="text-xs uppercase tracking-widest font-bold text-brand-primary mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-list-check"></i>Funciones principales
                    </h3>
                    <ul class="space-y-2.5">
                        ${job.functions.map(f => `
                        <li class="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed">
                            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-primary shrink-0"></span>
                            ${f}
                        </li>`).join('')}
                    </ul>
                </div>` : ''}

                <!-- Ofrecemos -->
                ${job.offerings && job.offerings.length > 0 ? `
                <div class="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <h3 class="text-xs uppercase tracking-widest font-bold text-yellow-600 mb-4 flex items-center gap-2">
                        <i class="fa-solid fa-gift"></i>Ofrecemos
                    </h3>
                    <ul class="space-y-2.5">
                        ${job.offerings.map(o => `
                        <li class="flex items-start gap-2.5 text-slate-600 text-sm leading-relaxed">
                            <span class="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0"></span>
                            ${o}
                        </li>`).join('')}
                    </ul>
                </div>` : ''}

                <!-- Párrafo de cierre -->
                ${job.closing ? `
                <div class="bg-brand-primary/5 border border-brand-primary/20 rounded-2xl px-5 py-4">
                    <p class="text-slate-700 text-sm leading-relaxed italic">
                        <i class="fa-solid fa-quote-left text-brand-primary mr-2 opacity-60"></i>${job.closing}
                    </p>
                </div>` : ''}

                <!-- Keywords / Badges -->
                ${job.keywords && job.keywords.length > 0 ? `
                <div>
                    <p class="text-xs uppercase tracking-widest font-bold text-slate-500 mb-2.5 mt-2">Palabras clave</p>
                    <div class="flex flex-wrap gap-2">
                        ${job.keywords.map(k => `
                        <span class="text-xs font-medium px-3 py-1 rounded-full border
                               bg-gray-50 border-gray-200 text-slate-600
                               hover:border-brand-primary hover:text-brand-primary transition-colors cursor-default">
                            #${k}
                        </span>`).join('')}
                    </div>
                </div>` : ''}

            </div>
            <!-- CTA -->
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 border border-gray-200 rounded-2xl px-6 py-5 shadow-sm">
                <div class="text-sm text-slate-600">
                    <i class="fa-solid fa-shield-halved mr-2 text-brand-primary"></i>
                    Tu postulación es confidencial y segura.
                </div>
                ${isApplied
                ? `<div class="flex items-center gap-2 text-brand-primary font-bold">
                           <i class="fa-solid fa-check-circle"></i>
                           <span>¡Ya te postulaste a esta vacante!</span>
                       </div>`
                : `<button
                           onclick="submitApplication('${job.id}', '${job.title}', '${job.company}')"
                           id="apply-btn-${job.id}"
                           class="flex items-center gap-2 bg-brand-primary hover:bg-brand-hover text-white font-bold
                                  px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.25)]
                                  hover:shadow-[0_0_35px_rgba(16,185,129,0.45)]
                                  transition-all duration-200 transform hover:-translate-y-0.5 whitespace-nowrap">
                               <i class="fa-solid fa-paper-plane"></i>
                               Enviar Postulación
                           </button>`}
            </div>
        </div>`;
    };

    // --- Submit Application ---
    window.submitApplication = async function (jobId, jobTitle, company) {
        const spinner = document.getElementById("loading-spinner");
        const applyBtn = document.getElementById(`apply-btn-${jobId}`);

        // Disable button immediately
        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Enviando...';
        }
        spinner.classList.remove("hidden");

        const payload = {
            action: "APPLICATION_SUBMITTED",
            candidate: {
                id: candidate.id,
                name: candidate.name
            },
            job: { id: jobId, title: jobTitle, company }
        };

        try {
            await fetch("http://localhost:5678/webhook/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        } catch (_) {
            // Silently continue — n8n might not be running in demo
        }

        // Simulate brief processing delay
        await new Promise(r => setTimeout(r, 1000));

        spinner.classList.add("hidden");

        // Mark as applied
        appliedJobIds.add(jobId);

        // Show postulation toast
        const toastDetail = document.getElementById("postulation-toast-detail");
        if (toastDetail) toastDetail.textContent = `Aplicaste a "${jobTitle}" en ${company}`;
        showToast("postulation-toast", 5000);

        // Re-render panel and list to reflect applied state
        selectJob(jobId);
    };

    // --- Initial render ---
    renderVacancies();
}

