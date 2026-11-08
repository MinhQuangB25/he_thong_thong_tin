package vn.binhannhrm.people;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContractServiceTest {
    @Mock EmploymentContractRepository contracts;
    @Mock EmployeeRepository employees;
    @Mock AuditLogService audit;
    private ContractService service;
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void setUp() { service = new ContractService(contracts, employees, audit); }

    @Test
    void newContractClosesPreviousOneAndAuditsSalaryChange() {
        Employee employee = employee();
        EmploymentContract current = contract(employee, "HD-001", today.minusYears(1), "14000000", "500000");
        LocalDate start = today.plusMonths(1).withDayOfMonth(1);
        when(contracts.existsByContractNumber("HD-002")).thenReturn(false);
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(7L)).thenReturn(List.of(current));
        when(contracts.save(any())).thenAnswer(invocation -> { EmploymentContract c = invocation.getArgument(0); c.setId(9L); return c; });

        var response = service.create(new ContractDtos.ContractRequest(7L, " HD-002 ", "Không xác định thời hạn", start, null,
                new BigDecimal("15000000"), new BigDecimal("600000")));

        assertEquals(start.minusDays(1), current.getEndDate());
        assertEquals(ContractStatus.ACTIVE, current.getStatus());
        assertEquals("HD-002", response.contractNumber());
        assertEquals("UPCOMING", response.effectiveStatus());
        var detail = ArgumentCaptor.forClass(String.class);
        verify(audit).record(eq("CONTRACT_CREATED"), eq("employment_contracts"), eq(9L), detail.capture());
        assertEquals(true, detail.getValue().contains("thay HD-001"));
        assertEquals(true, detail.getValue().contains("lương cơ bản 14.000.000 ₫ → 15.000.000 ₫"));
        assertEquals(true, detail.getValue().contains("phụ cấp 500.000 ₫ → 600.000 ₫"));
    }

    @Test
    void firstContractIsCreatedWithoutTouchingOtherContracts() {
        Employee employee = employee();
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(7L)).thenReturn(List.of());
        when(contracts.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.create(new ContractDtos.ContractRequest(7L, "HD-NEW", "Thử việc", employee.getJoinDate(), today.plusMonths(2),
                new BigDecimal("9000000"), BigDecimal.ZERO));

        assertEquals("ACTIVE", response.effectiveStatus());
        assertEquals(today.plusMonths(2), response.endDate());
    }

    @Test
    void newContractMustStartAfterTheOpenContract() {
        Employee employee = employee();
        EmploymentContract current = contract(employee, "HD-001", today.minusMonths(1), "14000000", "500000");
        when(employees.findById(7L)).thenReturn(Optional.of(employee));
        when(contracts.findByEmployeeIdOrderByStartDateDesc(7L)).thenReturn(List.of(current));

        assertThrows(ConflictException.class, () -> service.create(new ContractDtos.ContractRequest(7L, "HD-002", "Loại", today.minusMonths(2), null,
                new BigDecimal("15000000"), BigDecimal.ZERO)));
        assertNull(current.getEndDate());
        verify(contracts, never()).save(any());
        verifyNoInteractions(audit);
    }

    @Test
    void contractIsRejectedForTerminatedEmployeeOrBeforeJoinDate() {
        Employee terminated = employee();
        terminated.setStatus(EmployeeStatus.TERMINATED);
        when(employees.findById(7L)).thenReturn(Optional.of(terminated));
        assertThrows(ConflictException.class, () -> service.create(new ContractDtos.ContractRequest(7L, "HD-X", "Loại", today, null, BigDecimal.TEN, BigDecimal.ZERO)));

        Employee active = employee();
        when(employees.findById(8L)).thenReturn(Optional.of(active));
        assertThrows(ConflictException.class, () -> service.create(new ContractDtos.ContractRequest(8L, "HD-Y", "Loại", active.getJoinDate().minusDays(1), null, BigDecimal.TEN, BigDecimal.ZERO)));
        verifyNoInteractions(audit);
    }

    @Test
    void duplicateContractNumberIsRejected() {
        when(contracts.existsByContractNumber("HD-001")).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.create(new ContractDtos.ContractRequest(7L, "HD-001", "Loại", today, null, BigDecimal.TEN, BigDecimal.ZERO)));
        verifyNoInteractions(employees, audit);
    }

    @Test
    void terminateSetsEndDateAndStatusWithAudit() {
        EmploymentContract current = contract(employee(), "HD-001", today.minusYears(1), "14000000", "500000");
        current.setId(3L);
        when(contracts.findById(3L)).thenReturn(Optional.of(current));
        when(contracts.save(current)).thenReturn(current);

        var response = service.terminate(3L, new ContractDtos.TerminateRequest(today.minusDays(1)));

        assertEquals(ContractStatus.TERMINATED, current.getStatus());
        assertEquals(today.minusDays(1), current.getEndDate());
        assertEquals("TERMINATED", response.effectiveStatus());
        verify(audit).record(eq("CONTRACT_TERMINATED"), eq("employment_contracts"), eq(3L), any());
    }

    @Test
    void terminateRejectsAlreadyClosedContractOrDateBeforeStart() {
        EmploymentContract closed = contract(employee(), "HD-001", today.minusYears(1), "14000000", "500000");
        closed.setStatus(ContractStatus.TERMINATED);
        when(contracts.findById(3L)).thenReturn(Optional.of(closed));
        assertThrows(ConflictException.class, () -> service.terminate(3L, new ContractDtos.TerminateRequest(today)));

        EmploymentContract open = contract(employee(), "HD-002", today.minusDays(5), "14000000", "500000");
        when(contracts.findById(4L)).thenReturn(Optional.of(open));
        assertThrows(ConflictException.class, () -> service.terminate(4L, new ContractDtos.TerminateRequest(today.minusDays(6))));
        assertEquals(ContractStatus.ACTIVE, open.getStatus());
        verifyNoInteractions(audit);
    }

    @Test
    void upcomingContractCannotBeTerminated() {
        EmploymentContract upcoming = contract(employee(), "HD-NEXT", today.plusDays(10), "15000000", "0");
        when(contracts.findById(5L)).thenReturn(Optional.of(upcoming));
        assertThrows(ConflictException.class, () -> service.terminate(5L, new ContractDtos.TerminateRequest(today.plusDays(20))));
        assertEquals(ContractStatus.ACTIVE, upcoming.getStatus());
        verifyNoInteractions(audit);
    }

    @Test
    void effectiveStatusFollowsDates() {
        Employee employee = employee();
        EmploymentContract expired = contract(employee, "A", today.minusYears(2), "1", "0");
        expired.setEndDate(today.minusDays(1));
        assertEquals("EXPIRED", ContractDtos.ContractResponse.effectiveStatus(expired, today));
        assertEquals("ACTIVE", ContractDtos.ContractResponse.effectiveStatus(contract(employee, "B", today, "1", "0"), today));
        assertEquals("UPCOMING", ContractDtos.ContractResponse.effectiveStatus(contract(employee, "C", today.plusDays(1), "1", "0"), today));
    }

    private Employee employee() {
        Employee employee = new Employee("BA-EMP-007", "Nguyễn Minh Anh", Gender.FEMALE, "0900000000", "anh@example.local",
                today.minusYears(2), new Department("Đào tạo", ""), new Position("Giáo viên", BigDecimal.ZERO));
        employee.setId(7L);
        return employee;
    }

    private static EmploymentContract contract(Employee employee, String number, LocalDate start, String salary, String allowance) {
        return new EmploymentContract(employee, number, "Không xác định thời hạn", start, new BigDecimal(salary), new BigDecimal(allowance));
    }
}
