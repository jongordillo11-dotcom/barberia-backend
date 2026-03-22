package org.example.controller;

import org.example.model.entity.Cita;
import org.example.service.CitaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/citas")
@CrossOrigin(origins = "*") // Permite la comunicación con el frontend
public class CitaController {

    private final CitaService citaService;

    @Autowired
    public CitaController(CitaService citaService) {
        this.citaService = citaService;
    }

    // ---  Obtener TODAS las citas  ---
    // URL: GET /api/citas
    @GetMapping
    public ResponseEntity<List<Cita>> getAllCitas() {
        List<Cita> citas = citaService.findAll();
        return ResponseEntity.ok(citas);
    }

    // ---  Obtener una cita por su ID ---
    @GetMapping("/{id}")
    public ResponseEntity<Cita> getCitaById(@PathVariable Long id) {
        Cita cita = citaService.findCitaById(id);
        return ResponseEntity.ok(cita);
    }

    // ---  Obtener citas de un BARBERO ---
    @GetMapping("/barbero/{barberoId}")
    public ResponseEntity<List<Cita>> getCitasByBarbero(@PathVariable Long barberoId) {
        List<Cita> citas = citaService.findCitasByBarberoId(barberoId);
        return ResponseEntity.ok(citas);
    }

    // --- Obtener citas de un CLIENTE ---
    @GetMapping("/cliente/{clienteId}")
    public ResponseEntity<List<Cita>> getCitasByCliente(@PathVariable Long clienteId) {
        List<Cita> citas = citaService.findCitasByClienteId(clienteId);
        return ResponseEntity.ok(citas);
    }

    // --- RESERVAR  ---
    @PostMapping("/reservar")
    public ResponseEntity<Cita> reservarCita(@RequestBody ReservaRequest request, Authentication authentication) {

        // Si el request trae clienteId, significa que viene del panel del ADMIN
        if (request.getClienteId() != null) {
            Cita nuevaCita = citaService.reservarCita(
                    request.getClienteId(),
                    request.getBarberoId(),
                    request.getServicioId(),
                    request.getFechaHora()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaCita);
        } else {
            // Si NO trae clienteId, viene del panel de CLIENTE (usamos su Token)
            String emailCliente = authentication.getName();
            Cita nuevaCita = citaService.reservarCitaPorEmail(
                    emailCliente,
                    request.getBarberoId(),
                    request.getServicioId(),
                    request.getFechaHora()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(nuevaCita);
        }
    }

    // --- Obtener mis citas  ---
// URL: GET /api/citas/mis-citas
    @GetMapping("/mis-citas")
    public ResponseEntity<List<Cita>> getMisCitas(Authentication authentication) {
        String email = authentication.getName();
        List<Cita> citas = citaService.findCitasByClienteEmail(email);
        return ResponseEntity.ok(citas);
    }

    // ---  CAMBIAR ESTADO  ---
    // URL: PUT /api/citas/1/estado?nuevoEstado=COMPLETADA
    @PutMapping("/{citaId}/estado")
    public ResponseEntity<Cita> cambiarEstado(
            @PathVariable Long citaId,
            @RequestParam String nuevoEstado,
            Authentication authentication) {

        // Obtenemos el email del usuario logueado desde el Token JWT
        String emailUsuarioActual = authentication.getName();

        // El servicio valida si el usuario tiene permiso para cambiar este estado
        Cita citaActualizada = citaService.cambiarEstadoCita(citaId, nuevoEstado, emailUsuarioActual);
        return ResponseEntity.ok(citaActualizada);
    }

    // ---  ELIMINAR UNA CITA ---
    // URL: DELETE /api/citas/1
    @DeleteMapping("/{id}")
    public ResponseEntity<?> borrarCita(@PathVariable Long id) {
        try {
            citaService.deleteCita(id);
            return ResponseEntity.ok("Cita eliminada con éxito");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al eliminar la cita: " + e.getMessage());
        }
    }
    // ---  MODIFICAR CITA COMPLETA ---
// URL: PUT /api/citas/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Cita> modificarCita(@PathVariable Long id, @RequestBody ReservaRequest request) {
        Cita citaModificada = citaService.modificarCita(
                id,
                request.getClienteId(),
                request.getBarberoId(),
                request.getServicioId(),
                request.getFechaHora()
        );
        return ResponseEntity.ok(citaModificada);
    }
    // Endpoint para buscar las horas libres
    @GetMapping("/huecos-libres")
    public ResponseEntity<List<String>> obtenerHuecos(
            @RequestParam Long barberoId,
            @RequestParam Long servicioId,
            @RequestParam String fecha) {

        try {
            List<String> huecos = citaService.obtenerHuecosLibres(barberoId, servicioId, fecha);
            return ResponseEntity.ok(huecos);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }


    static class ReservaRequest {
        private Long clienteId;
        private Long barberoId;
        private Long servicioId;
        private LocalDateTime fechaHora;

        public Long getClienteId() { return clienteId; }
        public void setClienteId(Long clienteId) { this.clienteId = clienteId; }
        public Long getBarberoId() { return barberoId; }
        public void setBarberoId(Long barberoId) { this.barberoId = barberoId; }
        public Long getServicioId() { return servicioId; }
        public void setServicioId(Long servicioId) { this.servicioId = servicioId; }
        public LocalDateTime getFechaHora() { return fechaHora; }
        public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    }
}