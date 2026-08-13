package com.example.paintingservice.repository;

import com.example.paintingservice.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
	Optional<User> findByUsername(String username);

	Optional<User> findById(Long id);

	List<User> findAllByRole_Name(String roleName);
	boolean existsByUsername(String username);
}
