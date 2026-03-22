const API_BASE_URL = 'http://localhost:8081/api/auth';

function manejarLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    Swal.fire({ title: 'Entrando...', background: '#1a1a1a', color: '#fff', didOpen: () => { Swal.showLoading(); } });

    fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(async res => {
        if (!res.ok) throw new Error('Usuario o contraseña incorrectos');
        return res.json();
    })
    .then(datos => {
        localStorage.setItem('token_barberia', datos.token);
        
        try {
            // 1. Decodificamos el token
            const payloadBase64 = datos.token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
            const payloadStr = decodeURIComponent(window.atob(payloadBase64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
            
            // 2. Pasamos a mayúsculas para la búsqueda de roles
            const todoElTokenEnTexto = payloadStr.toUpperCase();

            Swal.fire({ icon: 'success', title: '¡Hola!', timer: 1000, showConfirmButton: false, background: '#1a1a1a', color: '#fff' })
            .then(() => {
                // --- EL SEMÁFORO DE REDIRECCIÓN ACTUALIZADO ---
                if (todoElTokenEnTexto.includes('ADMIN')) {
                    // Prioridad 1: Administrador
                    window.location.href = "panel.html";
                } 
                else if (todoElTokenEnTexto.includes('BARBERO')) {
                    // Prioridad 2: Barbero (Nueva pantalla)
                    window.location.href = "barbero.html";
                } 
                else {
                    // Por defecto: Cliente
                    window.location.href = "cliente.html";
                }
            });
        } catch (error) {
            console.error("Error al leer el token", error);
            window.location.href = "cliente.html"; 
        }
    })
    .catch(err => {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message, background: '#1a1a1a', color: '#fff', confirmButtonColor: '#d4af37' });
    });
}

// --- FUNCIÓN DE REGISTRO (Se mantiene igual) ---
function manejarRegistro(e) {
    e.preventDefault();
    
    const body = {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellidos').value,
        telefono: document.getElementById('telefono').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value
    };

    Swal.fire({
        title: 'Creando cuenta...',
        background: '#1a1a1a',
        color: '#fff',
        didOpen: () => { Swal.showLoading(); }
    });

    fetch(`${API_BASE_URL}/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    })
    .then(async res => {
        const text = await res.text();
        if (!res.ok) throw new Error(text || 'Error en el registro');
        return text;
    })
    .then(msg => {
        Swal.fire({
            icon: 'success',
            title: '¡Cuenta creada!',
            text: msg + '. Ahora puedes iniciar sesión.',
            confirmButtonColor: '#d4af37',
            background: '#1a1a1a',
            color: '#fff'
        }).then(() => {
            window.location.href = "login.html";
        });
    })
    .catch(err => {
        Swal.fire({
            icon: 'error',
            title: 'Error al registrar',
            text: err.message === "Failed to fetch" ? "No hay conexión con el servidor." : err.message,
            confirmButtonColor: '#d4af37',
            background: '#1a1a1a',
            color: '#fff'
        });
    });
}