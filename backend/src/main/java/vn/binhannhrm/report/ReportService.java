package vn.binhannhrm.report;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.EmployeeRepository;
import vn.binhannhrm.domain.EmployeeStatus;
import vn.binhannhrm.domain.EmploymentContract;
import vn.binhannhrm.domain.EmploymentContractRepository;
import vn.binhannhrm.domain.LeaveRequest;
import vn.binhannhrm.domain.LeaveRequestRepository;
import vn.binhannhrm.domain.LeaveStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReportService {
    private final EmployeeRepository employees;
    private final LeaveRequestRepository leaveRequests;
    private final EmploymentContractRepository contracts;

    public ReportService(EmployeeRepository employees, LeaveRequestRepository leaveRequests, EmploymentContractRepository contracts) {
        this.employees = employees;
        this.leaveRequests = leaveRequests;
        this.contracts = contracts;
    }

    @Transactional(readOnly = true)
    public ReportDtos.EmployeeReport employeeReport(Integer month, Integer year) {
        YearMonth selected = selectedMonth(month, year);
        LocalDate asOf = selected.atEndOfMonth();
        List<Employee> allEmployees = employees.findAll();
        List<LeaveRequest> approvedLeaves = leaveRequests.findAll().stream()
                .filter(request -> request.getStatus() == LeaveStatus.APPROVED)
                .filter(request -> !request.getFromDate().isAfter(asOf) && !request.getToDate().isBefore(asOf))
                .toList();

        Map<Long, Boolean> employeesOnLeave = approvedLeaves.stream()
                .collect(Collectors.toMap(request -> request.getEmployee().getId(), request -> true, (first, ignored) -> true));
        List<ReportDtos.EmployeeStatusRow> rows = new ArrayList<>();
        for (Employee employee : allEmployees) {
            String status = statusAt(employee, asOf, employeesOnLeave.containsKey(employee.getId()));
            EmploymentContract contract = currentContract(employee.getId(), asOf);
            long tenureMonths = Math.max(0, ChronoUnit.MONTHS.between(employee.getJoinDate(), asOf));
            rows.add(new ReportDtos.EmployeeStatusRow(
                    employee.getId(), employee.getEmployeeCode(), employee.getFullName(), status,
                    blankAsUnknown(employee.getEducationLevel()), employee.getDepartment().getName(),
                    employee.getPosition().getTitle(), employee.getJoinDate(), employee.getEndDate(), tenureMonths,
                    contract == null ? BigDecimal.ZERO.setScale(2) : money(contract.getBaseSalary()),
                    contract == null ? BigDecimal.ZERO.setScale(2) : money(contract.getAllowance())
            ));
        }

        Map<String, Long> statusCounts = rows.stream().collect(Collectors.groupingBy(
                ReportDtos.EmployeeStatusRow::status, LinkedHashMap::new, Collectors.counting()));
        List<ReportDtos.CountStat> education = rows.stream()
                .filter(row -> !row.status().equals(EmployeeStatus.TERMINATED.name()))
                .collect(Collectors.groupingBy(ReportDtos.EmployeeStatusRow::educationLevel, LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream().map(entry -> new ReportDtos.CountStat(entry.getKey(), entry.getValue())).toList();
        List<ReportDtos.CountStat> tenure = rows.stream()
                .filter(row -> !row.status().equals(EmployeeStatus.TERMINATED.name()))
                .collect(Collectors.groupingBy(row -> tenureBucket(row.tenureMonths()), LinkedHashMap::new, Collectors.counting()))
                .entrySet().stream().map(entry -> new ReportDtos.CountStat(entry.getKey(), entry.getValue())).toList();

        List<ReportDtos.EmployeeStatusRow> currentRows = rows.stream()
                .filter(row -> !row.status().equals(EmployeeStatus.TERMINATED.name()))
                .toList();
        List<BigDecimal> salaries = currentRows.stream().map(ReportDtos.EmployeeStatusRow::baseSalary).toList();
        BigDecimal totalAllowances = currentRows.stream().map(ReportDtos.EmployeeStatusRow::allowance).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal minSalary = salaries.stream().min(Comparator.naturalOrder()).orElse(BigDecimal.ZERO.setScale(2));
        BigDecimal maxSalary = salaries.stream().max(Comparator.naturalOrder()).orElse(BigDecimal.ZERO.setScale(2));
        BigDecimal averageSalary = salaries.isEmpty() ? BigDecimal.ZERO.setScale(2) : salaries.stream().reduce(BigDecimal.ZERO, BigDecimal::add).divide(BigDecimal.valueOf(salaries.size()), 2, RoundingMode.HALF_UP);

        return new ReportDtos.EmployeeReport(
                selected.getMonthValue(), selected.getYear(), asOf, allEmployees.size(),
                statusCounts.getOrDefault(EmployeeStatus.ACTIVE.name(), 0L),
                statusCounts.getOrDefault(EmployeeStatus.ON_LEAVE.name(), 0L),
                statusCounts.getOrDefault(EmployeeStatus.TERMINATED.name(), 0L),
                rows, education,
                new ReportDtos.SalarySummary(minSalary, maxSalary, averageSalary, money(totalAllowances), currentRows.size()),
                tenure
        );
    }

    private YearMonth selectedMonth(Integer month, Integer year) {
        YearMonth now = YearMonth.now();
        int selectedMonth = month == null ? now.getMonthValue() : month;
        int selectedYear = year == null ? now.getYear() : year;
        try {
            return YearMonth.of(selectedYear, selectedMonth);
        } catch (RuntimeException exception) {
            throw new ConflictException("Tháng hoặc năm báo cáo không hợp lệ");
        }
    }

    private String statusAt(Employee employee, LocalDate asOf, boolean approvedLeaveAtEndOfMonth) {
        boolean terminatedAtEndOfMonth = employee.getEndDate() != null
                ? !employee.getEndDate().isAfter(asOf)
                : employee.getStatus() == EmployeeStatus.TERMINATED;
        if (terminatedAtEndOfMonth) {
            return EmployeeStatus.TERMINATED.name();
        }
        if (approvedLeaveAtEndOfMonth || employee.getStatus() == EmployeeStatus.ON_LEAVE) {
            return EmployeeStatus.ON_LEAVE.name();
        }
        return EmployeeStatus.ACTIVE.name();
    }

    private EmploymentContract currentContract(Long employeeId, LocalDate asOf) {
        return contracts.findByEmployeeIdOrderByStartDateDesc(employeeId).stream()
                .filter(contract -> !contract.getStartDate().isAfter(asOf))
                .filter(contract -> contract.getEndDate() == null || !contract.getEndDate().isBefore(asOf))
                .findFirst().orElse(null);
    }

    private String blankAsUnknown(String education) {
        return education == null || education.isBlank() ? "Chưa cập nhật" : education;
    }

    private String tenureBucket(long months) {
        if (months < 12) return "Dưới 1 năm";
        if (months < 36) return "Từ 1 đến dưới 3 năm";
        if (months < 60) return "Từ 3 đến dưới 5 năm";
        return "Từ 5 năm trở lên";
    }

    private BigDecimal money(BigDecimal value) {
        return (value == null ? BigDecimal.ZERO : value).setScale(2, RoundingMode.HALF_UP);
    }
}
