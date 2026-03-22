package org.example.controller;

import org.example.model.entity.Servicio;
import org.example.service.ServicioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/servicios")
public class ServicioController {

    private final ServicioService servicioService;

    @Autowired
    public ServicioController(ServicioService servicioService) {
        this.servicioService = servicioService;
    }

    // --- LISTAR TODOS los servicios ---
    // URL: GET /api/servicios
    @GetMapping
    public ResponseEntity<List<Servicio>> getAllServicios() {
        List<Servicio> servicios = servicioService.findAllServicios();
        return ResponseEntity.ok(servicios);
    }

    // --- OBTENER un servicio por ID ---
    // URL: GET /api/servicios/1
    @GetMapping("/{id}")
    public ResponseEntity<Servicio> getServicioById(@PathVariable Long id) {
        Servicio servicio = servicioService.findServicioById(id);
        return ResponseEntity.ok(servicio);
    }

    // ---  CREAR un nuevo servicio (Admin) ---
    // URL: POST /api/servicios
    @PostMapping
    public ResponseEntity<Servicio> createServicio(@RequestBody Servicio servicio) {
        Servicio nuevoServicio = servicioService.saveServicio(servicio);
        return ResponseEntity.status(HttpStatus.CREATED).body(nuevoServicio);
    }

    // ---  ACTUALIZAR un servicio (Admin) ---
    // URL: PUT /api/servicios/1
    @PutMapping("/{id}")
    public ResponseEntity<Servicio> updateServicio(@PathVariable Long id, @RequestBody Servicio servicio) {
        // Aseguramos que el ID de la URL coincide con el del objeto
        servicio.setId(id);
        Servicio servicioActualizado = servicioService.saveServicio(servicio);
        return ResponseEntity.ok(servicioActualizado);
    }

    // ---  BORRAR un servicio (Admin) ---
    // URL: DELETE /api/servicios/1
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteServicio(@PathVariable Long id) {
        servicioService.deleteServicio(id);
        return ResponseEntity.noContent().build();
    }
}
