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
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
public class ReportController {
    private final EmployeeRepository employees;
    private final LeaveRequestRepository leaveRequests;
    private final PayrollRepository payrolls;
    public ReportController(EmployeeRepository employees, LeaveRequestRepository leaveRequests, PayrollRepository payrolls) { this.employees = employees; this.leaveRequests = leaveRequests; this.payrolls = payrolls; }
    @GetMapping("/hr-summary")
    @Transactional(readOnly = true)
    public Map<String, Object> hrSummary() {
        var all = employees.findAll();
        return Map.of("totalEmployees", all.size(), "active", all.stream().filter(e -> e.getStatus() == EmployeeStatus.ACTIVE).count(), "onLeave", all.stream().filter(e -> e.getStatus() == EmployeeStatus.ON_LEAVE).count(), "terminated", all.stream().filter(e -> e.getStatus() == EmployeeStatus.TERMINATED).count(), "pendingLeaveRequests", leaveRequests.findAll().stream().filter(r -> r.getStatus() == LeaveStatus.PENDING).count());
    }
    @GetMapping("/payroll-summary")
    @Transactional(readOnly = true)
    public Map<String, Object> payrollSummary(@RequestParam int year) {
        var items = payrolls.findAll().stream().filter(p -> p.getPeriod().getYear() == year).toList();
        BigDecimal total = items.stream().map(Payroll::getNetSalary).reduce(BigDecimal.ZERO, BigDecimal::add);
        return Map.of("year", year, "payrollCount", items.size(), "totalNetSalary", total);
    }
}
