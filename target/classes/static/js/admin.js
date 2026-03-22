const API_BASE_URL = 'http://localhost:8081/api';
let token = localStorage.getItem('token_barberia');

let listaGlobalServicios = [];
let listaGlobalCitas = [];
let listaGlobalProductos = [];
let listaGlobalBarberos = [];
let listaGlobalUsuarios = [];
let calendarInstance = null;
let chartInstance = null;
let chartReporteInstance = null;

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1a1a1a', color: '#fff' });
const spinnerHtml = `<div class="text-center p-4"><div class="spinner-border text-gold" role="status"></div></div>`;

// --- INICIO ---
window.onload = function() {
    if (!token || token === "undefined") { window.location.href = "login.html"; return; }
    try {
        const payload = JSON.parse(decodeURIComponent(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        document.getElementById('usuario-email').innerText = payload.sub;
    } catch (e) { document.getElementById('usuario-email').innerText = "Admin Logueado"; }

    volverAlDashboard();
};

function cerrarSesion() { localStorage.removeItem('token_barberia'); window.location.href = "index.html"; }

function abrirSeccionPro(seccionId, elementoNav, tituloHeader) {
    document.querySelectorAll('.seccion-panel').forEach(s => s.classList.add('d-none'));
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => link.classList.remove('active'));
    document.getElementById(seccionId).classList.remove('d-none');
    if(elementoNav) elementoNav.classList.add('active');
    document.getElementById('header-titulo').innerText = tituloHeader;
}

function volverAlDashboard(e) {
    if(e) e.preventDefault();
    abrirSeccionPro('zona-dashboard', document.getElementById('nav-dashboard'), 'Dashboard General');
    cargarDashboardCompleto();
}

function cerrarFormulario(idFormulario) {
    const contenedor = document.getElementById(idFormulario);
    if (contenedor) {
        contenedor.classList.add('d-none');
        const form = contenedor.querySelector('form');
        if (form) form.reset();
    }
}

function cargarCitasCompleta(elem) { abrirSeccionPro('zona-citas-completa', elem.currentTarget || elem, 'Historial de Citas'); cargarCitasTabla(); }
function cargarBarberos(elem) { abrirSeccionPro('zona-barberos', elem.currentTarget || elem, 'Gestión de Barberos'); cargarBarberosTabla(); }
function cargarServicios(elem) { abrirSeccionPro('zona-servicios', elem.currentTarget || elem, 'Catálogo de Servicios'); cargarServiciosTabla(); }
function cargarUsuarios(elem) { abrirSeccionPro('zona-usuarios', elem.currentTarget || elem, 'Control de Usuarios'); cargarUsuariosTabla(); }
function cargarProductos(elem) { abrirSeccionPro('zona-productos', elem.currentTarget || elem, 'Inventario de Productos'); cargarProductosTabla(); }
function cargarReportes(elem) { abrirSeccionPro('zona-reportes', elem.currentTarget || elem, 'Reporte de Ingresos'); calcularReportes(); }

function mostrarError(m) { Swal.fire({ icon: 'error', title: 'Oops', text: m, background: '#1a1a1a', color: '#fff', confirmButtonColor: '#d4af37' }); }
function confirmarAccion(t, text, acc) { Swal.fire({ title: t, text: text, icon: 'warning', showCancelButton: true, confirmButtonColor: '#dc3545', cancelButtonColor: '#444', confirmButtonText: 'Sí, aplicar', cancelButtonText: 'Cancelar', background: '#1a1a1a', color: '#fff' }).then(r => { if (r.isConfirmed) acc(); }); }

// --- DASHBOARD Y CALENDARIO ---
async function cargarDashboardCompleto() {
    const calDiv = document.getElementById('calendario-visual');
    calDiv.innerHTML = spinnerHtml;

    try {
        const [citas, usuarios] = await Promise.all([
            fetch(`${API_BASE_URL}/citas`, {headers: {'Authorization': 'Bearer ' + token}}).then(r => r.json()),
            fetch(`${API_BASE_URL}/usuarios`, {headers: {'Authorization': 'Bearer ' + token}}).then(r => r.json())
        ]);

        listaGlobalCitas = citas;

        document.getElementById('counter-confirmadas').innerText = citas.filter(c => c.estado === 'CONFIRMADA').length;
        document.getElementById('counter-pendientes').innerText = citas.filter(c => c.estado === 'PENDIENTE_CONFIRMACION').length;
        document.getElementById('counter-canceladas').innerText = citas.filter(c => c.estado === 'CANCELADA_CLIENTE' || c.estado === 'CANCELADA_BARBERIA').length;
        document.getElementById('counter-clientes').innerText = usuarios.filter(u => !u.roles || u.roles.length === 0 || u.roles.some(rol => rol.nombre === 'ROLE_CLIENTE')).length;


        const tbodyMini = document.getElementById('tabla-mini-citas');
        tbodyMini.innerHTML = '';

        const proximas = citas
            .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
            .slice(0, 6); // Mostramos las 6 primeras que haya

        if (proximas.length === 0) {
            tbodyMini.innerHTML = '<tr><td colspan="4" class="text-center text-white opacity-50 p-3">No hay citas en la base de datos</td></tr>';
        } else {
            proximas.forEach(c => {
                const fechaObj = new Date(c.fechaHora);
                const diaHora = fechaObj.toLocaleDateString([], {day: '2-digit', month: '2-digit'}) + ' ' + fechaObj.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
                tbodyMini.innerHTML += `
                    <tr>
                        <td class="text-gold fw-bold">${diaHora}</td>
                        <td class="text-white">${c.cliente?.nombre || 'N/A'}</td>
                        <td class="text-white">${c.barbero?.nombre || 'N/A'}</td>
                        <td><span class="badge ${getBadgeEstado(c.estado)}">${c.estado}</span></td>
                    </tr>`;
            });
        }

        const eventos = citas.map(c => {
            const fIni = new Date(c.fechaHora);
            let col = '#6c757d';
            if (c.estado === 'CONFIRMADA') col = '#198754';
            if (c.estado === 'PENDIENTE_CONFIRMACION') col = '#d39e00';
            if (c.estado === 'COMPLETADA') col = '#0dcaf0';
            if (c.estado === 'CANCELADA_CLIENTE' || c.estado === 'CANCELADA_BARBERIA') col = '#dc3545';
            return {
                title: `${c.cliente?.nombre || 'Anon'} - ${c.servicio?.nombre || ''}`,
                start: fIni.toISOString(),
                end: new Date(fIni.getTime() + (c.servicio?.duracionMinutos || 30) * 60000).toISOString(),
                backgroundColor: col,
                borderColor: col,
                extendedProps: {est: c.estado, b: c.barbero?.nombre}
            };
        });

        if (calendarInstance) calendarInstance.destroy();
        calDiv.innerHTML = '';

        const esPantallaPequeña = window.innerWidth < 992;

        calendarInstance = new FullCalendar.Calendar(calDiv, {
            initialView: esPantallaPequeña ? 'timeGridDay' : 'timeGridWeek',
            locale: 'es',

            headerToolbar: {
                left: esPantallaPequeña ? 'prev,next' : 'prev,next today',
                center: 'title',
                right: esPantallaPequeña ? '' : 'dayGridMonth,timeGridWeek,timeGridDay'
            },

            slotMinTime: '08:00:00',
            slotMaxTime: '22:00:00',
            allDaySlot: false,
            height: 'auto',
            aspectRatio: esPantallaPequeña ? 0.6 : 1.5,
            events: eventos,

            windowResize: function(arg) {
                if (window.innerWidth < 992) {
                    calendarInstance.changeView('timeGridDay');
                    calendarInstance.setOption('headerToolbar', { left: 'prev,next', center: 'title', right: '' });
                } else {
                    calendarInstance.changeView('timeGridWeek');
                    calendarInstance.setOption('headerToolbar', { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' });
                }
            },

            eventClick: info => Swal.fire({
                title: 'Reserva',
                html: `<b>Servicio:</b> ${info.event.title}<br><b>Barbero:</b> ${info.event.extendedProps.b}<br><b>Estado:</b> ${info.event.extendedProps.est}`,
                background: '#1a1a1a',
                color: '#fff',
                confirmButtonColor: '#d4af37'
            })
        });

        calendarInstance.render();

        if(typeof renderizarGraficoDonut === 'function') {
            renderizarGraficoDonut(citas);
        }

    } catch (e) {
        console.error("Error en Dashboard:", e);
    }
}

function renderizarGraficoDonut(citas) {
    if (chartInstance) chartInstance.destroy();
    const conf = citas.filter(c => c.estado === 'CONFIRMADA').length;
    const pend = citas.filter(c => c.estado === 'PENDIENTE_CONFIRMACION').length;
    const canc = citas.filter(c => c.estado === 'CANCELADA_CLIENTE' || c.estado === 'CANCELADA_BARBERIA').length;
    const comp = citas.filter(c => c.estado === 'COMPLETADA').length;

    chartInstance = new ApexCharts(document.querySelector("#grafico-estados"), {
        series: [conf, pend, canc, comp],
        labels: ['Confirmadas', 'Pendientes', 'Canceladas', 'Completadas'],
        colors: ['#198754', '#ffc107', '#dc3545', '#0dcaf0'],
        chart: {type: 'donut', height: 280},
        theme: {mode: 'dark'},
        legend: {position: 'bottom'}
    });
    chartInstance.render();
}

// ---  CITAS ---
function cargarCitasTabla() {
    const tbody = document.getElementById('tabla-citas-body'); tbody.innerHTML = `<tr><td colspan="6">${spinnerHtml}</td></tr>`;
    fetch(`${API_BASE_URL}/citas`, { headers: { 'Authorization': 'Bearer ' + token } }).then(res => res.json()).then(citas => {
        listaGlobalCitas = citas; tbody.innerHTML = '';
        citas.forEach(c => tbody.innerHTML += `<tr><td>${new Date(c.fechaHora).toLocaleString()}</td><td class="fw-bold">${c.cliente?.nombre||'N/A'}</td><td>${c.barbero?.nombre||'N/A'}</td><td>${c.servicio?.nombre||'N/A'}</td><td><span class="badge ${getBadgeEstado(c.estado)}">${c.estado}</span></td><td><select class="form-select form-select-sm d-inline-block w-auto border-secondary bg-dark text-white" onchange="cambiarEstadoCita(${c.id}, this.value)"><option value="" selected disabled>Cambiar...</option><option value="CONFIRMADA">Confirmar</option><option value="COMPLETADA">Completar</option><option value="CANCELADA_BARBERIA">Cancelar</option><option value="NO_PRESENTADO">No vino</option></select><button class="btn btn-sm btn-outline-warning ms-1" onclick="abrirFormularioCita('editar', ${c.id})"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger ms-1" onclick="borrarCita(${c.id})"><i class="bi bi-trash"></i></button></td></tr>`);
    }).catch(err => tbody.innerHTML = `<tr><td colspan="6" class="text-danger">Error: ${err.message}</td></tr>`);
}

async function abrirFormularioCita(modo, id=null) {
    try {
        const [usuariosTodos, barbs, servs] = await Promise.all([
            fetch(`${API_BASE_URL}/usuarios`, { headers: {'Authorization': 'Bearer '+token}}).then(r => r.json()),
            fetch(`${API_BASE_URL}/barberos`, { headers: {'Authorization': 'Bearer '+token}}).then(r => r.json()),
            fetch(`${API_BASE_URL}/servicios`, { headers: {'Authorization': 'Bearer '+token}}).then(r => r.json())
        ]);

        const clis = usuariosTodos.filter(u => !u.roles || u.roles.length === 0 || u.roles.some(rol => rol.nombre === 'ROLE_CLIENTE'));
        const llenar = (el, list, txt) => document.getElementById(el).innerHTML = '<option value="" disabled selected>Seleccionar...</option>' + list.map(i => `<option value="${i.id}">${txt(i)}</option>`).join('');

        llenar('sel-cliente', clis, c => `${c.nombre} ${c.apellidos||''}`);
        llenar('sel-barbero', barbs, b => b.nombre);
        llenar('sel-servicio', servs, s => `${s.nombre} (${s.precio}€)`);

        const inp = document.getElementById('cita-fecha');
        const ah = new Date(); ah.setMinutes(ah.getMinutes() - ah.getTimezoneOffset());
        inp.min = ah.toISOString().slice(0, 10);

        document.getElementById('contenedor-horas-admin').innerHTML = '';
        document.getElementById('label-horas-admin').classList.add('d-none');
        document.getElementById('hora-seleccionada-admin').value = '';

        if (modo === 'editar') {
            const c = listaGlobalCitas.find(x => x.id === id);
            document.getElementById('titulo-form-cita').innerText = "Editar Reserva";
            document.getElementById('cita-id-hidden').value = c.id;
            document.getElementById('sel-cliente').value = c.cliente.id;
            document.getElementById('sel-barbero').value = c.barbero.id;
            document.getElementById('sel-servicio').value = c.servicio.id;
            if(c.fechaHora) {
                inp.value = c.fechaHora.substring(0, 10);
                setTimeout(() => buscarHorasLibresAdmin(), 300);
            }
        } else {
            document.getElementById('titulo-form-cita').innerText = "Programar Reserva";
            document.getElementById('cita-id-hidden').value = "";
            inp.value = "";
        }
        document.getElementById('form-nueva-cita').classList.remove('d-none');
    } catch (e) { mostrarError("Error cargando formulario."); }
}

async function guardarCitaManual(event) {
    event.preventDefault();
    const citaId = document.getElementById('cita-id-hidden').value;
    const fecha = document.getElementById('cita-fecha').value;
    const hora = document.getElementById('hora-seleccionada-admin').value;

    if (!hora) { Swal.fire('Atención', 'Debes seleccionar una de las horas doradas disponibles.', 'warning'); return; }

    const body = {
        clienteId: document.getElementById('sel-cliente').value,
        barberoId: document.getElementById('sel-barbero').value,
        servicioId: document.getElementById('sel-servicio').value,
        fechaHora: `${fecha}T${hora}:00`
    };

    fetch(citaId ? `${API_BASE_URL}/citas/${citaId}` : `${API_BASE_URL}/citas/reservar`, {
        method: citaId ? 'PUT' : 'POST',
        headers: { 'Authorization': 'Bearer '+token, 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    }).then(async res => {
        if(!res.ok) throw new Error(await res.text() || "Error");
        Toast.fire({ icon: 'success', title: 'Guardado' });
        document.getElementById('form-nueva-cita').classList.add('d-none');
        cargarCitasTabla(); cargarDashboardCompleto();
    }).catch(err => mostrarError(err.message));
}

function borrarCita(id) { confirmarAccion('¿Cancelar cita?', 'Se borrará definitivamente', () => { fetch(`${API_BASE_URL}/citas/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }).then(() => { Toast.fire({ icon: 'success', title: 'Eliminada' }); cargarCitasTabla(); cargarDashboardCompleto(); }); }); }
function getBadgeEstado(e) { return e==='CONFIRMADA' ? 'bg-success' : e==='PENDIENTE_CONFIRMACION' ? 'bg-warning text-dark' : e==='COMPLETADA' ? 'bg-info text-dark' : 'bg-danger'; }
function cambiarEstadoCita(id, nEst) { fetch(`${API_BASE_URL}/citas/${id}/estado?nuevoEstado=${nEst}`, { method: 'PUT', headers: { 'Authorization': 'Bearer ' + token } }).then(res => { if(!res.ok) throw new Error(); Toast.fire({ icon: 'success', title: 'Estado actualizado' }); cargarCitasTabla(); cargarDashboardCompleto(); }).catch(() => mostrarError("Error al cambiar estado")); }


// - BARBEROS Y SUS TURNOS ---

function cargarBarberosTabla() {
    const tbody = document.getElementById('tabla-barberos-body'); tbody.innerHTML = `<tr><td colspan="5">${spinnerHtml}</td></tr>`;
    fetch(`${API_BASE_URL}/barberos`, { headers: { 'Authorization': 'Bearer ' + token } }).then(res => res.json()).then(barberos => {
        listaGlobalBarberos = barberos;
        tbody.innerHTML = '';
        barberos.forEach(b => {
            let txt = "Sin asignar";
            let bg = "bg-danger";

            if (b.turnoMananaInicio && b.turnoTardeInicio) {
                txt = "Completo"; bg = "bg-success";
            } else if (b.turnoMananaInicio) {
                txt = "Mañana"; bg = "bg-info text-dark";
            } else if (b.turnoTardeInicio) {
                txt = "Tarde"; bg = "bg-warning text-dark";
            }

            const badgeTurno = `<span class="badge ${bg}">${txt}</span>`;

            tbody.innerHTML += `<tr>
                <td class="fw-bold">${b.nombre} ${b.apellidos || ''}</td>
                <td>${b.email}</td>
                <td>${b.telefono || '-'}</td>
                <td>${badgeTurno}</td>
                <td>
                    <button class="btn btn-sm btn-outline-warning me-1" onclick="mostrarFormularioBarbero('editar', ${b.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger" onclick="borrarBarbero(${b.id})"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        });
    });
}

function mostrarFormularioBarbero(modo, id = null) {
    document.getElementById('formulario-barbero').classList.remove('d-none');
    if (modo === 'crear') {
        document.getElementById('barb-id').value = "";
        document.getElementById('titulo-form-barbero').innerText = "Nuevo Barbero";
        document.getElementById('barb-nombre').value = "";
        document.getElementById('barb-apellidos').value = "";
        document.getElementById('barb-tlf').value = "";
        document.getElementById('barb-turno').value = "";
        document.getElementById('barb-email').value = "";
        document.getElementById('barb-pass').value = "";
        document.getElementById('barb-pass').required = true;
    } else {
        const b = listaGlobalBarberos.find(x => x.id === id);

        let valorSelect = "";
        if (b.turnoMananaInicio && b.turnoTardeInicio) valorSelect = "COMPLETO";
        else if (b.turnoMananaInicio) valorSelect = "MAÑANA";
        else if (b.turnoTardeInicio) valorSelect = "TARDE";

        document.getElementById('barb-id').value = b.id;
        document.getElementById('titulo-form-barbero').innerText = "Editar Barbero";
        document.getElementById('barb-nombre').value = b.nombre;
        document.getElementById('barb-apellidos').value = b.apellidos || "";
        document.getElementById('barb-tlf').value = b.telefono || "";
        document.getElementById('barb-turno').value = valorSelect;
        document.getElementById('barb-email').value = b.email;
        document.getElementById('barb-pass').value = "";
        document.getElementById('barb-pass').required = false;
    }
}

function procesarFormularioBarbero(e) {
    e.preventDefault();
    const id = document.getElementById('barb-id').value;
    const pass = document.getElementById('barb-pass').value;
    const turnoSeleccionado = document.getElementById('barb-turno').value;

    // Establecemostodo a null de base para resetear el turno previo
    const datos = {
        nombre: document.getElementById('barb-nombre').value,
        apellidos: document.getElementById('barb-apellidos').value,
        email: document.getElementById('barb-email').value,
        telefono: document.getElementById('barb-tlf').value,
        turnoMananaInicio: null,
        turnoMananaFin: null,
        turnoTardeInicio: null,
        turnoTardeFin: null
    };

    if (turnoSeleccionado === "MAÑANA" || turnoSeleccionado === "COMPLETO") {
        datos.turnoMananaInicio = "09:00";
        datos.turnoMananaFin = "14:00";
    }

    if (turnoSeleccionado === "TARDE" || turnoSeleccionado === "COMPLETO") {
        datos.turnoTardeInicio = "16:00";
        datos.turnoTardeFin = "21:00";
    }

    if (pass) datos.password = pass;

    fetch(id ? `${API_BASE_URL}/usuarios/${id}` : `${API_BASE_URL}/barberos`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());
            Toast.fire({ icon: 'success', title: 'Guardado correctamente' });
            cargarBarberosTabla();
            cerrarFormulario('formulario-barbero');
        }).catch(err => mostrarError(err.message || "Error al procesar"));
}
function borrarBarbero(id) { confirmarAccion('¿Despedir barbero?', 'Se eliminará de la plantilla', () => { fetch(`${API_BASE_URL}/barberos/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }).then(() => { Toast.fire({ icon: 'success', title: 'Eliminado' }); cargarBarberosTabla(); }); }); }

// ---  SERVICIOS ---
function cargarServiciosTabla() {
    const tbody = document.getElementById('tabla-servicios-body'); tbody.innerHTML = `<tr><td colspan="5">${spinnerHtml}</td></tr>`;
    fetch(`${API_BASE_URL}/servicios`, { headers: { 'Authorization': 'Bearer ' + token } }).then(res => res.json()).then(servicios => {
        listaGlobalServicios = servicios; tbody.innerHTML = '';
        servicios.forEach(s => { tbody.innerHTML += `<tr><td class="fw-bold">${s.nombre}</td><td>${s.descripcion}</td><td class="text-success fw-bold">${s.precio}€</td><td>${s.duracionMinutos}min</td><td><button class="btn btn-sm btn-outline-warning me-1" onclick="mostrarFormularioServicio('editar', ${s.id})"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="borrarServicio(${s.id})"><i class="bi bi-trash"></i></button></td></tr>`; });
    });
}
function mostrarFormularioServicio(modo, id = null) {
    document.getElementById('formulario-servicio').classList.remove('d-none');
    if (modo === 'crear') {
        document.getElementById('serv-id').value = ""; document.getElementById('titulo-form-servicio').innerText = "Nuevo Servicio";
        document.getElementById('serv-nombre').value = ""; document.getElementById('serv-desc').value = "";
        document.getElementById('serv-precio').value = ""; document.getElementById('serv-duracion').value = "";
        document.getElementById('serv-imagen').value = "";
    } else {
        const s = listaGlobalServicios.find(x => x.id === id); document.getElementById('titulo-form-servicio').innerText = "Editar Servicio";
        document.getElementById('serv-id').value = s.id; document.getElementById('serv-nombre').value = s.nombre;
        document.getElementById('serv-desc').value = s.descripcion; document.getElementById('serv-precio').value = s.precio;
        document.getElementById('serv-duracion').value = s.duracionMinutos; document.getElementById('serv-imagen').value = s.imagenUrl || "";
    }
}
function procesarFormularioServicio(e) {
    e.preventDefault(); const id = document.getElementById('serv-id').value;
    const datos = { nombre: document.getElementById('serv-nombre').value, descripcion: document.getElementById('serv-desc').value, precio: document.getElementById('serv-precio').value, duracionMinutos: document.getElementById('serv-duracion').value, imagenUrl: document.getElementById('serv-imagen').value };
    fetch(id ? `${API_BASE_URL}/servicios/${id}` : `${API_BASE_URL}/servicios`, { method: id ? 'PUT' : 'POST', headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(datos) }).then(() => {
        cerrarFormulario('formulario-servicio'); Toast.fire({ icon: 'success', title: 'Guardado' }); cargarServiciosTabla();
    });
}
function borrarServicio(id) { confirmarAccion('¿Borrar servicio?', 'No podrás revertir esto', () => { fetch(`${API_BASE_URL}/servicios/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }).then(() => { Toast.fire({ icon: 'success', title: 'Borrado' }); cargarServiciosTabla(); }); }); }

//  USUARIOS ---
function cargarUsuariosTabla() {
    const tbody = document.getElementById('tabla-usuarios-body'); tbody.innerHTML = `<tr><td colspan="4">${spinnerHtml}</td></tr>`;
    fetch(`${API_BASE_URL}/usuarios`, { headers: { 'Authorization': 'Bearer ' + token } }).then(res => res.json()).then(usuarios => {
        listaGlobalUsuarios = usuarios;
        tbody.innerHTML = '';
        usuarios.forEach(u => {
            const rol = u.roles && u.roles.length > 0 ? u.roles[0].nombre : 'ROLE_CLIENTE';
            tbody.innerHTML += `<tr><td class="fw-bold">${u.nombre} ${u.apellidos || ''}</td><td>${u.email}</td><td><span class="badge bg-secondary">${rol.replace('ROLE_', '')}</span></td><td><button class="btn btn-sm btn-outline-warning me-1" onclick="mostrarFormularioUsuario('editar', ${u.id})"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="borrarUsuario(${u.id})"><i class="bi bi-trash"></i></button></td></tr>`;
        });
    });
}

function mostrarFormularioUsuario(modo, id = null) {
    document.getElementById('formulario-usuario').classList.remove('d-none');

    const emailLogueado = document.getElementById('usuario-email').innerText; // Capturamos el admin actual

    if (modo === 'crear') {
        document.getElementById('usr-id').value = ""; document.getElementById('titulo-form-usuario').innerText = "Nuevo Usuario";
        document.getElementById('usr-nombre').value = ""; document.getElementById('usr-apellidos').value = "";
        document.getElementById('usr-tlf').value = ""; document.getElementById('usr-email').value = "";
        document.getElementById('usr-rol').value = "ROLE_CLIENTE";
        document.getElementById('usr-rol').disabled = false; // Nos aseguramos de que esté habilitado
        document.getElementById('usr-pass').value = ""; document.getElementById('usr-pass').required = true;
    } else {
        const u = listaGlobalUsuarios.find(x => x.id === id);
        const rol = u.roles && u.roles.length > 0 ? u.roles[0].nombre : 'ROLE_CLIENTE';
        document.getElementById('usr-id').value = u.id; document.getElementById('titulo-form-usuario').innerText = "Editar Usuario";
        document.getElementById('usr-nombre').value = u.nombre; document.getElementById('usr-apellidos').value = u.apellidos || "";
        document.getElementById('usr-tlf').value = u.telefono || ""; document.getElementById('usr-email').value = u.email;
        document.getElementById('usr-rol').value = rol;

        // 🛡 Evitamos que el admin se quite el rol a sí mismo
        if (u.email === emailLogueado) {
            document.getElementById('usr-rol').disabled = true;
        } else {
            document.getElementById('usr-rol').disabled = false;
        }

        document.getElementById('usr-pass').value = ""; document.getElementById('usr-pass').required = false;
    }
}

function procesarFormularioUsuario(e) {
    e.preventDefault();
    const id = document.getElementById('usr-id').value;
    const pass = document.getElementById('usr-pass').value;
    const rolSeleccionado = document.getElementById('usr-rol').value;

    const datos = {
        nombre: document.getElementById('usr-nombre').value,
        apellidos: document.getElementById('usr-apellidos').value,
        email: document.getElementById('usr-email').value,
        telefono: document.getElementById('usr-tlf').value
    };
    if (pass) datos.password = pass;

    fetch(id ? `${API_BASE_URL}/usuarios/${id}` : `${API_BASE_URL}/auth/registro`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    })
        .then(async res => {
            if (!res.ok) throw new Error(await res.text());

            if (id) {
                return fetch(`${API_BASE_URL}/usuarios/${id}/rol`, {
                    method: 'PUT',
                    headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nuevoRol: rolSeleccionado })
                }).then(async resRol => {
                    if (!resRol.ok) throw new Error(await resRol.text());
                });
            }
        })
        .then(() => {
            Toast.fire({ icon: 'success', title: 'Usuario guardado' });
            cargarUsuariosTabla();
            cerrarFormulario('formulario-usuario');
        })
        .catch(err => {
            mostrarError(err.message || "Error al procesar");
            cargarUsuariosTabla();
        });
}
function borrarUsuario(id) { confirmarAccion('¿Borrar usuario?', 'Se perderán sus datos', () => { fetch(`${API_BASE_URL}/usuarios/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }).then(() => { Toast.fire({ icon: 'success', title: 'Usuario borrado' }); cargarUsuariosTabla(); }); }); }

// --- 🛠️ MÓDULO: PRODUCTOS ---
function cargarProductosTabla() {
    const tbody = document.getElementById('tabla-productos-body');
    tbody.innerHTML = `<tr><td colspan="5">${spinnerHtml}</td></tr>`;
    fetch(`${API_BASE_URL}/productos`, { headers: { 'Authorization': 'Bearer ' + token } }).then(res => res.json()).then(productos => {
        listaGlobalProductos = productos;
        tbody.innerHTML = '';
        productos.forEach(p => tbody.innerHTML += `<tr><td class="fw-bold">${p.nombre}</td><td>${p.descripcion}</td><td class="text-success fw-bold">${p.precio}€</td><td>${p.stock} uds</td><td><button class="btn btn-sm btn-outline-warning me-1" onclick="mostrarFormularioProducto('editar', ${p.id})"><i class="bi bi-pencil"></i></button><button class="btn btn-sm btn-outline-danger" onclick="borrarProducto(${p.id})"><i class="bi bi-trash"></i></button></td></tr>`);
    });
}

function mostrarFormularioProducto(modo, id = null) {
    document.getElementById('formulario-producto').classList.remove('d-none');
    if (modo === 'crear') {
        document.getElementById('prod-id').value = "";
        document.getElementById('prod-nombre').value = "";
        document.getElementById('prod-desc').value = "";
        document.getElementById('prod-precio').value = "";
        document.getElementById('prod-stock').value = "";
        document.getElementById('prod-imagen').value = ""; // Vaciamos la imagen
    } else {
        const p = listaGlobalProductos.find(x => x.id === id);
        document.getElementById('prod-id').value = p.id;
        document.getElementById('prod-nombre').value = p.nombre;
        document.getElementById('prod-desc').value = p.descripcion;
        document.getElementById('prod-precio').value = p.precio;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-imagen').value = p.imagenUrl || ""; // Cargamos la imagen
    }
}

function procesarFormularioProducto(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;

    //  Añadimos imagenUrl al objeto datos
    const datos = {
        nombre: document.getElementById('prod-nombre').value,
        descripcion: document.getElementById('prod-desc').value,
        precio: parseFloat(document.getElementById('prod-precio').value),
        stock: parseInt(document.getElementById('prod-stock').value),
        imagenUrl: document.getElementById('prod-imagen').value
    };

    fetch(id ? `${API_BASE_URL}/productos/${id}` : `${API_BASE_URL}/productos`, {
        method: id ? 'PUT' : 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
    }).then(async res => {
        if(!res.ok) throw new Error(await res.text());
        Toast.fire({ icon: 'success', title: 'Producto guardado' });
        cerrarFormulario('formulario-producto');
        cargarProductosTabla();
    }).catch(err => mostrarError(err.message));
}

function borrarProducto(id) { confirmarAccion('¿Borrar producto?', 'Se eliminará', () => { fetch(`${API_BASE_URL}/productos/${id}`, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + token } }).then(() => { Toast.fire({ icon: 'success', title: 'Borrado' }); cargarProductosTabla(); }); }); }

function calcularReportes() { fetch(`${API_BASE_URL}/citas`, { headers: { 'Authorization': 'Bearer ' + token } }).then(res => res.json()).then(citas => { const completadas = citas.filter(c => c.estado === 'COMPLETADA'); const ingresos = completadas.reduce((total, c) => total + (c.servicio?.precio || 0), 0); document.getElementById('reporte-ingresos').innerText = ingresos.toFixed(2) + "€"; const totalValidas = citas.filter(c => c.estado !== 'CANCELADA_BARBERIA').length; const porcentaje = totalValidas > 0 ? ((completadas.length / totalValidas) * 100).toFixed(0) : 0; if(chartReporteInstance) chartReporteInstance.destroy(); chartReporteInstance = new ApexCharts(document.querySelector("#grafico-reporte-citas"), { series: [porcentaje], chart: { height: 300, type: 'radialBar' }, theme: { mode: 'dark' }, colors: ['#d4af37'], plotOptions: { radialBar: { hollow: { size: '70%' }, dataLabels: { name: { show: true, color: '#d4af37', label: 'Efectividad' }, value: { color: '#fff', fontSize: '30px', show: true } } } }, labels: ['Citas Logradas'] }); chartReporteInstance.render(); }); }

// ====================================================================
// MOTOR INTELIGENTE DE HORAS PARA EL ADMIN
// ====================================================================
async function buscarHorasLibresAdmin() {
    const barberoId = document.getElementById('sel-barbero').value;
    const servicioId = document.getElementById('sel-servicio').value;

    const fechaInput = document.getElementById('cita-fecha');
    const fecha = fechaInput.value;

    const contHoras = document.getElementById('contenedor-horas-admin');
    const labelHoras = document.getElementById('label-horas-admin');

    document.getElementById('hora-seleccionada-admin').value = "";

    if (!fecha) {
        contHoras.innerHTML = "";
        labelHoras.classList.add('d-none');
        return;
    }

    const fechaObj = new Date(fecha + "T12:00:00");
    const diaSemana = fechaObj.getDay();

    if (diaSemana === 0 || diaSemana === 6) {
        Swal.fire({
            icon: 'warning',
            title: 'Barbería Cerrada',
            text: 'No puedes agendar citas los fines de semana (Sábado y Domingo).',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#d4af37'
        });
        fechaInput.value = '';
        contHoras.innerHTML = "";
        labelHoras.classList.add('d-none');
        return;
    }

    if (!barberoId || !servicioId) return;

    labelHoras.classList.remove('d-none');
    contHoras.innerHTML = `<div class="spinner-border text-gold spinner-sm" role="status"></div><span class="ms-2 text-white small">Calculando huecos...</span>`;
    try {
        const res = await fetch(`${API_BASE_URL}/citas/huecos-libres?barberoId=${barberoId}&servicioId=${servicioId}&fecha=${fecha}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error("Error al calcular horas");

        const horasLibres = await res.json();

        if (horasLibres.length === 0) {
            contHoras.innerHTML = `<span class="text-danger small"><i class="bi bi-x-circle"></i> Agenda completa para este barbero.</span>`;
            return;
        }

        contHoras.innerHTML = horasLibres.map(hora => `
            <button type="button" class="btn btn-outline-gold btn-sm btn-hora-admin px-3 py-1" onclick="seleccionarHoraAdmin(this, '${hora}')">${hora}</button>
        `).join('');

    } catch (e) {
        contHoras.innerHTML = `<span class="text-danger small">Error de conexión con el calculador de turnos.</span>`;
    }
}

function seleccionarHoraAdmin(botonElemento, hora) {
    document.querySelectorAll('.btn-hora-admin').forEach(b => {
        b.classList.remove('btn-gold', 'text-black');
        b.classList.add('btn-outline-gold');
    });
    botonElemento.classList.remove('btn-outline-gold');
    botonElemento.classList.add('btn-gold', 'text-black');
    document.getElementById('hora-seleccionada-admin').value = hora;
}