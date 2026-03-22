package org.example.repository;

import org.example.model.entity.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RolRepository extends JpaRepository<Rol, Integer> {


    // Cuando un usuario se registra, necesitamos encontrar el
    // objeto "ROLE_CLIENTE" para asignárselo.
    Optional<Rol> findByNombre(String nombre);
}
