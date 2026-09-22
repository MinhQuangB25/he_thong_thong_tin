package vn.binhannhrm.report;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public final class ReportDtos {
    private ReportDtos() {
    }

    public record EmployeeReport(
            int month,
            int year,
            LocalDate asOf,
            long totalEmployees,
            long active,
            long onLeave,
            long terminated,
            List<EmployeeStatusRow> statuses,
            List<CountStat> education,
            SalarySummary salary,
            List<CountStat> tenure
    ) {
    }

    public record EmployeeStatusRow(
            Long employeeId,
            String employeeCode,
            String fullName,
            String status,
            String educationLevel,
            String departmentName,
            String positionTitle,
            LocalDate joinDate,
            LocalDate endDate,
            Long tenureMonths,
            BigDecimal baseSalary,
            BigDecimal allowance
    ) {
    }

    public record CountStat(String label, long count) {
    }

    public record SalarySummary(
            BigDecimal minBaseSalary,
            BigDecimal maxBaseSalary,
            BigDecimal averageBaseSalary,
            BigDecimal totalAllowances,
            long employeeCount
    ) {
    }
}
