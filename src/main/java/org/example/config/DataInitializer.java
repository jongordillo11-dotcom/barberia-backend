package org.example.config;

import org.example.model.entity.Rol;
import org.example.model.entity.Usuario;
import org.example.model.entity.Servicio;
import org.example.model.entity.Producto;
import org.example.repository.RolRepository;
import org.example.repository.UsuarioRepository;
import org.example.repository.ServicioRepository;
import org.example.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    @Transactional
    CommandLineRunner initDatabase(RolRepository rolRepository,
                                   UsuarioRepository usuarioRepository,
                                   ServicioRepository servicioRepository,
                                   ProductoRepository productoRepository,
                                   PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Crear los Roles
            Rol rolCliente = crearRolSiNoExiste(rolRepository, "ROLE_CLIENTE");
            Rol rolBarbero = crearRolSiNoExiste(rolRepository, "ROLE_BARBERO");
            Rol rolAdmin = crearRolSiNoExiste(rolRepository, "ROLE_ADMIN");

            // 2. Crear el Usuario ADMIN
            if (!usuarioRepository.existsByEmail("admin@barberia.com")) {
                Usuario admin = new Usuario();
                admin.setEmail("admin@barberia.com");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setNombre("Administrador");
                admin.setApellidos("Sistema");
                admin.setTelefono("000000000");
                admin.setRoles(Set.of(rolAdmin));
                usuarioRepository.save(admin);
                System.out.println("✅ USUARIO ADMIN CREADO");
            }

            // 3. Crear 10 Barberos con Horarios Diferentes (5 Hombres, 5 Mujeres)
            if (usuarioRepository.findByRoles_Nombre("ROLE_BARBERO").isEmpty()) {

                String passEncriptada = passwordEncoder.encode("Barbero123!");

                // --- CHICOS ---
                // Antonio: Solo Mañana (09:00 - 14:00)
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Antonio", "García", "600100200", "barbero1@barberia.com", "09:00", "14:00", null, null);
                // Carlos: Solo Tarde (16:00 - 21:00)
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Carlos", "López", "600100201", "barbero2@barberia.com", null, null, "16:00", "21:00");
                // David: Turno Partido (09:00 - 14:00 y 16:00 - 21:00)
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "David", "Martínez", "600100202", "barbero3@barberia.com", "09:00", "14:00", "16:00", "21:00");
                // Javier: Solo Mañana (10:00 - 15:00) -> Horario distinto
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Javier", "Ruiz", "600100203", "barbero4@barberia.com", "10:00", "15:00", null, null);
                // Marcos: Turno Partido
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Marcos", "Gómez", "600100204", "barbero5@barberia.com", "09:00", "14:00", "17:00", "21:00");

                // --- CHICAS ---
                // Laura: Solo Mañana
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Laura", "Sánchez", "600300400", "barbera1@barberia.com", "09:00", "14:00", null, null);
                // María: Solo Tarde
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "María", "Pérez", "600300401", "barbera2@barberia.com", null, null, "15:00", "21:00");
                // Carmen: Turno Partido
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Carmen", "Fernández", "600300402", "barbera3@barberia.com", "09:00", "14:00", "16:00", "21:00");
                // Ana: Solo Tarde
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Ana", "Díaz", "600300403", "barbera4@barberia.com", null, null, "16:00", "21:00");
                // Elena: Turno Partido
                crearYGuardarBarbero(usuarioRepository, rolBarbero, passEncriptada, "Elena", "Romero", "600300404", "barbera5@barberia.com", "09:00", "14:00", "16:00", "20:00");

                System.out.println("✅ 10 BARBEROS CON HORARIOS MIXTOS CREADOS");
            }

            // 4. Crear Servicios Visuales
            if (!servicioRepository.existsByNombre("Corte Signature")) {
                servicioRepository.save(crearServicio("Corte Signature", "Corte clásico a tijera y máquina con acabado premium.", 25.0, 45));
                servicioRepository.save(crearServicio("Afeitado Imperial", "Ritual de toalla caliente y afeitado tradicional a navaja.", 20.0, 30));
                servicioRepository.save(crearServicio("Arreglo de Barba", "Perfilado y rebajado de barba con hidratación profunda.", 15.0, 20));
                System.out.println("✅ SERVICIOS INICIALES CREADOS");
            }

            // 5. Crear Productos para la Tienda
            if (productoRepository.count() == 0) {
                productoRepository.save(crearProducto("Cera Mate", "Fijación fuerte y acabado natural.", 18.50, 20, "https://m.media-amazon.com/images/I/71MQjxZv3sL.jpg"));
                productoRepository.save(crearProducto("Aceite Barba", "Hidratación con aroma a cedro.", 22.00, 15, "https://heyjoe.es/wp-content/uploads/06-Citric-Forrets-Bottle-Box-1000x1000.jpg"));
                productoRepository.save(crearProducto("Aftershave", "Calma la piel tras el afeitado.", 16.00, 30, "https://static.beautytocare.com/media/catalog/product/n/i/nivea-men-sensitive-after-shave-fluid-100ml_1.jpg"));
                System.out.println("✅ PRODUCTOS INICIALES CREADOS");
            }
        };
    }

    // --- MÉTODOS AUXILIARES ---

    private Rol crearRolSiNoExiste(RolRepository repository, String nombre) {
        return repository.findByNombre(nombre).orElseGet(() -> {
            Rol nuevoRol = new Rol();
            nuevoRol.setNombre(nombre);
            return repository.save(nuevoRol);
        });
    }

    // Metodo para crear el barbero con su horario inyectado
// Metodo actualizado para recibir las horas exactas de cada barbero
    private void crearYGuardarBarbero(UsuarioRepository repo, Rol rol, String pass,
                                      String nombre, String apellidos, String tlf, String email,
                                      String mInicio, String mFin, String tInicio, String tFin) {
        Usuario b = new Usuario();
        b.setNombre(nombre);
        b.setApellidos(apellidos);
        b.setTelefono(tlf);
        b.setEmail(email);
        b.setPasswordHash(pass);
        b.setRoles(Set.of(rol));

        b.setTurnoMananaInicio(mInicio);
        b.setTurnoMananaFin(mFin);
        b.setTurnoTardeInicio(tInicio);
        b.setTurnoTardeFin(tFin);

        repo.save(b);
    }

    private Servicio crearServicio(String nombre, String desc, double precio, int min) {
        Servicio s = new Servicio();
        s.setNombre(nombre);
        s.setDescripcion(desc);
        s.setPrecio(BigDecimal.valueOf(precio));
        s.setDuracionMinutos(min);
        return s;
    }

    private Producto crearProducto(String nombre, String desc, double precio, int stock, String imagenUrl) {
        Producto p = new Producto();
        p.setNombre(nombre);
        p.setDescripcion(desc);
        p.setPrecio(precio);
        p.setStock(stock);
        p.setImagenUrl(imagenUrl);
        return p;
    }
}