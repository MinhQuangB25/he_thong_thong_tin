package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PayrollRepository extends JpaRepository<Payroll, Long> {
    Optional<Payroll> findByPeriodIdAndEmployeeId(Long periodId, Long employeeId);
    List<Payroll> findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(Long employeeId);
    List<Payroll> findByPeriodId(Long periodId);
}

