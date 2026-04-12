const loginForm = document.getElementById("login-form");
const identifierInput = document.getElementById("login-identifier");
const passwordInput = document.getElementById("login-password");
const registerLink = document.getElementById("register-link");
const loginMessage = document.getElementById("login-message");

function showMessage(message) {
    loginMessage.textContent = message;
    loginMessage.classList.add("is-visible");
}

function clearMessage() {
    loginMessage.textContent = "";
    loginMessage.classList.remove("is-visible");
}

function clearFieldErrors() {
    identifierInput.classList.remove("input-error");
    passwordInput.classList.remove("input-error");
}

function setFieldError(input) {
    input.classList.add("input-error");
    input.focus();
}

if (registerLink) {
    registerLink.addEventListener("click", (event) => {
        event.preventDefault();
        window.location.href = "registro.html";
    });
}

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        clearMessage();
        clearFieldErrors();

        const usernameOrEmail = identifierInput.value.trim();
        const password = passwordInput.value;

        if (!usernameOrEmail || !password) {
            const errorMessage = "Favor ingresar información válida en los campos obligatorios.";

            showMessage(errorMessage);
            alert(errorMessage);

            if (!usernameOrEmail) {
                setFieldError(identifierInput);
            } else {
                setFieldError(passwordInput);
            }

            return;
        }

        try {
            const response = await fetch("http://localhost:8000/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                body: new URLSearchParams({
                    username: usernameOrEmail,
                    password: password
                })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("access_token", data.access_token);
                localStorage.setItem("token_type", data.token_type);

                showMessage("Inicio de sesión exitoso. Redirigiendo...");
                window.location.href = "vistaprincipal.html";
                return;
            }

            if (response.status === 404) {
                showMessage("Usuario no encontrado.");
                return;
            }

            if (response.status === 401) {
                showMessage("Correo o contraseña incorrectos. Intente nuevamente.");
                return;
            }

            if (response.status === 400) {
                showMessage("Favor ingresar información válida en los campos obligatorios.");
                return;
            }

            showMessage(data.detail || "Ocurrió un error al iniciar sesión.");
        } catch (error) {
            showMessage("No fue posible conectar con el servidor. Intente nuevamente.");
        }
    });
}
