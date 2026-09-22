package vn.binhannhrm.report;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class ReportController {
    private final EmployeeRepository employees;
    private final LeaveRequestRepository leaveRequests;
    private final PayrollRepository payrolls;
    private final ReportService reportService;

    public ReportController(EmployeeRepository employees, LeaveRequestRepository leaveRequests, PayrollRepository payrolls, ReportService reportService) {
        this.employees = employees;
        this.leaveRequests = leaveRequests;
        this.payrolls = payrolls;
        this.reportService = reportService;
    }

    @GetMapping("/employees")
    public ReportDtos.EmployeeReport employees(@RequestParam(required = false) Integer month, @RequestParam(required = false) Integer year) {
        return reportService.employeeReport(month, year);
    }

    @GetMapping("/hr-summary")
    @Transactional(readOnly = true)
    public Map<String, Object> hrSummary(@RequestParam(required = false) Integer month, @RequestParam(required = false) Integer year) {
        var report = reportService.employeeReport(month, year);
        return Map.of("month", report.month(), "year", report.year(), "totalEmployees", report.totalEmployees(), "active", report.active(), "onLeave", report.onLeave(), "terminated", report.terminated(), "pendingLeaveRequests", leaveRequests.findAll().stream().filter(r -> r.getStatus() == LeaveStatus.PENDING).count());
    }
    @GetMapping("/payroll-summary")
    @Transactional(readOnly = true)
    public Map<String, Object> payrollSummary(@RequestParam int year) {
        var items = payrolls.findAll().stream().filter(p -> p.getPeriod().getYear() == year).toList();
        BigDecimal total = items.stream().map(Payroll::getNetSalary).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("year", year, "payrollCount", items.size(), "totalNetSalary", total);
    }
}
