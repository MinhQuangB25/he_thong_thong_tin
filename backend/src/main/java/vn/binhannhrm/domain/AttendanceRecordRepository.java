package vn.binhannhrm.domain;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {
    boolean existsByEmployeeIdAndAttendanceDate(Long employeeId, LocalDate attendanceDate);
    List<AttendanceRecord> findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDate(Long employeeId, LocalDate from, LocalDate to);
    List<AttendanceRecord> findByEmployeeIdInAndAttendanceDateBetweenOrderByAttendanceDate(Collection<Long> employeeIds, LocalDate from, LocalDate to);
    List<AttendanceRecord> findByAttendanceDateBetweenOrderByAttendanceDate(LocalDate from, LocalDate to);
}
