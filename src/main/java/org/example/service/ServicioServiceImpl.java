package org.example.service;

import org.example.model.entity.Servicio;
import org.example.repository.ServicioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ServicioServiceImpl implements ServicioService {

    private final ServicioRepository servicioRepository;

    @Autowired
    public ServicioServiceImpl(ServicioRepository servicioRepository) {
        this.servicioRepository = servicioRepository;
    }

    @Override
    public List<Servicio> findAllServicios() {
        return servicioRepository.findAll();
    }

    @Override
    public Servicio findServicioById(Long id) {
        return servicioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Servicio no encontrado"));
    }

    @Override
    public Servicio saveServicio(Servicio servicio) {

        return servicioRepository.save(servicio);
    }

    @Override
    public void deleteServicio(Long id) {
        servicioRepository.deleteById(id);
    }
}
