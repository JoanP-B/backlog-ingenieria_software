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

async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("access_token");
    const headers = {
        ...(options.headers || {}),
    };
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    return fetch(url, {
        ...options,
        headers,
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

    async function loadCandidateProfile() {
        const response = await fetchWithAuth("http://localhost:8000/api/candidates/me");
        if (!response.ok) return;
        const profile = await response.json();
        candidate.id = profile.id;
        candidate.user_id = profile.user_id;
        candidate.name = profile.name;
        candidate.skills = profile.skills;
        candidate.experience_years = profile.experience_years;
        if (usernameDisplay) usernameDisplay.textContent = profile.name;
    }

    async function saveCandidateProfile(data) {
        const response = await fetchWithAuth("http://localhost:8000/api/candidates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            console.error("No se pudo guardar el perfil de candidato.", await response.text());
            return;
        }
        const profile = await response.json();
        candidate.id = profile.id;
        candidate.user_id = profile.user_id;
        candidate.name = profile.name;
        if (usernameDisplay) usernameDisplay.textContent = profile.name;
    }

    async function submitApplicationBackend(jobId, jobTitle, company) {
        if (!candidate.id) return;
        try {
            const response = await fetchWithAuth("http://localhost:8000/api/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    candidate_id: candidate.id,
                    job_id: jobId,
                    job_title: jobTitle,
                    company,
                }),
            });
            if (!response.ok) {
                console.error("Error guardando la postulación en el backend:", await response.text());
            }
        } catch (error) {
            console.error("No se pudo conectar al backend para guardar la postulación:", error);
        }
    }

    // --- Toast si viene del flujo de análisis ---
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("analyzed") === "true") {
        showToast("success-toast", 4500);
        window.history.replaceState({}, document.title, "dashboard.html");
    }

    loadCandidateProfile().catch(error => console.error("Error cargando perfil de candidato:", error));

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
        id: null,
        user_id: null,
        name: localStorage.getItem("username") || "Candidato Demo",
        skills: [],
        experience_years: 0
    };

    // --- Motor de scoring ---
    function computeScore(job) {
        const matched = candidate.skills.filter(s => job.required_skills.includes(s)).length;
        const skillScore = job.required_skills.length > 0
            ? (matched / job.required_skills.length) * 100
            : 0;
        const expScore = candidate.experience_years >= job.min_experience_years
            ? 100
            : (job.min_experience_years > 0
                ? (candidate.experience_years / job.min_experience_years) * 100
                : 0);
        return Math.round((skillScore * 0.7) + (expScore * 0.3));
    }

    window.runMatchingFromCV = function (data) {
        candidate.name = data.nombre;
        candidate.skills = data.skills ? data.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
        candidate.experience_years = data.expYears;

        if (rawJobs.length > 0) {
            jobs = rawJobs.map(j => ({ ...j, score: computeScore(j) })).sort((a, b) => b.score - a.score);
            topJobs = jobs.filter(j => j.score >= 60);
            otherJobs = jobs.filter(j => j.score >= 30 && j.score < 60);
            renderVacancies();
        } else {
            loadJobs();
        }
    };

    // --- Vacantes ---
    let rawJobs = [];
    let jobs = [];
    let topJobs = [];
    let otherJobs = [];

    async function loadJobs() {
        const list = document.getElementById("vacancies-list");
        if (list) {
            list.innerHTML = `
                <div class="p-10 text-center flex flex-col items-center justify-center">
                    <svg class="animate-spin h-8 w-8 text-brand-primary mb-4" viewBox="0 0 24 24" fill="none">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    <p class="text-slate-500 font-medium">Cargando vacantes...</p>
                </div>
            `;
        }

        try {
            const response = await fetch("http://localhost:8000/jobs");
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            rawJobs = await response.json();

            // Recalcular scores basados en el perfil actual
            jobs = rawJobs.map(j => ({ ...j, score: computeScore(j) })).sort((a, b) => b.score - a.score);
            topJobs = jobs.filter(j => j.score >= 60);
            otherJobs = jobs.filter(j => j.score >= 30 && j.score < 60);

            // Solo renderizar si el fetch fue exitoso
            renderVacancies();
        } catch (error) {
            console.error("Error cargando vacantes:", error);
            if (list) {
                list.innerHTML = `
                    <div class="p-8 mt-4 text-center bg-red-50 border border-red-200 rounded-xl">
                        <i class="fa-solid fa-triangle-exclamation text-red-500 text-3xl mb-3"></i>
                        <p class='text-red-700 font-medium'>No se pudieron cargar las vacantes. Verifica la conexión.</p>
                    </div>
                `;
            }
        }
    }


    let selectedJobId = null;
    let appliedJobIds = new Set();

    function scoreColor(score) {
        if (score >= 75) return "text-brand-primary";
        if (score >= 50) return "text-yellow-400";
        return "text-slate-400";
    }

    function renderCard(job, rank) {
        const isSelected = selectedJobId === job.id;
        const isApplied = appliedJobIds.has(job.id);
        const matched = candidate.skills.filter(s => job.required_skills.includes(s));

        let podiumIcon = "";
        if (rank === 1) podiumIcon = `<span title="#1 Top Match" class="rank-icon">💚</span>`;
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
    window.runMatchingFromCV = async function (datos) {
        if (datos.skills) candidate.skills = datos.skills.split(',').map(s => s.trim()).filter(Boolean);
        if (datos.expYears) candidate.experience_years = Number(datos.expYears) || 0;

        await saveCandidateProfile({
            skills: candidate.skills,
            experience_years: candidate.experience_years,
        });

        // Recalcular scores
        jobs.forEach(j => { j.score = computeScore(j); });
        jobs.sort((a, b) => b.score - a.score);

        // Reclasificar
        topJobs.length = 0;
        otherJobs.length = 0;
        jobs.forEach(j => {
            if (j.score >= 60) topJobs.push(j);
            else if (j.score >= 30) otherJobs.push(j);
        });

        // Si había una vacante seleccionada, cerrarla para mostrar el ranking actualizado
        selectedJobId = null;
        const detailsContainer = document.getElementById("job-details-container");
        const emptyState = document.getElementById("empty-state");
        if (detailsContainer) detailsContainer.classList.add("hidden");
        if (emptyState) emptyState.classList.remove("hidden");

        loadJobs();
    };

    // --- Detalle de vacante ---
    window.selectJob = function (id) {
        selectedJobId = id;
        loadJobs();

        const job = jobs.find(j => j.id === id);
        if (!job) return;
        const detailsContainer = document.getElementById("job-details-container");
        const emptyState = document.getElementById("empty-state");
        const isApplied = appliedJobIds.has(job.id);
        const matched = candidate.skills.filter(s => job.required_skills.includes(s));
        const missing = job.required_skills.filter(s => !candidate.skills.includes(s));

        if (emptyState) emptyState.classList.add("hidden");
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
        const spinner = document.getElementById("loading-spinner");
        const applyBtn = document.getElementById(`apply-btn-${jobId}`);

        if (!candidate.id) {
            await saveCandidateProfile({
                skills: candidate.skills,
                experience_years: candidate.experience_years,
            });
        }

        if (applyBtn) {
            applyBtn.disabled = true;
            applyBtn.innerHTML = '<svg class="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Enviando...';
        }
        if (spinner) spinner.classList.remove("hidden");

        const fullJob = jobs.find(j => j.id === jobId);

        await submitApplicationBackend(jobId, jobTitle, company);
        
        try {
            const res = await fetch("http://localhost:5678/webhook/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "APPLICATION_SUBMITTED",
                    candidate: candidate,
                    job: fullJob || { id: jobId, title: jobTitle, company: company }
                })
            });
            if (!res.ok) {
                console.error("Error desde n8n:", res.status, await res.text());
            }
        } catch (error) {
            console.error("No se pudo conectar a n8n:", error);
        }

        await new Promise(r => setTimeout(r, 1000));
        if (spinner) spinner.classList.add("hidden");

        appliedJobIds.add(jobId);

        const toastDetail = document.getElementById("postulation-toast-detail");
        if (toastDetail) toastDetail.textContent = `Aplicaste a "${jobTitle}" en ${company}`;
        showToast("postulation-toast", 5000);

        selectJob(jobId);
    };

    // --- Render inicial ---
    loadJobs();

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
        startAIAnalysis();

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('http://localhost:8000/api/extraer-cv', {
                method: 'POST',
                body: formData
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
                    nombre: datos.nombre || '',
                    skills: (datos.habilidades || []).join(', '),
                    expYears: datos.experiencia_anos || 0
                });
            }

            mostrarEstadoCV('listo', datos.nombre || 'candidato');

        } catch (error) {
            console.error('Error procesando CV:', error);
            mostrarEstadoCV('error', error.message || 'Error al conectar con el servidor.');
        } finally {
            stopAIAnalysis();
        }

        // Limpiar el input para permitir subir el mismo archivo de nuevo
        this.value = '';
    });
});

// --- Feedback visual del botón de CV ---
function mostrarEstadoCV(estado, info) {
    const div = document.getElementById('cv-status');
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

// --- AI Analysis Overlay ---
function startAIAnalysis() {
    const aiOverlay = document.getElementById("ai-overlay");
    if (!aiOverlay) return;

    // Reset styles if it's run multiple times without reloading
    resetOverlayStyles();

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
                dot.classList.remove("animate-pulse");
                dot.classList.add("hidden");
                const check = step.querySelector(".fa-check");
                if (check) check.classList.remove("hidden");
            }
        }, delays[i] + 600);
    });

    // Fire n8n webhook silently (fire-and-forget)
    if(typeof triggerN8nSilently === 'function') {
        triggerN8nSilently();
    }
}

function stopAIAnalysis() {
    const aiOverlay = document.getElementById("ai-overlay");
    if (!aiOverlay) return;
    
    setTimeout(() => {
        aiOverlay.classList.add("hidden");
        document.body.style.overflow = "auto";
    }, 800); // Dar un poco de tiempo para que se vea el último step completado
}

function resetOverlayStyles() {
    const steps = [
        document.getElementById("step-1"),
        document.getElementById("step-2"),
        document.getElementById("step-3"),
        document.getElementById("step-4"),
    ];
    
    steps.forEach((step) => {
        if (!step) return;
        step.className = "flex items-center gap-3 text-slate-500 transition-colors duration-500";
        const dot = step.querySelector(".step-dot");
        if(dot) dot.className = "w-2 h-2 rounded-full bg-slate-600 step-dot";
        const check = step.querySelector(".fa-check");
        if(check) check.classList.add("hidden");
    });
}