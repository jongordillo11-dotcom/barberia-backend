package org.example;

import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;

import java.awt.Desktop;
import java.net.URI;

@SpringBootApplication
public class ProyectoDamApplication {

    public static void main(String[] args) {

        new SpringApplicationBuilder(ProyectoDamApplication.class)
                .headless(false)
                .run(args);
    }

    @EventListener({ApplicationReadyEvent.class})
    public void abrirNavegadorAlArrancar() {
        try {
            System.out.println("✅ Servidor arrancado.");
            String url = "http://localhost:8081/index.html";
            if (Desktop.isDesktopSupported() && Desktop.getDesktop().isSupported(Desktop.Action.BROWSE)) {
                Desktop.getDesktop().browse(new URI(url));
            }
        } catch (Exception e) {
            System.out.println("No se pudo abrir el navegador automáticamente.");
        }
    }
}