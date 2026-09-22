package vn.binhannhrm.report;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock EmployeeRepository employees;
    @Mock LeaveRequestRepository leaveRequests;
    @Mock EmploymentContractRepository contracts;
    private ReportService service;

    @BeforeEach
    void setUp() {
        service = new ReportService(employees, leaveRequests, contracts);
    }

    @Test
    void classifiesEmployeesAtMonthEndAndSummarizesCurrentContracts() {
        LocalDate asOf = LocalDate.of(2026, 9, 30);
        Employee active = employee(1L, "ACTIVE-01", "Đang làm", EmployeeStatus.ACTIVE, LocalDate.of(2025, 1, 10), null, "Đại học");
        Employee onLeave = employee(2L, "LEAVE-01", "Đang nghỉ", EmployeeStatus.ACTIVE, LocalDate.of(2024, 1, 10), null, "Cao học");
        Employee terminated = employee(3L, "ENDED-01", "Đã nghỉ", EmployeeStatus.TERMINATED, LocalDate.of(2023, 1, 10), LocalDate.of(2026, 9, 12), "Đại học");
        when(employees.findAll()).thenReturn(List.of(active, onLeave, terminated));
        when(leaveRequests.findAll()).thenReturn(List.of(approvedLeave(onLeave, LocalDate.of(2026, 9, 20), LocalDate.of(2026, 10, 3))));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(1L)).thenReturn(List.of(contract(active, "18000000", "1000000")));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(2L)).thenReturn(List.of(contract(onLeave, "22000000", "1500000")));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(3L)).thenReturn(List.of(contract(terminated, "14000000", "500000")));

        ReportDtos.EmployeeReport report = service.employeeReport(9, 2026);

        assertEquals(asOf, report.asOf());
        assertEquals(1, report.active());
        assertEquals(1, report.onLeave());
        assertEquals(1, report.terminated());
        assertEquals(new BigDecimal("18000000.00"), report.salary().minBaseSalary());
        assertEquals(new BigDecimal("22000000.00"), report.salary().maxBaseSalary());
        assertEquals(2, report.salary().employeeCount());
    }

    @Test
    void usesTheSelectedMonthBeforeAPlannedTermination() {
        Employee futureTerminated = employee(4L, "FUTURE-01", "Sắp nghỉ", EmployeeStatus.TERMINATED,
                LocalDate.of(2024, 1, 10), LocalDate.of(2026, 10, 5), "Đại học");
        when(employees.findAll()).thenReturn(List.of(futureTerminated));
        when(leaveRequests.findAll()).thenReturn(List.of());
        when(contracts.findByEmployeeIdOrderByStartDateDesc(4L)).thenReturn(List.of(contract(futureTerminated, "12000000", "500000")));

        ReportDtos.EmployeeReport report = service.employeeReport(9, 2026);

        assertEquals(1, report.active());
        assertEquals(0, report.terminated());
        assertEquals(1, report.salary().employeeCount());
    }

    private static Employee employee(Long id, String code, String name, EmployeeStatus status, LocalDate joinDate, LocalDate endDate, String education) {
        Department department = new Department("Đào tạo", "");
        Position position = new Position("Giáo viên", BigDecimal.ZERO);
        Employee employee = new Employee(code, name, Gender.OTHER, "0900000000", code.toLowerCase() + "@example.local", joinDate, department, position);
        employee.setId(id);
        employee.setStatus(status);
        employee.setEndDate(endDate);
        employee.setEducationLevel(education);
        return employee;
    }

    private static EmploymentContract contract(Employee employee, String baseSalary, String allowance) {
        return new EmploymentContract(employee, "HD-" + employee.getEmployeeCode(), "Không xác định thời hạn", employee.getJoinDate(), new BigDecimal(baseSalary), new BigDecimal(allowance));
    }

    private static LeaveRequest approvedLeave(Employee employee, LocalDate from, LocalDate to) {
        LeaveType type = new LeaveType(LeaveTypeCode.ANNUAL, "Nghỉ phép năm", 12);
        LeaveRequest request = new LeaveRequest(employee, type, from, to, "Nghỉ phép");
        request.setStatus(LeaveStatus.APPROVED);
        return request;
    }
}
