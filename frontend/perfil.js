document.getElementById('profileForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const fields = this.querySelectorAll('[required]');
    let isValid = true;
    let firstErrorField = null;

    fields.forEach(field => {
        field.classList.remove('input-error');
        
        // Validar si está vacío o si es un archivo no seleccionado
        const isEmpty = !field.value.trim();
        const isFileEmpty = field.type === 'file' && field.files.length === 0;

        if (isEmpty || isFileEmpty) {
            isValid = false;
            field.classList.add('input-error');
            if (!firstErrorField) firstErrorField = field;
        }
    });

    if (!isValid) {
        alert("Favor ingresar información válida en los campos obligatorios.");
        // CA-03: Foco y cursor en el primer campo vacío
        firstErrorField.focus();
    } else {
        alert("Perfil profesional guardado con éxito. Iniciando scoring de vacantes...");
        // Redirigimos automáticamente al dashboard / vista principal
        window.location.href = "dashboard.html";
    }
});