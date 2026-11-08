package vn.binhannhrm.attendance;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AttendanceServiceTest {
    @Mock EmployeeRepository employees;
    @Mock WorkShiftRepository shifts;
    @Mock WorkScheduleRepository schedules;
    @Mock AttendanceRecordRepository records;
    private AttendanceService service;
    private final LocalDate day = LocalDate.of(2026, 9, 14);
    private Employee employee;
    private WorkShift shift;

    @BeforeEach
    void setUp() {
        service = new AttendanceService(employees, shifts, schedules, records);
        employee = employee(7L);
        shift = new WorkShift("Ca hành chính", LocalTime.of(8, 0), LocalTime.of(17, 0), new BigDecimal("1.5"));
        shift.setId(1L);
    }

    private void savesRecord() {
        when(records.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    private WorkSchedule schedule(Employee owner, LocalDate date) {
        WorkSchedule schedule = new WorkSchedule(owner, shift, date);
        schedule.setId(3L);
        return schedule;
    }

    @Test
    void presentDayCapsWorkedHoursAtEightAndCountsOvertime() {
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(schedules.findById(3L)).thenReturn(Optional.of(schedule(employee, day)));
        savesRecord();

        var result = service.record(new AttendanceDtos.AttendanceRequest(7L, 3L, day, LocalTime.of(8, 0), LocalTime.of(18, 30), "present"));

        assertEquals(new BigDecimal("8"), result.workedHours());
        assertEquals(new BigDecimal("2.50"), result.overtimeHours());
        assertEquals("PRESENT", result.status());
    }

    @Test
    void checkInMoreThanFifteenMinutesAfterShiftStartIsLateButBoundaryIsNot() {
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(schedules.findById(3L)).thenReturn(Optional.of(schedule(employee, day)));
        savesRecord();

        var late = service.record(new AttendanceDtos.AttendanceRequest(7L, 3L, day, LocalTime.of(8, 16), LocalTime.of(17, 0), "PRESENT"));
        assertEquals("LATE", late.status());
        assertEquals(new BigDecimal("8"), late.workedHours());
        assertEquals(new BigDecimal("0.73"), late.overtimeHours());

        var onTime = service.record(new AttendanceDtos.AttendanceRequest(7L, 3L, day, LocalTime.of(8, 15), LocalTime.of(17, 0), "PRESENT"));
        assertEquals("PRESENT", onTime.status());
        assertEquals(new BigDecimal("0.75"), onTime.overtimeHours());
    }

    @Test
    void absentAndLeaveDaysClearTimesAndHours() {
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        savesRecord();

        for (String status : List.of("ABSENT", "LEAVE")) {
            var result = service.record(new AttendanceDtos.AttendanceRequest(7L, null, day, LocalTime.of(8, 0), LocalTime.of(20, 0), status));
            assertNull(result.checkIn());
            assertNull(result.checkOut());
            assertEquals(BigDecimal.ZERO, result.workedHours());
            assertEquals(BigDecimal.ZERO, result.overtimeHours());
            assertEquals(status, result.status());
        }
    }

    @Test
    void workingDayNeedsBothTimesAndCheckOutAfterCheckIn() {
        when(employees.findById(7L)).thenReturn(Optional.of(employee));

        var onlyIn = assertThrows(ConflictException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, null, day, LocalTime.of(8, 0), null, "PRESENT")));
        assertEquals("Cần nhập cả giờ vào và giờ ra", onlyIn.getMessage());
        var reversed = assertThrows(ConflictException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, null, day, LocalTime.of(17, 0), LocalTime.of(8, 0), "PRESENT")));
        assertEquals("Giờ ra phải sau giờ vào", reversed.getMessage());
        verify(records, never()).save(any());
    }

    @Test
    void presentWithoutAnyTimesIsAcceptedWithoutHours() {
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        savesRecord();

        var result = service.record(new AttendanceDtos.AttendanceRequest(7L, null, day, null, null, "PRESENT"));

        assertEquals("PRESENT", result.status());
        assertNull(result.checkIn());
    }

    @Test
    void onlyOneAttendanceRecordPerEmployeeAndDay() {
        when(records.existsByEmployeeIdAndAttendanceDate(7L, day)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, null, day, LocalTime.of(8, 0), LocalTime.of(17, 0), "PRESENT")));
        verify(records, never()).save(any());
    }

    @Test
    void unknownStatusAndUnknownEmployeeAreRejected() {
        var invalid = assertThrows(ConflictException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, null, day, null, null, "HOLIDAY")));
        assertEquals("Trạng thái chấm công không hợp lệ", invalid.getMessage());

        when(employees.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(99L, null, day, null, null, "PRESENT")));
        verify(records, never()).save(any());
    }

    @Test
    void scheduleMustBelongToTheEmployeeAndMatchTheDate() {
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(schedules.findById(3L)).thenReturn(Optional.of(schedule(employee(8L), day)));
        var otherOwner = assertThrows(ConflictException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, 3L, day, LocalTime.of(8, 0), LocalTime.of(17, 0), "PRESENT")));
        assertEquals("Lịch làm không thuộc nhân viên", otherOwner.getMessage());

        when(schedules.findById(4L)).thenReturn(Optional.of(schedule(employee, day.plusDays(1))));
        var otherDay = assertThrows(ConflictException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, 4L, day, LocalTime.of(8, 0), LocalTime.of(17, 0), "PRESENT")));
        assertEquals("Ngày chấm công phải trùng ngày của lịch làm", otherDay.getMessage());

        when(schedules.findById(5L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.record(
                new AttendanceDtos.AttendanceRequest(7L, 5L, day, null, null, "PRESENT")));
        verify(records, never()).save(any());
    }

    @Test
    void createScheduleRejectsSecondScheduleOnSameDayAndUnknownShift() {
        when(schedules.existsByEmployeeIdAndWorkDate(7L, day)).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.createSchedule(new AttendanceDtos.ScheduleRequest(7L, 1L, day, null)));

        LocalDate next = day.plusDays(1);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(shifts.findById(2L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.createSchedule(new AttendanceDtos.ScheduleRequest(7L, 2L, next, null)));
        verify(schedules, never()).save(any());
    }

    @Test
    void createScheduleKeepsShiftAndNote() {
        LocalDate next = day.plusDays(1);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(shifts.findById(1L)).thenReturn(Optional.of(shift));
        when(schedules.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.createSchedule(new AttendanceDtos.ScheduleRequest(7L, 1L, next, "Dạy bù"));

        assertEquals(7L, result.employeeId());
        assertEquals("Ca hành chính", result.shiftName());
        assertEquals(next, result.workDate());
        assertEquals("Dạy bù", result.note());
    }

    @Test
    void scopedQueriesRespectNullAllEmptyNoneAndListedEmployees() {
        LocalDate from = day.withDayOfMonth(1);
        LocalDate to = day.withDayOfMonth(30);
        WorkSchedule inside = schedule(employee, day);
        WorkSchedule outside = schedule(employee, to.plusDays(1));
        when(schedules.findAll()).thenReturn(List.of(inside, outside));
        assertEquals(1, service.schedules((java.util.Collection<Long>) null, from, to).size());

        assertTrue(service.schedules(List.<Long>of(), from, to).isEmpty());
        assertTrue(service.records(List.<Long>of(), from, to).isEmpty());
        verify(schedules, never()).findByEmployeeIdInAndWorkDateBetweenOrderByWorkDate(anyCollection(), any(), any());
        verify(records, never()).findByEmployeeIdInAndAttendanceDateBetweenOrderByAttendanceDate(anyCollection(), any(), any());

        AttendanceRecord record = new AttendanceRecord(employee, day, AttendanceStatus.PRESENT);
        when(records.findByEmployeeIdInAndAttendanceDateBetweenOrderByAttendanceDate(List.of(7L), from, to)).thenReturn(List.of(record));
        assertEquals(1, service.records(List.of(7L), from, to).size());
        when(records.findByAttendanceDateBetweenOrderByAttendanceDate(from, to)).thenReturn(List.of(record));
        assertEquals(1, service.records((java.util.Collection<Long>) null, from, to).size());
        when(records.findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDate(7L, from, to)).thenReturn(List.of(record));
        assertEquals(1, service.records(7L, from, to).size());
        assertEquals(1, service.records((Long) null, from, to).size());
        when(schedules.findByEmployeeIdAndWorkDateBetweenOrderByWorkDate(7L, from, to)).thenReturn(List.of(inside));
        assertEquals(1, service.schedules(7L, from, to).size());
    }

    private static Employee employee(Long id) {
        Employee employee = new Employee("E-" + id, "Nhân viên " + id, Gender.FEMALE, "0900000000", id + "@example.local",
                LocalDate.of(2025, 1, 1), new Department("Đào tạo", ""), new Position("Giáo viên", BigDecimal.ZERO));
        employee.setId(id);
        return employee;
    }
}
