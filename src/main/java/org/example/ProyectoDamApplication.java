package org.example;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.awt.*;
import java.net.URI;

@SpringBootApplication
public class ProyectoDamApplication {

    public static void main(String[] args) {

        new SpringApplicationBuilder(ProyectoDamApplication.class)
                .headless(false)
                .run(args);
    }

    @EventListener(ApplicationReadyEvent.class)
    public void abrirNavegadorAlArrancar() {
        try {
            // Comprobamos si el entorno tiene pantalla/interfaz gráfica (Tu portátil SÍ, Railway NO)
            if (!GraphicsEnvironment.isHeadless() && Desktop.isDesktopSupported()) {
                Desktop desktop = Desktop.getDesktop();
                if (desktop.isSupported(Desktop.Action.BROWSE)) {
                    System.out.println("Pantalla detectada. Abriendo el navegador en el puerto 8081...");
                    desktop.browse(new URI("http://localhost:8081"));
                }
            } else {
                // Si entra aquí, es que estamos en Railway. No hace nada y no crashea.
                System.out.println("Servidor en la nube detectado (sin pantalla). Todo OK, esperando conexiones.");
            }
        } catch (Exception e) {
            System.out.println("Error al intentar abrir el navegador: " + e.getMessage());
        }
    }
}
