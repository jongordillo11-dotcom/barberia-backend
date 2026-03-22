package org.example.service;

import org.example.model.entity.Cita;
import java.util.List;
import java.time.LocalDateTime;

public interface CitaService {
    // Métodos existentes...
    Cita reservarCita(Long clienteId, Long barberoId, Long servicioId, LocalDateTime fechaHora);

    // NUEVOS MÉTODOS PARA EL CLIENTE
    Cita reservarCitaPorEmail(String email, Long barberoId, Long servicioId, LocalDateTime fechaHora);
    List<Cita> findCitasByClienteEmail(String email);

    // Resto de métodos...
    Cita cambiarEstadoCita(Long citaId, String nuevoEstado, String emailUsuarioActual);
    List<Cita> findAll();
    Cita findCitaById(Long citaId);
    List<Cita> findCitasByBarberoId(Long barberoId);
    List<Cita> findCitasByClienteId(Long clienteId);
    Cita modificarCita(Long citaId, Long clienteId, Long barberoId, Long servicioId, LocalDateTime fechaHora);
    void deleteCita(Long id);

    List<String> obtenerHuecosLibres(Long barberoId, Long servicioId, String fecha);


}