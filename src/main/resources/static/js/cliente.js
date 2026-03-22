const API_BASE_URL = 'https://barberia-backend-production-9536.up.railway.app/api';
const token = localStorage.getItem('token_barberia');
let servicioElegidoId = null;
let barberoElegidoId = null;
let carrito = [];

const Toast = Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true, background: '#1a1a1a', color: '#fff' });

// Diccionario de "emergencia" por si el Admin no pone foto
const imgServicios = {
    "Corte Signature": "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=600&q=80",
    "Afeitado Imperial": "https://www.barberiacesarvaldivia.es/wp-content/uploads/2025/01/afeitado-clasico-en-barberia-cesar-valdivia.webp",
    "Arreglo de Barba": "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=600&q=80",
    "default": "https://images.unsplash.com/photo-1599351432247-f012fc4ad079?auto=format&fit=crop&w=600&q=80"
};

// --- INICIALIZACIÓN ---
window.onload = () => {
    if (!token || token === "undefined") {
        window.location.href = "login.html";
        return;
    }
    configurarUsuario();
    mostrarSeccion('servicios', document.querySelector('.client-nav-link'));
};

function configurarUsuario() {
    try {
        const payload = JSON.parse(decodeURIComponent(window.atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')));
        document.getElementById('cliente-nombre').innerText = payload.sub;
    } catch (e) {
        document.getElementById('cliente-nombre').innerText = "Cliente";
    }
}

function cerrarSesion() {
    localStorage.removeItem('token_barberia');
    window.location.href = "index.html";
}

// --- NAVEGACIÓN ---
function mostrarSeccion(id, elementoNav = null) {
    document.querySelectorAll('.content-view').forEach(v => v.classList.add('d-none'));
    document.querySelectorAll('.client-nav-link').forEach(l => l.classList.remove('active', 'text-gold'));

    const target = document.getElementById(`seccion-${id}`);
    if (target) target.classList.remove('d-none');

    if (elementoNav) {
        elementoNav.classList.add('active', 'text-gold');
    } else if (event && event.currentTarget && event.currentTarget.classList.contains('nav-link')) {
        event.currentTarget.classList.add('active', 'text-gold');
    }

    const titulos = { 'servicios': 'Nuestros Servicios', 'reserva': 'Confirmar Reserva', 'mis-citas': 'Mi Historial', 'tienda': 'Productos Premium' };
    document.getElementById('titulo-seccion').innerText = titulos[id] || 'Panel';

    if (id === 'servicios') cargarServiciosGaleria();
    if (id === 'mis-citas') cargarMisCitas();
    if (id === 'tienda') cargarTiendaFlip();
}

// --- MÓDULO 1: GALERÍA DE SERVICIOS (CONECTADA A BBDD) ---
function cargarServiciosGaleria() {
    const grid = document.getElementById('galeria-servicios');
    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-gold"></div></div>';

    fetch(`${API_BASE_URL}/servicios`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: Error al cargar los servicios`);
            return r.json();
        })
        .then(servicios => {
            if(servicios.length === 0) {
                grid.innerHTML = '<div class="col-12 text-center text-muted">No hay servicios configurados.</div>';
                return;
            }
            grid.innerHTML = servicios.map(s => {
                const img = s.imagenUrl ? s.imagenUrl : (imgServicios[s.nombre] || imgServicios['default']);

                return `
                <div class="col-md-4 mb-4">
                    <div class="service-box" onclick="irAReserva(${s.id}, '${s.nombre}')">
                        <img src="${img}" alt="${s.nombre}">
                        <div class="service-overlay">
                            <h3 class="font-elegant">${s.nombre}</h3>
                            <p class="text-gold fw-bold fs-4 m-0">${s.precio}€</p>
                            <small class="mb-3 text-light">${s.duracionMinutos} min</small>
                            <span class="badge bg-gold text-dark p-2 px-3 fw-bold">RESERVAR CITA</span>
                        </div>
                    </div>
                </div>
            `;
            }).join('');
        })
        .catch(err => {
            grid.innerHTML = `<div class="col-12 text-center text-danger py-5"><i class="bi bi-exclamation-triangle fs-1 d-block mb-3"></i>${err.message}</div>`;
        });
}

// --- MÓDULO 2: RESERVA INTELIGENTE ---
function irAReserva(id, nombre) {
    servicioElegidoId = id;
    barberoElegidoId = null;
    document.getElementById('reserva-servicio-nombre').innerText = "Reserva: " + nombre;

    // Limpiamos los campos de la reserva anterior
    document.getElementById('fecha-reserva').value = "";
    document.getElementById('hora-seleccionada').value = "";
    document.getElementById('contenedor-horas').innerHTML = "";
    document.getElementById('label-horas').classList.add('d-none');

    // Solo permitimos reservar de hoy en adelante
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const localISODate = (new Date(Date.now() - tzoffset)).toISOString().slice(0, 10);
    document.getElementById('fecha-reserva').min = localISODate;

    mostrarSeccion('reserva');
    cargarBarberosGrid();
}

function cargarBarberosGrid() {
    const div = document.getElementById('contenedor-barberos');
    div.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-gold spinner-border-sm"></div></div>';

    fetch(`${API_BASE_URL}/barberos`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
            div.innerHTML = data.map(b => `
            <div class="col-6">
                <button id="barb-card-${b.id}" onclick="seleccionarBarbero(${b.id}, this)" class="btn btn-outline-secondary btn-barbero w-100 p-3 text-white border-opacity-25 shadow-sm">
                    <i class="bi bi-person-badge fs-3 text-gold d-block mb-2"></i>
                    <span class="fw-bold d-block">${b.nombre}</span>
                </button>
            </div>
        `).join('');
        });
}

function seleccionarBarbero(id, el) {
    barberoElegidoId = id;

    // Reseteamos colores
    document.querySelectorAll('.btn-barbero').forEach(b => {
        b.classList.remove('border-gold', 'bg-dark');
        b.style.boxShadow = "none";
    });

    // Pintamos el elegido
    el.classList.add('border-gold', 'bg-dark');
    el.style.boxShadow = "0 0 15px rgba(212, 175, 55, 0.3)";

    // Si ya ha elegido fecha, buscamos los huecos del nuevo barbero automáticamente
    if (document.getElementById('fecha-reserva').value) {
        buscarHorasLibres();
    }
}

// Llama al Backend para pedir las horas de ese barbero ese día
async function buscarHorasLibres() {
    const fechaInput = document.getElementById('fecha-reserva');
    const fecha = fechaInput.value;
    const contHoras = document.getElementById('contenedor-horas');
    const labelHoras = document.getElementById('label-horas');

    // Reseteamos la hora elegida previamente
    document.getElementById('hora-seleccionada').value = "";

    if (!fecha) return;

    //  BLOQUEO DE FINES DE SEMANA

    const fechaObj = new Date(fecha + "T12:00:00");
    const diaSemana = fechaObj.getDay(); // 0 es Domingo, 6 es Sábado

    if (diaSemana === 0 || diaSemana === 6) {
        Swal.fire({
            icon: 'info',
            title: 'Día de descanso',
            text: 'Los fines de semana estamos cerrados. Por favor, elige un día de lunes a viernes.',
            background: '#1a1a1a',
            color: '#fff',
            confirmButtonColor: '#d4af37'
        });

        // Vaciamos el input para que el cliente no pueda forzar la fecha
        fechaInput.value = '';
        contHoras.innerHTML = '';
        labelHoras.classList.add('d-none');
        return; // Cortamos la ejecución aquí, no llamamos al backend
    }

    if (!barberoElegidoId) {
        Swal.fire('¡Ojo!', 'Por favor, selecciona primero al barbero.', 'info');
        fechaInput.value = ""; // Vaciamos para que se dé cuenta
        return;
    }

    labelHoras.classList.remove('d-none');
    contHoras.innerHTML = `<div class="spinner-border text-gold spinner-sm" role="status"></div><span class="ms-2">Buscando huecos libres...</span>`;

    try {
        const res = await fetch(`${API_BASE_URL}/citas/huecos-libres?barberoId=${barberoElegidoId}&servicioId=${servicioElegidoId}&fecha=${fecha}`, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!res.ok) throw new Error("No se pudieron cargar las horas");

        const horasLibres = await res.json();

        if (horasLibres.length === 0) {
            contHoras.innerHTML = `<span class="text-danger small"><i class="bi bi-x-circle"></i> Vaya, agenda completa. Prueba con otro día u otro barbero.</span>`;
            return;
        }

        // Pintamos los botones dorados de las horas
        contHoras.innerHTML = horasLibres.map(hora => `
            <button type="button" class="btn btn-outline-gold btn-hora px-3 py-2" onclick="seleccionarHora(this, '${hora}')">${hora}</button>
        `).join('');

    } catch (e) {
        contHoras.innerHTML = `<span class="text-danger small"><i class="bi bi-exclamation-triangle"></i> Error buscando horarios.</span>`;
    }
}

function seleccionarHora(botonElemento, hora) {
    document.querySelectorAll('.btn-hora').forEach(b => {
        b.classList.remove('btn-gold', 'text-black');
        b.classList.add('btn-outline-gold');
    });

    botonElemento.classList.remove('btn-outline-gold');
    botonElemento.classList.add('btn-gold', 'text-black');
    document.getElementById('hora-seleccionada').value = hora;
}

function confirmarReserva() {
    const fecha = document.getElementById('fecha-reserva').value;
    const hora = document.getElementById('hora-seleccionada').value;

    if (!servicioElegidoId || !barberoElegidoId || !fecha || !hora) {
        Swal.fire({ icon: 'warning', title: 'Faltan datos', text: 'Asegúrate de haber elegido barbero, día y hora.', background: '#1a1a1a', color: '#fff', confirmButtonColor: '#d4af37' });
        return;
    }


    const fechaHoraFinal = `${fecha}T${hora}:00`;

    const payload = { servicioId: servicioElegidoId, barberoId: barberoElegidoId, fechaHora: fechaHoraFinal };

    Swal.fire({ title: 'Procesando...', background: '#1a1a1a', color: '#fff', didOpen: () => Swal.showLoading() });

    fetch(`${API_BASE_URL}/citas/reservar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(async r => {
            if(!r.ok) throw new Error(await r.text() || 'Error al reservar');
            return r.json();
        })
        .then(() => {
            Swal.fire({ icon: 'success', title: '¡Reserva Confirmada!', text: 'Te hemos guardado el hueco.', confirmButtonColor: '#d4af37', background: '#1a1a1a', color: '#fff' });
            mostrarSeccion('mis-citas', document.querySelectorAll('.client-nav-link')[1]);
        })
        .catch(err => Swal.fire({ icon: 'error', title: 'Error al reservar', text: err.message, background: '#1a1a1a', color: '#fff', confirmButtonColor: '#d4af37' }));
}

// --- MÓDULO 3: MIS CITAS ---
function cargarMisCitas() {
    const tbody = document.getElementById('tabla-mis-citas');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4"><div class="spinner-border text-gold"></div></td></tr>';

    fetch(`${API_BASE_URL}/citas/mis-citas`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}: Error interno del servidor`);
            return r.json();
        })
        .then(citas => {
            tbody.innerHTML = '';
            if (citas.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">Aún no tienes historial de citas.</td></tr>';
                return;
            }

            citas.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora)).forEach(c => {
                const fecha = new Date(c.fechaHora).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
                const puedeCancelar = c.estado === 'PENDIENTE_CONFIRMACION' || c.estado === 'CONFIRMADA';

                tbody.innerHTML += `
                <tr>
                    <td class="text-gold fw-bold">${fecha}</td>
                    <td>${c.servicio?.nombre || 'N/A'}</td>
                    <td>${c.barbero?.nombre || 'N/A'}</td>
                    <td><span class="badge ${getBadgeEstado(c.estado)}">${c.estado}</span></td>
                    <td>
                        ${puedeCancelar ? `<button class="btn btn-sm btn-outline-danger" onclick="cancelarMiCita(${c.id})"><i class="bi bi-x-circle"></i> Cancelar</button>` : '-'}
                    </td>
                </tr>`;
            });
        })
        .catch(err => {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-4"><i class="bi bi-x-circle fs-3 d-block"></i> ${err.message}</td></tr>`;
        });
}

function getBadgeEstado(e) {
    if (e === 'CONFIRMADA') return 'bg-success';
    if (e === 'PENDIENTE_CONFIRMACION') return 'bg-warning text-dark';
    if (e === 'COMPLETADA') return 'bg-info text-dark';
    return 'bg-danger';
}

function cancelarMiCita(id) {
    Swal.fire({
        title: '¿Cancelar reserva?',
        text: 'Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#444',
        confirmButtonText: 'Sí, cancelar',
        background: '#1a1a1a', color: '#fff'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`${API_BASE_URL}/citas/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } })
                .then(() => {
                    Toast.fire({ icon: 'success', title: 'Cita cancelada' });
                    cargarMisCitas();
                });
        }
    });
}

// --- MÓDULO 4: TIENDA FLIP CARDS  ---
function cargarTiendaFlip() {
    const grid = document.getElementById('galeria-tienda');
    grid.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-gold"></div></div>';

    fetch(`${API_BASE_URL}/productos`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => { if(!r.ok) throw new Error("Fallo al cargar productos"); return r.json(); })
        .then(productos => {
            if(productos.length === 0) { grid.innerHTML = '<div class="col-12 text-center text-muted">No hay productos en la tienda.</div>'; return; }

            grid.innerHTML = productos.map(p => {
                const imgProd = p.imagenUrl ? p.imagenUrl : 'https://images.unsplash.com/photo-1599351432247-f012fc4ad079?auto=format&fit=crop&w=400&q=80';
                return `
            <div class="col-md-4 mb-4">
                <div class="flip-card">
                    <div class="flip-card-inner">
                        <div class="flip-card-front p-0 overflow-hidden d-flex flex-column align-items-center">
                            
                            <div style="width: 100%; height: 200px; background-color: #f8f9fa; display: flex; align-items: center; justify-content: center; border-top-left-radius: 15px; border-top-right-radius: 15px; padding: 15px;">
                                <img src="${imgProd}" alt="${p.nombre}" style="max-width: 100%; max-height: 100%; object-fit: contain; mix-blend-mode: multiply;">
                            </div>
                            
                            <h4 class="text-white mt-3 px-2 text-truncate w-100 text-center">${p.nombre}</h4>
                            <span class="badge border border-gold text-gold mt-1 mb-3">VER DETALLES</span>
                        </div>
                        <div class="flip-card-back p-4 text-center">
                            <h3 class="fw-bold mb-2">${p.precio.toFixed(2)}€</h3>
                            <p class="small mb-3 text-dark fw-bold">${p.descripcion}</p>
                            <div class="mt-auto">
                                <div class="input-group mb-3">
                                    <span class="input-group-text bg-dark border-dark text-white">Cant.</span>
                                    <input type="number" id="cant-${p.id}" class="form-control text-center bg-white text-dark fw-bold" value="1" min="1" max="${p.stock}">
                                </div>
                                <button class="btn btn-dark w-100 fw-bold border border-dark" onclick="añadirCesta(${p.id}, \`${p.nombre}\`, ${p.precio})">
                                    <i class="bi bi-cart-plus"></i> AÑADIR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            }).join('');
        })
        .catch(err => { grid.innerHTML = `<div class="col-12 text-center text-danger py-5"><i class="bi bi-exclamation-triangle fs-1 d-block mb-3"></i>${err.message}</div>`; });
}

function añadirCesta(id, nombre, precio) {
    const inputCant = document.getElementById(`cant-${id}`);
    const cant = parseInt(inputCant.value);
    if(isNaN(cant) || cant < 1) return;

    const existe = carrito.find(i => i.id === id);
    if (existe) existe.cantidad += cant;
    else carrito.push({ id, nombre, precio, cantidad: cant });

    inputCant.value = 1;
    actualizarCarritoUI();
    Toast.fire({ icon: 'success', title: 'Producto añadido' });
    document.getElementById('carrito-flotante').classList.remove('d-none');
}

function actualizarCarritoUI() {
    const lista = document.getElementById('lista-carrito');
    const badge = document.getElementById('badge-carrito');
    const totalElem = document.getElementById('total-carrito');

    lista.innerHTML = ''; let total = 0; let itemsCount = 0;

    if (carrito.length === 0) { lista.innerHTML = '<li class="list-group-item text-center text-muted bg-transparent border-0 py-4">Tu cesta está vacía</li>'; }
    else {
        carrito.forEach((item, index) => {
            const subtotal = item.precio * item.cantidad; total += subtotal; itemsCount += item.cantidad;
            lista.innerHTML += `
                <li class="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center px-3 py-2">
                    <div class="small">
                        <div class="fw-bold">${item.nombre}</div><div class="text-gold">x${item.cantidad} - ${subtotal.toFixed(2)}€</div>
                    </div>
                    <button class="btn btn-sm text-danger" onclick="eliminarDelCarrito(${index})"><i class="bi bi-trash"></i></button>
                </li>`;
        });
    }
    totalElem.innerText = total.toFixed(2) + "€";
    badge.innerText = itemsCount;
    badge.classList.toggle('d-none', itemsCount === 0);
}

function eliminarDelCarrito(index) { carrito.splice(index, 1); actualizarCarritoUI(); }
function toggleCarrito() { document.getElementById('carrito-flotante').classList.toggle('d-none'); }
function cerrarCarrito() { document.getElementById('carrito-flotante').classList.add('d-none'); }
function finalizarCompra() {
    if(carrito.length === 0) { Swal.fire({ icon: 'info', title: 'Cesta Vacía', text: 'Añade productos antes de pagar.', background: '#1a1a1a', color: '#fff' }); return; }
    Swal.fire({ title: 'Finalizar Pedido', text: `Total a pagar: ${document.getElementById('total-carrito').innerText}`, icon: 'question', showCancelButton: true, confirmButtonColor: '#d4af37', cancelButtonColor: '#444', confirmButtonText: 'Sí, confirmar compra', background: '#1a1a1a', color: '#fff' })
        .then((result) => {
            if (result.isConfirmed) {
                Swal.fire({ icon: 'success', title: '¡Compra completada!', text: 'Recoge tus productos en la barbería.', confirmButtonColor: '#d4af37', background: '#1a1a1a', color: '#fff' });
                carrito = []; actualizarCarritoUI(); cerrarCarrito();
            }
        });
}
