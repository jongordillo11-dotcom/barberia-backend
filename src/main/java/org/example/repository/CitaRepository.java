package org.example.repository;

import org.example.model.entity.Cita;
import org.example.model.entity.Servicio;
import org.example.model.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface CitaRepository extends JpaRepository<Cita, Long> {


    // "Buscar todas las Citas donde el campo 'cliente' sea el que te paso"
    List<Cita> findByCliente(Usuario cliente);

    // "Buscar todas las Citas donde el campo 'barbero' sea el que te paso"
    List<Cita> findByBarbero(Usuario barbero);

    // "Buscar todas las Citas donde el 'barbero' Y la 'fechaHora' estén entre dos momentos
    List<Cita> findByBarberoAndFechaHoraBetween(Usuario barbero, LocalDateTime inicio, LocalDateTime fin);

    // "Buscar todas las Citas para un 'servicio' específico"
    List<Cita> findByServicio(Servicio servicio);

    List<Cita> findByClienteId(Long id);
}
