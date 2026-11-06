package vn.binhannhrm.attendance;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;

@Service
public class AttendanceService {
    private final EmployeeRepository employees;
    private final WorkShiftRepository shifts;
    private final WorkScheduleRepository schedules;
    private final AttendanceRecordRepository records;
    public AttendanceService(EmployeeRepository employees, WorkShiftRepository shifts, WorkScheduleRepository schedules, AttendanceRecordRepository records) {
        this.employees = employees; this.shifts = shifts; this.schedules = schedules; this.records = records;
    }
    @Transactional
    public AttendanceDtos.ScheduleResponse createSchedule(AttendanceDtos.ScheduleRequest input) {
        if (schedules.existsByEmployeeIdAndWorkDate(input.employeeId(), input.workDate())) throw new ConflictException("Nhân viên đã có lịch làm trong ngày này");
        var employee = employees.findById(input.employeeId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
        var shift = shifts.findById(input.shiftId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy ca làm"));
        var schedule = new WorkSchedule(employee, shift, input.workDate()); schedule.setNote(input.note());
        return AttendanceDtos.ScheduleResponse.from(schedules.save(schedule));
    }
    @Transactional(readOnly = true)
    public List<AttendanceDtos.ScheduleResponse> schedules(Long employeeId, LocalDate from, LocalDate to) {
        return schedules.findByEmployeeIdAndWorkDateBetweenOrderByWorkDate(employeeId, from, to).stream().map(AttendanceDtos.ScheduleResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDtos.ScheduleResponse> schedules(Collection<Long> employeeIds, LocalDate from, LocalDate to) {
        if (employeeIds == null) return schedules.findAll().stream()
                .filter(item -> !item.getWorkDate().isBefore(from) && !item.getWorkDate().isAfter(to))
                .map(AttendanceDtos.ScheduleResponse::from).toList();
        if (employeeIds.isEmpty()) return List.of();
        return schedules.findByEmployeeIdInAndWorkDateBetweenOrderByWorkDate(employeeIds, from, to).stream().map(AttendanceDtos.ScheduleResponse::from).toList();
    }
    @Transactional
    public AttendanceDtos.AttendanceResponse record(AttendanceDtos.AttendanceRequest input) {
        if (records.existsByEmployeeIdAndAttendanceDate(input.employeeId(), input.attendanceDate())) throw new ConflictException("Nhân viên đã có chấm công trong ngày này");
        AttendanceStatus status;
        try { status = AttendanceStatus.valueOf(input.status().toUpperCase()); } catch (IllegalArgumentException ex) { throw new ConflictException("Trạng thái chấm công không hợp lệ"); }
        var employee = employees.findById(input.employeeId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
        WorkSchedule schedule = input.scheduleId() == null ? null : schedules.findById(input.scheduleId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lịch làm"));
        if (schedule != null && !schedule.getEmployee().getId().equals(employee.getId())) throw new ConflictException("Lịch làm không thuộc nhân viên");
        if (schedule != null && !schedule.getWorkDate().equals(input.attendanceDate())) throw new ConflictException("Ngày chấm công phải trùng ngày của lịch làm");
        var record = new AttendanceRecord(employee, input.attendanceDate(), status);
        record.setSchedule(schedule); record.setCheckIn(input.checkIn()); record.setCheckOut(input.checkOut());
        calculateHours(record, schedule);
        return AttendanceDtos.AttendanceResponse.from(records.save(record));
    }
    @Transactional(readOnly = true)
    public List<AttendanceDtos.AttendanceResponse> records(Long employeeId, LocalDate from, LocalDate to) {
        var result = employeeId == null ? records.findByAttendanceDateBetweenOrderByAttendanceDate(from, to) : records.findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDate(employeeId, from, to);
        return result.stream().map(AttendanceDtos.AttendanceResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<AttendanceDtos.AttendanceResponse> records(Collection<Long> employeeIds, LocalDate from, LocalDate to) {
        var result = employeeIds == null ? records.findByAttendanceDateBetweenOrderByAttendanceDate(from, to)
                : employeeIds.isEmpty() ? List.<AttendanceRecord>of()
                : records.findByEmployeeIdInAndAttendanceDateBetweenOrderByAttendanceDate(employeeIds, from, to);
        return result.stream().map(AttendanceDtos.AttendanceResponse::from).toList();
    }
    private void calculateHours(AttendanceRecord record, WorkSchedule schedule) {
        if (record.getStatus() == AttendanceStatus.ABSENT || record.getStatus() == AttendanceStatus.LEAVE) {
            record.setWorkedHours(BigDecimal.ZERO);
            record.setOvertimeHours(BigDecimal.ZERO);
            record.setCheckIn(null);
            record.setCheckOut(null);
            return;
        }
        if ((record.getCheckIn() == null) != (record.getCheckOut() == null)) throw new ConflictException("Cần nhập cả giờ vào và giờ ra");
        if (record.getCheckIn() == null || record.getCheckOut() == null) return;
        long minutes = Duration.between(record.getCheckIn(), record.getCheckOut()).toMinutes();
        if (minutes < 0) throw new ConflictException("Giờ ra phải sau giờ vào");
        BigDecimal hours = BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 2, RoundingMode.HALF_UP);
        record.setWorkedHours(hours.min(BigDecimal.valueOf(8)));
        record.setOvertimeHours(hours.subtract(BigDecimal.valueOf(8)).max(BigDecimal.ZERO));
        if (schedule != null && record.getCheckIn().isAfter(schedule.getShift().getStartTime().plusMinutes(15)) && record.getStatus() == AttendanceStatus.PRESENT) record.setStatus(AttendanceStatus.LATE);
    }
}
