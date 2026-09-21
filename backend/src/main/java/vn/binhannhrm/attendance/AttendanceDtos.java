package vn.binhannhrm.attendance;

import jakarta.validation.constraints.NotNull;
import vn.binhannhrm.domain.AttendanceRecord;
import vn.binhannhrm.domain.WorkSchedule;

import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

public final class AttendanceDtos {
    private AttendanceDtos() {}
    public record ScheduleRequest(@NotNull Long employeeId, @NotNull Long shiftId, @NotNull LocalDate workDate, String note) {}
    public record ScheduleResponse(Long id, Long employeeId, String employeeName, Long shiftId, String shiftName, LocalDate workDate, String status, String note) {
        static ScheduleResponse from(WorkSchedule s) { return new ScheduleResponse(s.getId(), s.getEmployee().getId(), s.getEmployee().getFullName(), s.getShift().getId(), s.getShift().getName(), s.getWorkDate(), s.getStatus().name(), s.getNote()); }
    }
    public record AttendanceRequest(@NotNull Long employeeId, Long scheduleId, @NotNull LocalDate attendanceDate,
                                    LocalTime checkIn, LocalTime checkOut, @NotNull String status) {}
    public record AttendanceResponse(Long id, Long employeeId, String employeeName, LocalDate attendanceDate,
                                     LocalTime checkIn, LocalTime checkOut, BigDecimal workedHours, BigDecimal overtimeHours, String status) {
        static AttendanceResponse from(AttendanceRecord a) { return new AttendanceResponse(a.getId(), a.getEmployee().getId(), a.getEmployee().getFullName(), a.getAttendanceDate(), a.getCheckIn(), a.getCheckOut(), a.getWorkedHours(), a.getOvertimeHours(), a.getStatus().name()); }
    }
}
