package org.example.repository;

import org.example.model.entity.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {



    // Usamos Optional porque puede que el email no exista.
    Optional<Usuario> findByEmail(String email);


    // "Buscar todos los Usuarios que tengan un Rol con un nombre específico"

    List<Usuario> findByRoles_Nombre(String nombreRol);

    Optional<Usuario> findByTelefono(String telefono);
    Boolean existsByEmail(String email);

}
