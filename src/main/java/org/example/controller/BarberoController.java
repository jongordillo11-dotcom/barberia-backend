package org.example.controller;

import org.example.model.entity.Rol;
import org.example.model.entity.Usuario;
import org.example.repository.RolRepository;
import org.example.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/barberos")
public class BarberoController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    //  LISTAR TODOS LOS BARBEROS
    @GetMapping
    public ResponseEntity<List<Usuario>> obtenerBarberos() {
        List<Usuario> barberos = usuarioRepository.findByRoles_Nombre("ROLE_BARBERO");
        return ResponseEntity.ok(barberos);
    }

    //  CREAR UN NUEVO BARBERO
    @PostMapping
    public ResponseEntity<?> crearBarbero(@RequestBody RegistroBarberoRequest request) {

        //  Validación estricta de contraseña
        if (!esPasswordSegura(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un símbolo especial (@#$%^&+=!_-).");
        }

        // 2. Comprobamos si el email ya existe
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Error: El email ya está en uso.");
        }

        if (usuarioRepository.findByTelefono(request.getTelefono()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: Ya existe un usuario con este número de teléfono.");
        }


        Usuario nuevoBarbero = new Usuario();
        nuevoBarbero.setNombre(request.getNombre());
        nuevoBarbero.setApellidos(request.getApellidos());
        nuevoBarbero.setTelefono(request.getTelefono());
        nuevoBarbero.setEmail(request.getEmail());

        // Pasamos los turnos del DTO a la Entidad
        nuevoBarbero.setTurnoMananaInicio(request.getTurnoMananaInicio());
        nuevoBarbero.setTurnoMananaFin(request.getTurnoMananaFin());
        nuevoBarbero.setTurnoTardeInicio(request.getTurnoTardeInicio());
        nuevoBarbero.setTurnoTardeFin(request.getTurnoTardeFin());

        // Encriptamos la contraseña
        nuevoBarbero.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        // Buscamos el rol de barbero en la BBDD
        Rol rolBarbero = rolRepository.findByNombre("ROLE_BARBERO")
                .orElseThrow(() -> new RuntimeException("Error: El rol ROLE_BARBERO no existe en la base de datos."));

        nuevoBarbero.setRoles(Set.of(rolBarbero));
        Usuario guardado = usuarioRepository.save(nuevoBarbero);

        return ResponseEntity.status(HttpStatus.CREATED).body(guardado);
    }

    // BORRAR UN BARBERO
    @DeleteMapping("/{id}")
    public ResponseEntity<?> borrarBarbero(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(barbero -> {

            barbero.getRoles().clear();
            usuarioRepository.save(barbero);


            usuarioRepository.deleteById(id);
            return ResponseEntity.ok("Barbero eliminado con éxito.");
        }).orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body("Barbero no encontrado."));
    }

    // ====================================================================
    // MÉTODOS PRIVADOS DE SEGURIDAD
    // ====================================================================

    // Validador Regex de contraseñas fuertes
    private boolean esPasswordSegura(String password) {
        if (password == null) return false;
        // Mínimo 8 caracteres, 1 número, 1 minúscula, 1 mayúscula, 1 carácter especial
        String regex = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!_\\-]).{8,}$";
        return password.matches(regex);
    }

    // ====================================================================
    // DTO para recibir los datos del Frontend
    // ====================================================================
    public static class RegistroBarberoRequest {
        private String nombre;
        private String apellidos;
        private String telefono;
        private String email;
        private String password;

        private String turnoMananaInicio;
        private String turnoMananaFin;
        private String turnoTardeInicio;
        private String turnoTardeFin;

        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public String getApellidos() { return apellidos; }
        public void setApellidos(String apellidos) { this.apellidos = apellidos; }
        public String getTelefono() { return telefono; }
        public void setTelefono(String telefono) { this.telefono = telefono; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }

        // Getters y Setters de los turnos
        public String getTurnoMananaInicio() { return turnoMananaInicio; }
        public void setTurnoMananaInicio(String turnoMananaInicio) { this.turnoMananaInicio = turnoMananaInicio; }
        public String getTurnoMananaFin() { return turnoMananaFin; }
        public void setTurnoMananaFin(String turnoMananaFin) { this.turnoMananaFin = turnoMananaFin; }
        public String getTurnoTardeInicio() { return turnoTardeInicio; }
        public void setTurnoTardeInicio(String turnoTardeInicio) { this.turnoTardeInicio = turnoTardeInicio; }
        public String getTurnoTardeFin() { return turnoTardeFin; }
        public void setTurnoTardeFin(String turnoTardeFin) { this.turnoTardeFin = turnoTardeFin; }
    }
}