package vn.binhannhrm.domain;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Employee> {
    Optional<Employee> findByEmployeeCode(String employeeCode);
    Optional<Employee> findByEmailIgnoreCase(String email);
    boolean existsByEmailIgnoreCase(String email);
    boolean existsByNationalId(String nationalId);
    Optional<Employee> findByNationalId(String nationalId);
    Page<Employee> findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(String fullName, String employeeCode, Pageable pageable);
    Page<Employee> findByIdIn(Collection<Long> ids, Pageable pageable);

    @Query("""
            select e from Employee e
            where e.id in :ids
              and (lower(e.fullName) like lower(concat('%', :search, '%'))
                   or lower(e.employeeCode) like lower(concat('%', :search, '%')))
            """)
    Page<Employee> searchByIds(@Param("ids") Collection<Long> ids, @Param("search") String search, Pageable pageable);
}
