package org.example.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component // Lo marcamos como un Componente de Spring
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Autowired
    public JwtAuthenticationFilter(JwtService jwtService, UserDetailsService userDetailsService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        // 1. Obtener la cabecera "Authorization" (donde viene el token)
        final String authHeader = request.getHeader("Authorization");

        // 2. Si no hay cabecera o no empieza por "Bearer ", pasar al siguiente filtro
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 3. Extraer el token (quitando el "Bearer ")
        final String jwt = authHeader.substring(7);

        // 4. Extraer el email del token
        final String userEmail;
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            // Token inválido (expirado, mal formado, etc.)
            filterChain.doFilter(request, response);
            return;
        }

        // 5. Si tenemos email y el usuario AÚN NO está autenticado en el contexto
        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            // 6. Cargar los detalles del usuario desde la BBDD
            UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

            // 7. Si el token es válido para este usuario...
            if (jwtService.validateToken(jwt, userDetails)) {

                // 8. Creamos la autenticación
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null, // No pasamos credenciales (password)
                        userDetails.getAuthorities()
                );

                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                // 9. ¡AUTENTICAMOS AL USUARIO!
                // Guardamos la autenticación en el Contexto de Seguridad
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        // 10. Pasamos al siguiente filtro de la cadena
        filterChain.doFilter(request, response);
    }
}
