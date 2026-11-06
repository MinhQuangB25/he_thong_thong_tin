package vn.binhannhrm.payroll;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollPeriodLifecycleTest {
    @Mock PayrollPeriodRepository periods;
    @Mock PayrollRepository payrolls;
    @Mock EmployeeRepository employees;
    @Mock EmploymentContractRepository contracts;
    @Mock AttendanceRecordRepository attendance;
    @Mock SalarySettingsRepository settings;
    @Mock AuditLogService audit;
    private PayrollService service;

    @BeforeEach
    void setUp() {
        service = new PayrollService(periods, payrolls, employees, contracts, attendance, settings, new PayrollCalculator(), audit);
    }

    private static PayrollPeriod period(Long id, int month, int year) {
        LocalDate from = LocalDate.of(year, month, 1);
        PayrollPeriod period = new PayrollPeriod(month, year, from, from.withDayOfMonth(from.lengthOfMonth()));
        period.setId(id);
        return period;
    }

    @Test
    void createPeriodCoversTheWholeMonthAndRejectsDuplicates() {
        when(periods.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        var leap = service.createPeriod(new PayrollDtos.PeriodRequest(2, 2028));
        assertEquals(LocalDate.of(2028, 2, 1), leap.fromDate());
        assertEquals(LocalDate.of(2028, 2, 29), leap.toDate());
        assertEquals("DRAFT", leap.status());

        when(periods.findByMonthAndYear(9, 2026)).thenReturn(Optional.of(period(1L, 9, 2026)));
        assertThrows(ConflictException.class, () -> service.createPeriod(new PayrollDtos.PeriodRequest(9, 2026)));
    }

    @Test
    void lockedPeriodCannotBeRegeneratedAndMissingSettingsStopGeneration() {
        PayrollPeriod locked = period(1L, 9, 2026);
        locked.setStatus(PayrollStatus.LOCKED);
        when(periods.findById(1L)).thenReturn(Optional.of(locked));
        var conflict = assertThrows(ConflictException.class, () -> service.generate(1L));
        assertEquals("Kỳ lương đã khóa hoặc đã thanh toán", conflict.getMessage());

        when(periods.findById(2L)).thenReturn(Optional.of(period(2L, 10, 2026)));
        when(settings.findTopByOrderByEffectiveFromDesc()).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.generate(2L));
        when(periods.findById(3L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.generate(3L));
        verify(payrolls, never()).save(any());
    }

    @Test
    void generationSkipsTerminatedStaffAndStaffWithoutContractInForce() {
        PayrollPeriod period = period(4L, 9, 2026);
        Employee terminated = employee(1L);
        terminated.setStatus(EmployeeStatus.TERMINATED);
        Employee noContract = employee(2L);
        Employee endedContract = employee(3L);
        EmploymentContract ended = new EmploymentContract(endedContract, "OLD", "Loại", LocalDate.of(2024, 1, 1), new BigDecimal("9000000"), BigDecimal.ZERO);
        ended.setEndDate(LocalDate.of(2026, 8, 31));
        when(periods.findById(4L)).thenReturn(Optional.of(period));
        when(settings.findTopByOrderByEffectiveFromDesc()).thenReturn(Optional.of(new SalarySettings(26, new BigDecimal("1.5"), LocalDate.of(2025, 1, 1))));
        when(employees.findAll()).thenReturn(List.of(terminated, noContract, endedContract));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(2L)).thenReturn(List.of());
        when(contracts.findByEmployeeIdOrderByStartDateDesc(3L)).thenReturn(List.of(ended));

        assertTrue(service.generate(4L).isEmpty());
        verify(payrolls, never()).save(any());
        verify(contracts, never()).findByEmployeeIdOrderByStartDateDesc(1L);
    }

    @Test
    void lockRequiresGeneratedPayrollsAndLocksEveryItemWithAudit() {
        PayrollPeriod empty = period(5L, 9, 2026);
        when(periods.findById(5L)).thenReturn(Optional.of(empty));
        when(payrolls.findByPeriodId(5L)).thenReturn(List.of());
        var conflict = assertThrows(ConflictException.class, () -> service.lock(5L));
        assertEquals("Chưa có bảng lương để khóa", conflict.getMessage());
        assertEquals(PayrollStatus.DRAFT, empty.getStatus());

        PayrollPeriod ready = period(6L, 10, 2026);
        Payroll first = new Payroll(ready, employee(1L));
        Payroll second = new Payroll(ready, employee(2L));
        when(periods.findById(6L)).thenReturn(Optional.of(ready));
        when(payrolls.findByPeriodId(6L)).thenReturn(List.of(first, second));

        var result = service.lock(6L);

        assertEquals("LOCKED", result.status());
        assertEquals(PayrollStatus.LOCKED, first.getStatus());
        assertEquals(PayrollStatus.LOCKED, second.getStatus());
        verify(audit).record("PAYROLL_LOCKED", "payroll_periods", 6L, "10/2026");
    }

    @Test
    void periodsAreFilteredAndNewestFirst() {
        when(periods.findAll()).thenReturn(List.of(period(1L, 8, 2026), period(2L, 9, 2026), period(3L, 9, 2025), period(4L, 1, 2027)));

        assertEquals(List.of(4L, 2L, 1L, 3L), service.periods(null, null).stream().map(PayrollDtos.PeriodResponse::id).toList());
        assertEquals(List.of(2L, 3L), service.periods(9, null).stream().map(PayrollDtos.PeriodResponse::id).toList());
        assertEquals(List.of(2L), service.periods(9, 2026).stream().map(PayrollDtos.PeriodResponse::id).toList());
    }

    @Test
    void invalidMonthIsRejectedAndHrSeesEveryonesPayroll() {
        assertThrows(ConflictException.class, () -> service.list(1L, false, 13, 2026));
        assertThrows(ConflictException.class, () -> service.list(1L, false, 0, 2026));
        verifyNoInteractions(payrolls);

        Payroll own = new Payroll(period(1L, 9, 2026), employee(1L));
        Payroll other = new Payroll(period(1L, 9, 2026), employee(2L));
        own.setNetSalary(BigDecimal.TEN); other.setNetSalary(BigDecimal.ONE);
        when(payrolls.findAll()).thenReturn(List.of(own, other));
        assertEquals(2, service.list(null, true, 9, 2026).size());
        assertEquals(2, service.list(null, true).size());
    }

    @Test
    void calculationRuleNeedsSalarySettings() {
        when(settings.findTopByOrderByEffectiveFromDesc()).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.calculationRule());

        when(settings.findTopByOrderByEffectiveFromDesc()).thenReturn(Optional.of(new SalarySettings(26, new BigDecimal("1.5"), LocalDate.of(2025, 1, 1))));
        var rule = service.calculationRule();
        assertEquals(26, rule.standardWorkDays());
        assertEquals(new BigDecimal("1.5"), rule.overtimeMultiplier());
    }

    private static Employee employee(Long id) {
        Employee employee = new Employee("E-" + id, "Nhân viên " + id, Gender.OTHER, "0900000000", id + "@example.local",
                LocalDate.of(2025, 1, 1), new Department("Đào tạo", ""), new Position("Giáo viên", BigDecimal.ZERO));
        employee.setId(id);
        return employee;
    }
}
