package org.example.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                // Permitir peticiones a todas nuestras URLs (/api/...)
                registry.addMapping("/**")
                        // Permitir peticiones desde cualquier Frontend (por ahora ponemos "*")
                        .allowedOrigins("*")
                        // Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
                        .allowedMethods("*")
                        // Permitir envío de cabeceras (como nuestro Authorization con el Token)
                        .allowedHeaders("*");
            }
        };
    }
}