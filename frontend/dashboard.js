const dbVacantes = [
    {
        id: "v1",
        empresa: "EPM",
        titulo: "Técnico Auxiliar de Sistemas",
        ubicacion: "Medellín, Colombia",
        salarioCOP: 3500000,
        req_skills: ["Soporte", "Redes", "Linux", "Windows Server"]
    },
    {
        id: "v2",
        empresa: "Bancolombia",
        titulo: "Desarrollador Junior",
        ubicacion: "Remoto, Colombia",
        salarioCOP: 5000000,
        req_skills: ["Python", "SQL", "Git", "Backend"]
    },
    {
        id: "v3",
        empresa: "Globant",
        titulo: "Tech Support Nivel 2",
        ubicacion: "Bogotá, Colombia",
        salarioCOP: 3000000,
        req_skills: ["Soporte", "Atención al cliente", "Inglés"]
    },
    {
        id: "v4",
        empresa: "Nubank",
        titulo: "Data Engineer Associate",
        ubicacion: "Remoto",
        salarioCOP: 6000000,
        req_skills: ["Python", "SQL", "Cloud", "ETL"]
    }
];

const TASA_CAMBIO = 4000;

function formatearCOP(valor) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency",
        currency: "COP",
        maximumFractionDigits: 0
    }).format(valor);
}

function formatearUSD(valor) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0
    }).format(valor / TASA_CAMBIO);
}

function calcularScore(vacante, perfil) {
    const pUbicacion = perfil.ubicacion.toLowerCase();
    const vUbicacion = vacante.ubicacion.toLowerCase();

    let score = 40;

    if (
        vUbicacion.includes(pUbicacion) ||
        vUbicacion.includes("remoto") ||
        pUbicacion.includes(vUbicacion)
    ) {
        score += 20;
    }

    if (perfil.salario <= vacante.salarioCOP) {
        score += 15;
    } else {
        score -= 10;
    }

    const perfilSkills = perfil.skills.split(",").map((s) => s.trim().toLowerCase());
    const vacanteSkills = vacante.req_skills.map((s) => s.toLowerCase());

    let matchCount = 0;
    vacanteSkills.forEach((req) => {
        if (perfilSkills.some((ps) => ps.includes(req) || req.includes(ps))) {
            matchCount++;
        }
    });

    const skillScore = (matchCount / vacanteSkills.length) * 25;
    score += skillScore;

    return Math.min(Math.max(Math.round(score), 0), 100);
}

function getScoreClass(score) {
    if (score >= 80) return "score-high";
    if (score >= 60) return "score-med";
    return "score-low";
}

function refreshRanking() {
    const btn = document.querySelector(".btn-outline i");
    if (btn) btn.classList.add("fa-spin");

    const perfil = {
        ubicacion: document.getElementById("user-location").value,
        salario: parseInt(document.getElementById("user-salary").value, 10) || 0,
        skills: document.getElementById("user-skills").value
    };

    const vacantesEvaluadas = dbVacantes
        .map((v) => ({ ...v, score: calcularScore(v, perfil) }))
        .sort((a, b) => b.score - a.score);

    setTimeout(() => {
        renderGrid(vacantesEvaluadas);
        if (btn) btn.classList.remove("fa-spin");
    }, 400);
}

function renderGrid(vacantes) {
    const grid = document.getElementById("ranking-grid");
    grid.innerHTML = "";

    vacantes.forEach((v) => {
        const scoreClass = getScoreClass(v.score);

        const card = document.createElement("div");
        card.className = `job-card ${scoreClass}`;

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h3 class="job-title">${v.titulo}</h3>
                    <p class="company-name"><i class="fa-regular fa-building"></i> ${v.empresa}</p>
                </div>
                <div class="score-badge">${v.score}/100</div>
            </div>

            <div class="job-details">
                <div class="detail-item">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${v.ubicacion}</span>
                </div>
                <div class="detail-item">
                    <i class="fa-solid fa-money-bill-wave"></i>
                    <span class="salary-tag">${formatearCOP(v.salarioCOP)} <span class="usd-tag">${formatearUSD(v.salarioCOP)}</span></span>
                </div>
            </div>

            <div class="card-actions">
                <button class="btn-primary w-100" onclick="aplicarVacante('${v.id}')">
                    <span id="btn-text-${v.id}">Aplicar (Mandar a n8n)</span>
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

async function aplicarVacante(id) {
    const btnText = document.getElementById(`btn-text-${id}`);
    const originalText = btnText.innerHTML;
    btnText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Procesando en n8n...';

    const vacante = dbVacantes.find((v) => v.id === id);
    const perfil = {
        ubicacion: document.getElementById("user-location").value,
        salario: parseInt(document.getElementById("user-salary").value, 10) || 0,
        skills: document.getElementById("user-skills").value,
        name: "Usuario Candidato"
    };

    const payload = {
        candidate: {
            id: "user_simulado",
            name: perfil.name,
            skills: perfil.skills.split(",").map((s) => s.trim()),
            experience_years: 3
        },
        job: {
            id: vacante.id,
            title: vacante.titulo,
            required_skills: vacante.req_skills,
            min_experience_years: 2
        }
    };

    try {
        let response = await fetch("http://localhost:5678/webhook-test/job-match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            response = await fetch("http://localhost:5678/webhook/job-match", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
        }

        if (response.ok) {
            const data = await response.json();
            alert(
                `¡Completado!\n\nDatos recuperados desde API (via n8n):\n✅ Score final del candidato: ${data.score}%\n✅ Empresa: ${vacante.empresa}`
            );
        } else {
            alert("Error: Asegúrate de darle click a 'Test Workflow' en n8n y luego darle a este botón.");
        }
    } catch (error) {
        alert("Error de comunicación con n8n. ¿Aseguraste darle a 'Test workflow' en n8n?");
    }

    btnText.innerHTML = originalText;
}

window.onload = refreshRanking;
