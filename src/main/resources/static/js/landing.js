// Efecto para la navbar al hacer scroll
window.addEventListener('scroll', function() {
    const nav = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        nav.style.backgroundColor = 'rgba(0, 0, 0, 0.98)';
        nav.style.padding = '0.5rem 0';
    } else {
        nav.style.backgroundColor = 'rgba(0, 0, 0, 0.95)';
        nav.style.padding = '0.8rem 0';
    }
});