package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface WorkScheduleRepository extends JpaRepository<WorkSchedule, Long> {
    List<WorkSchedule> findByEmployeeIdAndWorkDateBetweenOrderByWorkDate(Long employeeId, LocalDate from, LocalDate to);
    List<WorkSchedule> findByEmployeeIdInAndWorkDateBetweenOrderByWorkDate(Collection<Long> employeeIds, LocalDate from, LocalDate to);
    boolean existsByEmployeeIdAndWorkDate(Long employeeId, LocalDate workDate);
}
