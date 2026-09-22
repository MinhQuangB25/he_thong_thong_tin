package vn.binhannhrm.people;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {
    @Mock EmployeeRepository employees;
    @Mock DepartmentRepository departments;
    @Mock PositionRepository positions;
    @Mock AuditLogService audit;
    private EmployeeService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeService(employees, departments, positions, audit);
    }

    @Test
    void selfProfileUpdateOnlyChangesEmailAndPhone() {
        Employee employee = employee();
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(employees.save(employee)).thenReturn(employee);

        service.updateOwnProfile(7L, new EmployeeDtos.UpdateProfileRequest("0987654321", "new@example.local"));

        assertEquals("Nguyễn Minh Anh", employee.getFullName());
        assertEquals("0987654321", employee.getPhone());
        assertEquals("new@example.local", employee.getEmail());
        assertEquals("Địa chỉ cũ", employee.getAddress());
        assertEquals("Cao học", employee.getEducationLevel());
        verify(audit).record("EMPLOYEE_PROFILE_UPDATED", "employees", 7L, "BA-EMP-007");
    }

    @Test
    void terminateSetsEndDateAndKeepsEmployeeHistory() {
        Employee employee = employee();
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(employees.save(employee)).thenReturn(employee);

        service.terminate(7L);

        assertEquals(EmployeeStatus.TERMINATED, employee.getStatus());
        assertEquals(LocalDate.now(), employee.getEndDate());
        verify(audit).record(eq("EMPLOYEE_TERMINATED"), eq("employees"), eq(7L), eq("BA-EMP-007"));
    }

    private static Employee employee() {
        Department department = new Department("Đào tạo", "");
        Position position = new Position("Giáo viên", BigDecimal.ZERO);
        Employee employee = new Employee("BA-EMP-007", "Nguyễn Minh Anh", Gender.FEMALE, "0900000000", "old@example.local", LocalDate.now().minusYears(2), department, position);
        employee.setId(7L);
        employee.setAddress("Địa chỉ cũ");
        employee.setEducationLevel("Cao học");
        return employee;
    }
}
