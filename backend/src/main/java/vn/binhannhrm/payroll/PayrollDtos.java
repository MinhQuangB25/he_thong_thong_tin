package vn.binhannhrm.payroll;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import vn.binhannhrm.domain.Payroll;
import vn.binhannhrm.domain.PayrollPeriod;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class PayrollDtos {
    private PayrollDtos() {}
    public record PeriodRequest(@Min(1) @Max(12) int month, @Min(2020) int year) {}
    public record PeriodResponse(Long id, int month, int year, LocalDate fromDate, LocalDate toDate, String status) {
        static PeriodResponse from(PayrollPeriod p) { return new PeriodResponse(p.getId(), p.getMonth(), p.getYear(), p.getFromDate(), p.getToDate(), p.getStatus().name()); }
    }
    public record PayrollResponse(Long id, Long periodId, int month, int year, Long employeeId, String employeeName,
                                  BigDecimal baseSalary, BigDecimal workedDays, BigDecimal overtimeHours,
                                  BigDecimal overtimePay, BigDecimal allowances, BigDecimal deductions,
                                  BigDecimal netSalary, String status) {
        static PayrollResponse from(Payroll p) { return new PayrollResponse(p.getId(), p.getPeriod().getId(), p.getPeriod().getMonth(), p.getPeriod().getYear(), p.getEmployee().getId(), p.getEmployee().getFullName(), p.getBaseSalary(), p.getWorkedDays(), p.getOvertimeHours(), p.getOvertimePay(), p.getAllowances(), p.getDeductions(), p.getNetSalary(), p.getStatus().name()); }
    }
}
