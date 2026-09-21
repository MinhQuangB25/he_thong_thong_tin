package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EmploymentContractRepository extends JpaRepository<EmploymentContract, Long> {
    boolean existsByContractNumber(String contractNumber);
    List<EmploymentContract> findByEmployeeIdOrderByStartDateDesc(Long employeeId);
}
