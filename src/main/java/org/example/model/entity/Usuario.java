package org.example.model.entity;

import jakarta.persistence.*;
import java.util.Set;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String nombre;

    private String apellidos;
    private String telefono;



    @Column(name = "turno_manana_inicio")
    private String turnoMananaInicio;

    @Column(name = "turno_manana_fin")
    private String turnoMananaFin;

    @Column(name = "turno_tarde_inicio")
    private String turnoTardeInicio;

    @Column(name = "turno_tarde_fin")
    private String turnoTardeFin;


    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "usuario_roles",
            joinColumns = @JoinColumn(name = "usuario_id"),
            inverseJoinColumns = @JoinColumn(name = "rol_id")
    )
    private Set<Rol> roles;


    // ==========================================
    // GETTERS Y SETTERS
    // ==========================================

    public Set<Rol> getRoles() { return roles; }
    public void setRoles(Set<Rol> roles) { this.roles = roles; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getApellidos() { return apellidos; }
    public void setApellidos(String apellidos) { this.apellidos = apellidos; }

    // Getters y Setters de los Turnos
    public String getTurnoMananaInicio() { return turnoMananaInicio; }
    public void setTurnoMananaInicio(String turnoMananaInicio) { this.turnoMananaInicio = turnoMananaInicio; }

    public String getTurnoMananaFin() { return turnoMananaFin; }
    public void setTurnoMananaFin(String turnoMananaFin) { this.turnoMananaFin = turnoMananaFin; }

    public String getTurnoTardeInicio() { return turnoTardeInicio; }
    public void setTurnoTardeInicio(String turnoTardeInicio) { this.turnoTardeInicio = turnoTardeInicio; }

    public String getTurnoTardeFin() { return turnoTardeFin; }
    public void setTurnoTardeFin(String turnoTardeFin) { this.turnoTardeFin = turnoTardeFin; }
}