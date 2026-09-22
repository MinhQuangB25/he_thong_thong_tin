package vn.binhannhrm.payroll;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PayrollServiceTest {
    @Mock PayrollPeriodRepository periods;
    @Mock PayrollRepository payrolls;
    @Mock EmployeeRepository employees;
    @Mock EmploymentContractRepository contracts;
    @Mock AttendanceRecordRepository attendance;
    @Mock SalarySettingsRepository settings;
    @Mock PayrollCalculator calculator;
    @Mock AuditLogService audit;
    private PayrollService service;

    @BeforeEach
    void setUp() {
        service = new PayrollService(periods, payrolls, employees, contracts, attendance, settings, calculator, audit);
    }

    @Test
    void filtersPayrollsBySelectedMonthAndYear() {
        Employee first = employee(1L, "Nhân sự 1");
        Payroll selected = payroll(1L, first, 9, 2026, "10000000");
        Payroll otherMonth = payroll(2L, first, 8, 2026, "9000000");
        when(payrolls.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(1L)).thenReturn(List.of(selected, otherMonth));

        List<PayrollDtos.PayrollResponse> result = service.list(1L, false, 9, 2026);

        assertEquals(1, result.size());
        assertEquals(9, result.get(0).month());
        assertEquals(new BigDecimal("10000000"), result.get(0).netSalary());
    }

    @Test
    void aggregatesOwnPayrollsForYear() {
        Employee employee = employee(1L, "Nhân sự 1");
        when(payrolls.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(1L)).thenReturn(List.of(
                payroll(1L, employee, 8, 2026, "10000000"),
                payroll(2L, employee, 9, 2026, "12000000"),
                payroll(3L, employee, 9, 2025, "9000000")
        ));

        PayrollDtos.AnnualSummary summary = service.annualSummary(1L, false, 2026);

        assertEquals(2, summary.periodCount());
        assertEquals(new BigDecimal("22000000.00"), summary.totalNetSalary());
    }

    private static Employee employee(Long id, String name) {
        Employee employee = new Employee("E-" + id, name, Gender.OTHER, "0900000000", id + "@example.local", LocalDate.now().minusYears(1), new Department("Đào tạo", ""), new Position("Giáo viên", BigDecimal.ZERO));
        employee.setId(id);
        return employee;
    }

    private static Payroll payroll(Long id, Employee employee, int month, int year, String netSalary) {
        PayrollPeriod period = new PayrollPeriod(month, year, LocalDate.of(year, month, 1), LocalDate.of(year, month, 1).plusMonths(1).minusDays(1));
        period.setId(id);
        Payroll payroll = new Payroll(period, employee);
        payroll.setId(id);
        payroll.setBaseSalary(new BigDecimal("10000000"));
        payroll.setWorkedDays(new BigDecimal("26"));
        payroll.setNetSalary(new BigDecimal(netSalary));
        payroll.setAllowances(new BigDecimal("500000"));
        payroll.setOvertimePay(new BigDecimal("250000"));
        payroll.setDeductions(BigDecimal.ZERO);
        return payroll;
    }
}
