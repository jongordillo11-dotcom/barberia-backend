package org.example.service;

import org.example.model.entity.Cita;
import org.example.model.entity.EstadoCita;
import org.example.model.entity.Servicio;
import org.example.model.entity.Usuario;
import org.example.repository.CitaRepository;
import org.example.repository.ServicioRepository;
import org.example.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CitaServiceImpl implements CitaService {

    private final CitaRepository citaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ServicioRepository servicioRepository;

    @Autowired
    public CitaServiceImpl(CitaRepository citaRepository, UsuarioRepository usuarioRepository, ServicioRepository servicioRepository) {
        this.citaRepository = citaRepository;
        this.usuarioRepository = usuarioRepository;
        this.servicioRepository = servicioRepository;
    }



    @Override
    @Transactional
    public Cita reservarCita(Long clienteId, Long barberoId, Long servicioId, LocalDateTime fechaHora) {
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Error: No puedes reservar una cita en una fecha u hora pasada.");
        }

        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // 🛡 Máximo 1 cita por turno (Mañana/Tarde) en el mismo día
        java.time.LocalDate fechaCita = fechaHora.toLocalDate();
        boolean esTurnoMananaNuevo = fechaHora.toLocalTime().isBefore(java.time.LocalTime.of(15, 0));

        // Buscamos las citas que ya tiene este cliente para este mismo día
        List<Cita> citasDelClienteHoy = citaRepository.findByCliente(cliente).stream()
                .filter(c -> c.getFechaHora().toLocalDate().equals(fechaCita))
                .filter(c -> !c.getEstado().name().contains("CANCELADA"))
                .toList();

        for (Cita citaExistente : citasDelClienteHoy) {
            boolean esTurnoMananaExistente = citaExistente.getFechaHora().toLocalTime().isBefore(java.time.LocalTime.of(15, 0));

            // Si la cita que intenta reservar es en el mismo turno que la que ya tiene
            if (esTurnoMananaNuevo == esTurnoMananaExistente) {
                throw new RuntimeException("Error: Ya tienes una reserva para este turno (mañana/tarde) en este día. Debes elegir otra fecha u otro turno.");
            }
        }

        Usuario barbero = usuarioRepository.findById(barberoId)
                .orElseThrow(() -> new RuntimeException("Barbero no encontrado"));
        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

        Cita nuevaCita = new Cita();
        nuevaCita.setCliente(cliente);
        nuevaCita.setBarbero(barbero);
        nuevaCita.setServicio(servicio);
        nuevaCita.setFechaHora(fechaHora);

        // Estado inicial
        nuevaCita.setEstado(EstadoCita.CONFIRMADA);

        return citaRepository.save(nuevaCita);
    }

    @Override
    @Transactional
    public Cita cambiarEstadoCita(Long citaId, String nuevoEstadoStr, String emailUsuarioActual) {
        Cita cita = findCitaById(citaId);
        Usuario usuarioActual = usuarioRepository.findByEmail(emailUsuarioActual)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        EstadoCita nuevoEstado = EstadoCita.valueOf(nuevoEstadoStr.toUpperCase());

        boolean esAdmin = usuarioActual.getRoles().stream()
                .anyMatch(rol -> rol.getNombre().equals("ROLE_ADMIN"));
        boolean esClienteDueño = cita.getCliente().getId().equals(usuarioActual.getId());
        boolean esBarberoAsignado = cita.getBarbero().getId().equals(usuarioActual.getId());

        if (esAdmin) {
            cita.setEstado(nuevoEstado);
            return citaRepository.save(cita);
        }

        if (nuevoEstado == EstadoCita.CANCELADA_CLIENTE && !esClienteDueño) {
            throw new AccessDeniedException("No puedes cancelar una cita que no es tuya.");
        }

        if ((nuevoEstado == EstadoCita.CANCELADA_BARBERIA || nuevoEstado == EstadoCita.COMPLETADA || nuevoEstado == EstadoCita.NO_PRESENTADO) && !esBarberoAsignado) {
            throw new AccessDeniedException("No puedes gestionar una cita que no está en tu agenda.");
        }

        cita.setEstado(nuevoEstado);
        return citaRepository.save(cita);
    }



    @Override
    @Transactional
    public void deleteCita(Long id) {
        if (!citaRepository.existsById(id)) {
            throw new RuntimeException("No se puede eliminar: Cita no encontrada con ID " + id);
        }
        citaRepository.deleteById(id);
    }





    @Override
    public List<Cita> findAll() {
        return citaRepository.findAll();
    }

    @Override
    public Cita findCitaById(Long citaId) {
        return citaRepository.findById(citaId)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));
    }

    @Override
    public List<Cita> findCitasByBarberoId(Long barberoId) {
        Usuario barbero = usuarioRepository.findById(barberoId)
                .orElseThrow(() -> new RuntimeException("Barbero no encontrado"));
        return citaRepository.findByBarbero(barbero);
    }

    @Override
    public List<Cita> findCitasByClienteId(Long clienteId) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        return citaRepository.findByCliente(cliente);
    }

    @Override
    @Transactional
    public Cita modificarCita(Long citaId, Long clienteId, Long barberoId, Long servicioId, LocalDateTime fechaHora) {
        // Buscamos la cita a editar
        if (fechaHora.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Error: No puedes reservar una cita en una fecha u hora pasada.");
        }
        Cita cita = citaRepository.findById(citaId)
                .orElseThrow(() -> new RuntimeException("Cita no encontrada"));

        // Buscamos los nuevos datos asociados
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));
        Usuario barbero = usuarioRepository.findById(barberoId)
                .orElseThrow(() -> new RuntimeException("Barbero no encontrado"));
        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

        // Actualizamos los campos
        cita.setCliente(cliente);
        cita.setBarbero(barbero);
        cita.setServicio(servicio);
        cita.setFechaHora(fechaHora);

        // Guardamos los cambios
        return citaRepository.save(cita);
    }

    @Override
    public Cita reservarCitaPorEmail(String email, Long barberoId, Long servicioId, LocalDateTime fechaHora) {
        // Buscamos al usuario por el email que viene del Token
        Usuario cliente = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado con email: " + email));

        // Llamamos a  metodo de reserva normal usando el ID encontrado
        return reservarCita(cliente.getId(), barberoId, servicioId, fechaHora);
    }

    @Override
    public List<Cita> findCitasByClienteEmail(String email) {
        Usuario cliente = usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        return citaRepository.findByClienteId(cliente.getId());
    }

    @Override
    public List<String> obtenerHuecosLibres(Long barberoId, Long servicioId, String fechaStr) {

        // 1. Convertimos la fecha que llega en texto (ej: "2026-10-25") a objeto LocalDate
        java.time.LocalDate fecha = java.time.LocalDate.parse(fechaStr);

        Usuario barbero = usuarioRepository.findById(barberoId)
                .orElseThrow(() -> new RuntimeException("Barbero no encontrado"));
        Servicio servicio = servicioRepository.findById(servicioId)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));

        int duracionMinutos = servicio.getDuracionMinutos();

        // 2. Buscamos todas las citas de ese barbero PARA ESE DÍA EXACTO
        LocalDateTime inicioDia = fecha.atStartOfDay();
        LocalDateTime finDia = fecha.atTime(java.time.LocalTime.MAX);
        List<Cita> citasDelDia = citaRepository.findByBarberoAndFechaHoraBetween(barbero, inicioDia, finDia);

        // Filtramos para ignorar las citas que estén canceladas (esos huecos están libres)
        List<Cita> citasActivas = citasDelDia.stream()
                .filter(c -> !c.getEstado().name().contains("CANCELADA"))
                .toList();

        List<String> huecosLibres = new java.util.ArrayList<>();

        // 3. Calculamos los huecos para la MAÑANA
        calcularHuecosPorTurno(huecosLibres, barbero.getTurnoMananaInicio(), barbero.getTurnoMananaFin(), duracionMinutos, citasActivas, fecha);

        // 4. Calculamos los huecos para la TARDE
        calcularHuecosPorTurno(huecosLibres, barbero.getTurnoTardeInicio(), barbero.getTurnoTardeFin(), duracionMinutos, citasActivas, fecha);

        return huecosLibres;
    }


    private void calcularHuecosPorTurno(List<String> huecos, String horaInicioStr, String horaFinStr,
                                        int duracionServicio, List<Cita> citasActivas, java.time.LocalDate fecha) {

        // Si el barbero no trabaja en este turno (es null), no hacemos nada
        if (horaInicioStr == null || horaFinStr == null || horaInicioStr.isEmpty() || horaFinStr.isEmpty()) {
            return;
        }

        java.time.LocalTime inicioTurno = java.time.LocalTime.parse(horaInicioStr);
        java.time.LocalTime finTurno = java.time.LocalTime.parse(horaFinStr);
        java.time.LocalTime slotActual = inicioTurno;

        // Bucle: Mientras la hora actual + lo que dura el servicio no supere la hora de salida del barbero
        while (!slotActual.plusMinutes(duracionServicio).isAfter(finTurno)) {

            LocalDateTime slotInicioDT = LocalDateTime.of(fecha, slotActual);
            LocalDateTime slotFinDT = slotInicioDT.plusMinutes(duracionServicio);

            boolean solapa = false;

            // Comparamos el hueco con TODAS las citas de ese día
            for (Cita cita : citasActivas) {
                LocalDateTime citaInicio = cita.getFechaHora();
                LocalDateTime citaFin = citaInicio.plusMinutes(cita.getServicio().getDuracionMinutos());

                // FÓRMULA DE SOLAPAMIENTO: (InicioA < FinB) Y (FinA > InicioB)
                if (slotInicioDT.isBefore(citaFin) && slotFinDT.isAfter(citaInicio)) {
                    solapa = true;
                    break; // Choca con una cita, descartamos este hueco y dejamos de buscar
                }
            }

            // Si no choca con ninguna cita, y la hora no ha pasado ya
            if (!solapa) {
                if (slotInicioDT.isAfter(LocalDateTime.now())) {
                    huecos.add(slotActual.toString()); // Lo guardamos en formato "HH:mm"
                }
            }

            // Avanzamos el reloj 30 minutos para calcular el siguiente bloque
            slotActual = slotActual.plusMinutes(30);
        }
    }
}