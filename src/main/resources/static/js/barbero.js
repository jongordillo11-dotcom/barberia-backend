const API_BASE_URL = '/api';
let token = localStorage.getItem('token_barberia');
let misCitas = [];
let barberoEmail = null;
let chartInstancia = null;

window.onload = () => {
    if (!token) { window.location.href = "login.html"; return; }
    
    // Decodificar Token para saber quién es el barbero
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        barberoEmail = payload.sub; // El email suele venir en el subject
        document.getElementById('nombre-barbero').innerText = "Hola, " + barberoEmail;
        
        cargarDatosBarbero();
    } catch (e) {
        console.error("Error al leer el token", e);
        window.location.href = "login.html";
    }
};

// --- NAVEGACIÓN ---
function mostrarSeccion(e, seccion) {
    if (e) e.preventDefault();

    // Reset de UI
    document.querySelectorAll('.content-section').forEach(s => s.classList.add('d-none'));
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(l => l.classList.remove('active'));

    // Activar sección
    document.getElementById(`seccion-${seccion}`).classList.remove('d-none');
    if (e) e.currentTarget.classList.add('active');

    // Actualizar título
    const titulos = { 'dashboard': 'Mis Estadísticas', 'agenda': 'Mi Agenda Visual', 'citas': 'Gestión de Citas' };
    document.getElementById('titulo-seccion').innerText = titulos[seccion];

    // Cargas específicas
    if (seccion === 'agenda') renderizarCalendarioBarbero();
    if (seccion === 'citas') cargarTablaCitasBarbero();
}

// --- CARGA DE DATOS ---
async function cargarDatosBarbero() {
    try {
        const res = await fetch(`${API_BASE_URL}/citas`, { 
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        const todas = await res.json();
        
        // Filtramos las citas de Antonio
        misCitas = todas.filter(c => c.barbero && c.barbero.email === barberoEmail);

        // Actualizar Dashboard
        const hoy = new Date().toLocaleDateString();
        const citasHoy = misCitas.filter(c => new Date(c.fechaHora).toLocaleDateString() === hoy);
        const completadas = misCitas.filter(c => c.estado === 'COMPLETADA');

        document.getElementById('stats-hoy').innerText = citasHoy.length;
        document.getElementById('stats-semanales').innerText = completadas.length;
        
        // Cálculo de comisión (20% del total de servicios completados)
        const totalDinero = completadas.reduce((acc, c) => acc + (c.servicio?.precio || 0), 0);
        document.getElementById('stats-ganancias').innerText = (totalDinero * 0.20).toFixed(2) + "€";

        renderizarGrafico(completadas.length, citasHoy.length);

    } catch (e) {
        console.error("Error cargando datos del barbero:", e);
    }
}

// --- TABLA DE GESTIÓN ---
function cargarTablaCitasBarbero() {
    const tbody = document.getElementById('tabla-citas-barbero');
    if (misCitas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-muted p-4">No tienes citas asignadas.</td></tr>';
        return;
    }

    tbody.innerHTML = misCitas.map(c => `
        <tr>
            <td>${new Date(c.fechaHora).toLocaleString([], {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'})}</td>
            <td class="fw-bold">${c.cliente?.nombre || 'Cliente'}</td>
            <td>${c.servicio?.nombre || 'Servicio'}</td>
            <td><span class="badge ${getBadgeColor(c.estado)}">${c.estado}</span></td>
            <td>
                <button class="btn btn-sm btn-success" title="Completar" onclick="cambiarEstadoCita(${c.id}, 'COMPLETADA')">
                    <i class="bi bi-check-lg"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger ms-1" title="Cancelar" onclick="cambiarEstadoCita(${c.id}, 'CANCELADA_BARBERIA')">
                    <i class="bi bi-x-lg"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// --- CALENDARIO ---
// --- CALENDARIO RESPONSIVE ---
function renderizarCalendarioBarbero() {
    const calendarEl = document.getElementById('calendar-barbero');

    // Detectamos si es un móvil (menos de 768px)
    const esMovil = window.innerWidth < 768;

    const eventos = misCitas.map(c => ({
        title: `${c.cliente?.nombre} - ${c.servicio?.nombre}`,
        start: c.fechaHora,
        color: c.estado === 'COMPLETADA' ? '#0dcaf0' : (c.estado === 'CONFIRMADA' ? '#198754' : '#d4af37')
    }));

    const calendar = new FullCalendar.Calendar(calendarEl, {
        // En móvil mostramos el día, en PC la semana
        initialView: esMovil ? 'timeGridDay' : 'timeGridWeek',
        locale: 'es',
        events: eventos,
        allDaySlot: false,
        slotMinTime: '08:00:00',
        slotMaxTime: '21:00:00',
        height: 'auto',
        // CONFIGURACIÓN DE BOTONES PARA MÓVIL
        headerToolbar: {
            left: esMovil ? 'prev,next' : 'prev,next today', // Quitamos "today" en móvil
            center: 'title',
            right: esMovil ? '' : 'timeGridDay,listWeek' // Quitamos selectores en móvil para que no choquen
        },
        // Ajustamos el tamaño de la fuente si es móvil
        contentHeight: esMovil ? 500 : 'auto'
    });

    calendar.render();
}
// --- UTILIDADES ---
function cambiarEstadoCita(id, nuevoEstado) {
    fetch(`${API_BASE_URL}/citas/${id}/estado?nuevoEstado=${nuevoEstado}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    }).then(res => {
        if (!res.ok) throw new Error();
        Swal.fire({ icon: 'success', title: 'Actualizado', background: '#1a1a1a', color: '#fff', timer: 1500, showConfirmButton: false });
        cargarDatosBarbero().then(() => cargarTablaCitasBarbero());
    }).catch(() => Swal.fire('Error', 'No se pudo actualizar la cita', 'error'));
}

function getBadgeColor(e) {
    if (e === 'COMPLETADA') return 'bg-info text-dark';
    if (e === 'CONFIRMADA') return 'bg-success';
    if (e === 'PENDIENTE_CONFIRMACION') return 'bg-warning text-dark';
    return 'bg-danger';
}

function renderizarGrafico(completadas, hoy) {
    if (chartInstancia) chartInstancia.destroy();
    const options = {
        chart: { type: 'bar', height: 250, toolbar: {show: false} },
        series: [{ name: 'Citas', data: [completadas, hoy] }],
        xaxis: { categories: ['Total Completadas', 'Hoy'], labels: {style: {colors: '#fff'}} },
        colors: ['#d4af37'],
        theme: { mode: 'dark' }
    };
    chartInstancia = new ApexCharts(document.querySelector("#chart-barbero"), options);
    chartInstancia.render();
}

function cerrarSesion() {
    localStorage.removeItem('token_barberia');
    window.location.href = "index.html";
}
