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
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {
    @Mock EmployeeRepository employees;
    @Mock DepartmentRepository departments;
    @Mock PositionRepository positions;
    @Mock EmploymentContractRepository contracts;
    @Mock AuditLogService audit;
    private EmployeeService service;

    @BeforeEach
    void setUp() {
        service = new EmployeeService(employees, departments, positions, contracts, audit);
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
    void conditionalProfileUpdateRejectsChangesSinceAssistantProposal() {
        Employee employee = employee();
        employee.setPhone("0999999999");
        when(employees.findById(7L)).thenReturn(Optional.of(employee));

        assertThrows(vn.binhannhrm.common.ConflictException.class, () -> service.updateOwnProfile(7L,
                new EmployeeDtos.UpdateProfileRequest("0987654321", "new@example.local", "old@example.local", "0900000000")));
        assertEquals("old@example.local", employee.getEmail());
        assertEquals("0999999999", employee.getPhone());
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

    @Test
    void terminateClosesOpenAndUpcomingContractsButKeepsEndedOnes() {
        Employee employee = employee();
        LocalDate today = LocalDate.now();
        EmploymentContract upcoming = new EmploymentContract(employee, "HD-NEXT", "Loại", today.plusMonths(1), new BigDecimal("15000000"), BigDecimal.ZERO);
        upcoming.setId(3L);
        EmploymentContract current = new EmploymentContract(employee, "HD-NOW", "Loại", today.minusYears(1), new BigDecimal("14000000"), BigDecimal.ZERO);
        current.setId(2L);
        current.setEndDate(today.plusMonths(1).minusDays(1));
        EmploymentContract ended = new EmploymentContract(employee, "HD-OLD", "Loại", today.minusYears(2), new BigDecimal("12000000"), BigDecimal.ZERO);
        ended.setId(1L);
        ended.setEndDate(today.minusYears(1).minusDays(1));
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(employees.save(employee)).thenReturn(employee);
        when(contracts.findByEmployeeIdOrderByStartDateDesc(7L)).thenReturn(java.util.List.of(upcoming, current, ended));

        service.terminate(7L);

        assertEquals(ContractStatus.TERMINATED, current.getStatus());
        assertEquals(today, current.getEndDate());
        assertEquals(ContractStatus.TERMINATED, upcoming.getStatus());
        assertEquals(today, upcoming.getEndDate());
        assertEquals(ContractStatus.ACTIVE, ended.getStatus());
        assertEquals(today.minusYears(1).minusDays(1), ended.getEndDate());
        verify(contracts, never()).save(ended);
        verify(audit).record(eq("CONTRACT_TERMINATED"), eq("employment_contracts"), eq(2L), org.mockito.ArgumentMatchers.contains("chấm dứt từ"));
        verify(audit).record(eq("CONTRACT_TERMINATED"), eq("employment_contracts"), eq(3L), org.mockito.ArgumentMatchers.contains("hủy (chưa hiệu lực)"));
    }

    @Test
    void terminatingAgainKeepsOriginalEndDate() {
        Employee employee = employee();
        employee.setStatus(EmployeeStatus.TERMINATED);
        employee.setEndDate(LocalDate.now().minusMonths(2));
        when(employees.findById(7L)).thenReturn(Optional.of(employee));

        assertThrows(vn.binhannhrm.common.ConflictException.class, () -> service.terminate(7L));
        assertEquals(LocalDate.now().minusMonths(2), employee.getEndDate());
        verifyNoInteractions(contracts, audit);
    }

    @Test
    void hrUpdateChangesProfileAndAuditsOrganisationMove() {
        Employee employee = employee();
        Department operations = new Department("Vận hành", "");
        operations.setId(2L);
        Position leader = new Position("Trưởng nhóm", BigDecimal.ZERO);
        leader.setId(3L);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(employees.findByEmailIgnoreCase("anh.new@example.local")).thenReturn(Optional.empty());
        when(employees.findByNationalId("079123456789")).thenReturn(Optional.empty());
        when(departments.findById(2L)).thenReturn(Optional.of(operations));
        when(positions.findById(3L)).thenReturn(Optional.of(leader));
        when(employees.save(employee)).thenReturn(employee);

        var response = service.update(7L, new EmployeeDtos.UpdateEmployeeRequest(
                " Nguyễn Minh Anh ", Gender.FEMALE, "079123456789", "0900000000", "anh.new@example.local",
                "Địa chỉ cũ", "Cao học", employee.getJoinDate(), 2L, 3L));

        assertEquals("Vận hành", response.departmentName());
        assertEquals("Trưởng nhóm", response.positionTitle());
        assertEquals("BA-EMP-007", employee.getEmployeeCode());
        assertEquals(EmployeeStatus.ACTIVE, employee.getStatus());
        assertEquals("079123456789", employee.getNationalId());
        verify(audit).record("EMPLOYEE_UPDATED", "employees", 7L,
                "BA-EMP-007: CCCD; email; phòng ban: Đào tạo → Vận hành; chức vụ: Giáo viên → Trưởng nhóm");
    }

    @Test
    void hrUpdateWithoutChangesDoesNotWriteAudit() {
        Employee employee = employee();
        employee.getDepartment().setId(1L);
        employee.getPosition().setId(1L);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(employees.findByEmailIgnoreCase("old@example.local")).thenReturn(Optional.of(employee));
        when(departments.findById(1L)).thenReturn(Optional.of(employee.getDepartment()));
        when(positions.findById(1L)).thenReturn(Optional.of(employee.getPosition()));

        service.update(7L, new EmployeeDtos.UpdateEmployeeRequest(
                "Nguyễn Minh Anh", Gender.FEMALE, " ", "0900000000", "old@example.local",
                "Địa chỉ cũ", "Cao học", employee.getJoinDate(), 1L, 1L));

        verify(employees, never()).save(org.mockito.ArgumentMatchers.any());
        verifyNoInteractions(audit);
    }

    @Test
    void hrUpdateRejectsEmailOwnedByAnotherEmployee() {
        Employee employee = employee();
        Employee other = employee();
        other.setId(8L);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(employees.findByEmailIgnoreCase("taken@example.local")).thenReturn(Optional.of(other));

        assertThrows(vn.binhannhrm.common.ConflictException.class, () -> service.update(7L, new EmployeeDtos.UpdateEmployeeRequest(
                "Nguyễn Minh Anh", Gender.FEMALE, null, "0900000000", "taken@example.local",
                null, null, employee.getJoinDate(), 1L, 1L)));
        assertEquals("old@example.local", employee.getEmail());
        verifyNoInteractions(audit);
    }

    @Test
    void hrUpdateRejectsTerminatedEmployeeToKeepHistory() {
        Employee employee = employee();
        employee.setStatus(EmployeeStatus.TERMINATED);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));

        assertThrows(vn.binhannhrm.common.ConflictException.class, () -> service.update(7L, new EmployeeDtos.UpdateEmployeeRequest(
                "Tên mới", Gender.FEMALE, null, "0900000000", "old@example.local",
                null, null, employee.getJoinDate(), 1L, 1L)));
        assertEquals("Nguyễn Minh Anh", employee.getFullName());
        verifyNoInteractions(audit);
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
