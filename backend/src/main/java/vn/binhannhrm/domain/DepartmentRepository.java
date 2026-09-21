package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
    boolean existsByNameIgnoreCase(String name);
    java.util.Optional<Department> findByNameIgnoreCase(String name);
}
