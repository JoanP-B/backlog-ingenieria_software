// Añade un efecto sutil cuando el mouse se mueve sobre la sección hero
const hero = document.querySelector('.hero');
const cards = document.querySelectorAll('.card');

hero.addEventListener('mousemove', (e) => {
    let xAxis = (window.innerWidth / 2 - e.pageX) / 25;
    let yAxis = (window.innerHeight / 2 - e.pageY) / 25;
    
    // Solo aplicamos un ligero movimiento a la tarjeta principal
    document.querySelector('.main-card').style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
});

// Resetear posición al salir
hero.addEventListener('mouseleave', () => {
    document.querySelector('.main-card').style.transform = `rotateY(0deg) rotateX(0deg)`;
});