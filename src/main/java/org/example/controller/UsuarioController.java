package org.example.controller;

import org.example.model.entity.Rol;
import org.example.model.entity.Usuario;
import org.example.repository.RolRepository;
import org.example.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder; // ¡NUEVO IMPORT!
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/usuarios")
@CrossOrigin(origins = "*")
public class UsuarioController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    //
    @Autowired
    private PasswordEncoder passwordEncoder;

    // LISTAR TODOS LOS USUARIOS
    @GetMapping
    public List<Usuario> obtenerTodos() {
        return usuarioRepository.findAll();
    }

    // ---  EDITAR USUARIO  ---
    @PutMapping("/{id}")
    public ResponseEntity<?> actualizarUsuario(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return usuarioRepository.findById(id).map(usuario -> {
                // Actualizamos los datos básicos si vienen en el JSON
                if (body.containsKey("nombre")) usuario.setNombre(body.get("nombre"));
                if (body.containsKey("apellidos")) usuario.setApellidos(body.get("apellidos"));
                if (body.containsKey("email")) usuario.setEmail(body.get("email"));
                if (body.containsKey("telefono")) usuario.setTelefono(body.get("telefono"));

                //  Recogemos los turnos

                if (body.containsKey("turnoMananaInicio")) usuario.setTurnoMananaInicio(body.get("turnoMananaInicio"));
                if (body.containsKey("turnoMananaFin")) usuario.setTurnoMananaFin(body.get("turnoMananaFin"));
                if (body.containsKey("turnoTardeInicio")) usuario.setTurnoTardeInicio(body.get("turnoTardeInicio"));
                if (body.containsKey("turnoTardeFin")) usuario.setTurnoTardeFin(body.get("turnoTardeFin"));


                String nuevaPass = body.get("password");
                if (nuevaPass != null && !nuevaPass.trim().isEmpty()) {
                    usuario.setPasswordHash(passwordEncoder.encode(nuevaPass));
                }

                usuarioRepository.save(usuario);
                return ResponseEntity.ok(usuario);
            }).orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error al actualizar usuario: " + e.getMessage());
        }
    }

    //  CAMBIAR ROL
    @PutMapping("/{id}/rol")
    public ResponseEntity<?> cambiarRol(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String nombreRolLimpio = body.get("nuevoRol");

            if (nombreRolLimpio == null) {
                return ResponseEntity.badRequest().body("Falta el campo 'nuevoRol'");
            }


            if ("ROLE_ADMIN".equals(nombreRolLimpio)) {
                boolean existeOtroAdmin = usuarioRepository.findAll().stream()
                        // Buscamos a cualquier otro usuario (que no sea el que estamos editando)
                        .filter(u -> !u.getId().equals(id))
                        // Miramos si alguno de sus roles es ADMIN
                        .anyMatch(u -> u.getRoles().stream()
                                .anyMatch(r -> r.getNombre().equals("ROLE_ADMIN")));

                if (existeOtroAdmin) {
                    return ResponseEntity.badRequest()
                            .body("Error de Seguridad: Ya existe un Administrador en el sistema. No se permiten múltiples administradores.");
                }
            }

            return usuarioRepository.findById(id).map(usuario -> {
                Rol rol = rolRepository.findByNombre(nombreRolLimpio)
                        .orElseThrow(() -> new RuntimeException("Rol no encontrado: " + nombreRolLimpio));

                // Usamos un HashSet
                Set<Rol> nuevosRoles = new java.util.HashSet<>();
                nuevosRoles.add(rol);

                usuario.setRoles(nuevosRoles);
                usuarioRepository.save(usuario);

                return ResponseEntity.ok("Rol actualizado correctamente");
            }).orElse(ResponseEntity.notFound().build());

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error en el servidor: " + e.getMessage());
        }
    }

    // 3. BORRAR USUARIO
    @DeleteMapping("/{id}")
    public ResponseEntity<?> borrarUsuario(@PathVariable Long id) {
        return usuarioRepository.findById(id).map(u -> {
            u.getRoles().clear();
            usuarioRepository.save(u);
            usuarioRepository.deleteById(id);
            return ResponseEntity.ok("Usuario eliminado con éxito");
        }).orElse(ResponseEntity.notFound().build());
    }
}