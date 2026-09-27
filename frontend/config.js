// ============================================================
// config.js — Configuración central del frontend
// ------------------------------------------------------------
// Centraliza las URLs de los servicios de backend para no tenerlas
// dispersas ni hardcodeadas en el código.
//
// Para apuntar a otro entorno (staging/producción), sobreescribe estos
// valores ANTES de cargar este archivo, por ejemplo:
//
//   <script>window.APP_CONFIG = { API_BASE: "https://api.midominio.com" };</script>
//   <script src="config.js"></script>
//
// o edita directamente los valores por defecto de abajo.
// ============================================================
(function () {
    const defaults = {
        // Backend FastAPI
        API_BASE: "http://localhost:8000",
        // Webhook de n8n
        N8N_BASE: "http://localhost:5678",
    };

    // Respeta cualquier configuración inyectada previamente en window.APP_CONFIG.
    window.APP_CONFIG = Object.assign({}, defaults, window.APP_CONFIG || {});
})();
