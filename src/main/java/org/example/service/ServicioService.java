package org.example.service;

import org.example.model.entity.Servicio;
import java.util.List;

public interface ServicioService {
    List<Servicio> findAllServicios();
    Servicio findServicioById(Long id);
    Servicio saveServicio(Servicio servicio);
    void deleteServicio(Long id);
}