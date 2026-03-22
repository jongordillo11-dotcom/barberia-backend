package org.example.controller;

import org.example.model.entity.Rol;
import org.example.model.entity.Usuario;
import org.example.repository.RolRepository;
import org.example.repository.UsuarioRepository;
import org.example.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserDetailsService userDetailsService;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private RolRepository rolRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        UserDetails userDetails = userDetailsService.loadUserByUsername(request.getEmail());
        String jwtToken = jwtService.generateToken(userDetails);
        return ResponseEntity.ok(new AuthResponse(jwtToken));
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrarCliente(@RequestBody RegisterRequest request) {

        // 1. Comprobamos si el email ya existe
        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: Ya existe una cuenta con este correo electrónico.");
        }

        if (usuarioRepository.findByTelefono(request.getTelefono()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: Este número de teléfono ya está registrado en otra cuenta.");
        }

        // Validación de contraseña segura
        if (!esPasswordSegura(request.getPassword())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Error: La contraseña debe tener al menos 8 caracteres, incluir una mayúscula, una minúscula, un número y un símbolo especial (@#$%^&+=!_-).");
        }

        // Sitodo es correcto creamos el usuario
        Usuario nuevoUsuario = new Usuario();
        nuevoUsuario.setNombre(request.getNombre());
        nuevoUsuario.setApellidos(request.getApellidos());
        nuevoUsuario.setTelefono(request.getTelefono());
        nuevoUsuario.setEmail(request.getEmail());

        // Encriptamos la contraseña validada
        nuevoUsuario.setPasswordHash(passwordEncoder.encode(request.getPassword()));

        Rol rolCliente = rolRepository.findByNombre("ROLE_CLIENTE")
                .orElseThrow(() -> new RuntimeException("Error: El rol ROLE_CLIENTE no existe en la base de datos."));

        nuevoUsuario.setRoles(Set.of(rolCliente));

        usuarioRepository.save(nuevoUsuario);

        return ResponseEntity.ok("¡Registro completado! Ya puedes iniciar sesión.");
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
    // DTOs
    // ====================================================================

    public static class AuthRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String nombre;
        private String apellidos;
        private String telefono;
        private String email;
        private String password;

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
    }

    public static class AuthResponse {
        private String token;

        public AuthResponse(String token) { this.token = token; }
        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }
    }
}