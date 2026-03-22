package org.example.controller;




import org.example.model.entity.Producto;
import org.example.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/productos")
@CrossOrigin(origins = "*")
public class ProductoController {

    @Autowired
    private ProductoRepository productoRepository;

    // Obtener todos los productos
    @GetMapping
    public List<Producto> listarProductos() {
        return productoRepository.findAll();
    }

    // Crear un producto nuevo
    @PostMapping
    public Producto guardarProducto(@RequestBody Producto producto) {
        return productoRepository.save(producto);
    }

    // Borrar un producto
    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarProducto(@PathVariable Long id) {
        return productoRepository.findById(id)
                .map(p -> {
                    productoRepository.delete(p);
                    return ResponseEntity.ok().build();
                }).orElse(ResponseEntity.notFound().build());
    }

    // Editar un producto
    @PutMapping("/{id}")
    public ResponseEntity<Producto> actualizarProducto(@PathVariable Long id, @RequestBody Producto detalles) {
        return productoRepository.findById(id)
                .map(p -> {
                    p.setNombre(detalles.getNombre());
                    p.setDescripcion(detalles.getDescripcion());
                    p.setPrecio(detalles.getPrecio());
                    p.setStock(detalles.getStock());
                    return ResponseEntity.ok(productoRepository.save(p));
                }).orElse(ResponseEntity.notFound().build());
    }
}
