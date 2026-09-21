package vn.binhannhrm.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {
    Optional<Employee> findByEmployeeCode(String employeeCode);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByNationalId(String nationalId);
    Page<Employee> findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(String fullName, String employeeCode, Pageable pageable);
}

