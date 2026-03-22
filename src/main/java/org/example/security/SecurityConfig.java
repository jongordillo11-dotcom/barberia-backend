package org.example.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Autowired
    public SecurityConfig(JwtAuthenticationFilter jwtAuthFilter, UserDetailsService userDetailsService) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.userDetailsService = userDetailsService;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .authorizeHttpRequests(auth -> auth
                        // 1. Peticiones de JavaScript
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()


                        .requestMatchers("/", "/index.html", "/*.html", "/css/**", "/js/**", "/img/**", "/assets/**").permitAll()

                        // 3. Rutas PÚBLICAS de la API
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/servicios/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/productos/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/barberos/**").permitAll()

                        // 4. GESTIÓN DE CITAS (Ordenado por prioridad)

                        // Cambiar solo el estado (Permitido a Barberos y Admin)
                        .requestMatchers(HttpMethod.PUT, "/api/citas/*/estado").hasAnyRole("BARBERO", "ADMIN")

                        // Ver historial específico de un barbero
                        .requestMatchers("/api/citas/barbero/**").hasAnyRole("BARBERO", "ADMIN")

                        // Ver TODAS las citas y Modificar citas (Permitido a Barberos para su gestión)
                        .requestMatchers(HttpMethod.GET, "/api/citas").hasAnyRole("BARBERO", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/citas/{id}").hasAnyRole("BARBERO", "ADMIN")

                        // Operaciones de Cliente (Ver mis citas, reservar y cancelar la suya propia)
                        .requestMatchers("/api/citas/cliente/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/citas/mis-citas").authenticated()
                        .requestMatchers(HttpMethod.POST, "/api/citas/reservar").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/citas/{id}").authenticated()

                        //  Permite a los clientes logueados ver las horas libres
                        .requestMatchers(HttpMethod.GET, "/api/citas/huecos-libres").authenticated()

                        // 5. CATÁLOGOS (Solo ADMIN puede crear/borrar servicios, productos y barberos)
                        .requestMatchers("/api/servicios/**").hasRole("ADMIN")
                        .requestMatchers("/api/productos/**").hasRole("ADMIN")
                        .requestMatchers("/api/barberos/**").hasRole("ADMIN")
                        .requestMatchers("/api/usuarios/**").hasRole("ADMIN")

                        // 6. CUALQUIER OTRA RUTA (Bloqueada por defecto)
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}