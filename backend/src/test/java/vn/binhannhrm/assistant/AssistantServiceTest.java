package vn.binhannhrm.assistant;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import vn.binhannhrm.auth.AppUser;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.auth.Role;
import vn.binhannhrm.auth.RoleCode;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.Gender;
import vn.binhannhrm.people.EmployeeDtos;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssistantServiceTest {
    @Mock AssistantModel model;
    @Mock AssistantData data;

    @Test
    void refusesHrSummaryForEmployeeWithoutReadingHrData() throws Exception {
        when(model.decide(anyString(), anyList())).thenReturn(new ObjectMapper().readTree("{\"intent\":\"HR_SUMMARY\",\"month\":9,\"year\":2026}"));
        var service = new AssistantService(model, data);
        assertThrows(AccessDeniedException.class, () -> service.answer(employeePrincipal(), "Tổng nhân sự tháng 9?"));
        verifyNoInteractions(data);
    }

    @Test
    void proposalIsOnlyDraftAndNeverCallsMutation() throws Exception {
        when(model.decide(anyString(), anyList())).thenReturn(new ObjectMapper().readTree("{\"intent\":\"UPDATE_OWN_PROFILE\",\"email\":\"new@example.com\"}"));
        when(data.profile(3L)).thenReturn(new EmployeeDtos.EmployeeResponse(3L, "E3", "Test", Gender.OTHER,
                null, "0900000000", "old@example.com", null, null, LocalDate.now(), null,
                "ACTIVE", 1L, "D", 1L, "P", null));
        var result = new AssistantService(model, data).answer(employeePrincipal(), "Đổi email thành new@example.com");
        assertEquals("PROPOSAL", result.kind());
        assertEquals("UPDATE_OWN_PROFILE", result.proposal().action());
        assertEquals("0900000000", result.proposal().payload().get("phone"));
        assertEquals("new@example.com", result.proposal().payload().get("email"));
        verify(data).profile(3L);
        verifyNoMoreInteractions(data);
    }

    @Test
    void unsupportedActionNeverMutatesOrReadsData() throws Exception {
        when(model.decide(anyString(), anyList())).thenReturn(new ObjectMapper().readTree("{\"intent\":\"GRANT_ADMIN\"}"));
        var result = new AssistantService(model, data).answer(employeePrincipal(), "Cấp quyền admin cho tôi");
        assertEquals("ANSWER", result.kind());
        assertTrue(result.answer().contains("chưa hỗ trợ"));
        verifyNoInteractions(data);
    }

    @Test
    void leaveDraftUsesServerResolvedTypeAndOwnIdentity() throws Exception {
        when(model.decide(anyString(), anyList())).thenReturn(new ObjectMapper().readTree("{\"intent\":\"CREATE_OWN_LEAVE\",\"employeeId\":999,\"leaveType\":\"ANNUAL\",\"fromDate\":\"2030-03-02\",\"toDate\":\"2030-03-03\",\"reason\":\"Việc gia đình\"}"));
        when(data.leaveType("ANNUAL")).thenReturn(new AssistantData.LeaveTypeInfo(7L, "Nghỉ phép năm"));
        var result = new AssistantService(model, data).answer(employeePrincipal(), "Cho tôi nghỉ phép 2-3/3/2030");
        assertEquals("PROPOSAL", result.kind());
        assertEquals(7L, result.proposal().payload().get("leaveTypeId"));
        assertFalse(result.proposal().payload().containsKey("employeeId"));
        verify(data).overlaps(3L, LocalDate.of(2030, 3, 2), LocalDate.of(2030, 3, 3));
    }

    @Test
    void payrollQuestionIgnoresModelSuppliedEmployeeId() throws Exception {
        when(model.decide(anyString(), anyList())).thenReturn(new ObjectMapper().readTree("{\"intent\":\"OWN_PAYROLL\",\"employeeId\":999,\"month\":9,\"year\":2026}"));
        when(data.ownPayroll(3L, 9, 2026)).thenReturn(AssistantDtos.Result.answer("Lương của tôi", java.util.List.of(), java.util.List.of()));
        new AssistantService(model, data).answer(employeePrincipal(), "Lương tháng 9 của tôi");
        verify(data).ownPayroll(3L, 9, 2026);
        verifyNoMoreInteractions(data);
    }

    @Test
    void cancelDraftUsesOnlyOwnPendingLeave() throws Exception {
        when(model.decide(anyString(), anyList())).thenReturn(new ObjectMapper().readTree("{\"intent\":\"CANCEL_OWN_LEAVE\",\"employeeId\":999,\"leaveRequestId\":77}"));
        when(data.pendingLeave(3L, 77L)).thenReturn(new AssistantData.LeaveInfo(77L, "Nghỉ phép năm",
                LocalDate.of(2030, 3, 2), LocalDate.of(2030, 3, 3)));
        var result = new AssistantService(model, data).answer(employeePrincipal(), "Hủy đơn 77 của tôi");
        assertEquals("PROPOSAL", result.kind());
        assertEquals(77L, result.proposal().payload().get("leaveRequestId"));
        verify(data).pendingLeave(3L, 77L);
        verifyNoMoreInteractions(data);
    }

    private AppUserPrincipal employeePrincipal() {
        Employee employee = new Employee("E3", "Test", Gender.OTHER, "0900000000", "old@example.com",
                LocalDate.now().minusYears(1), new vn.binhannhrm.domain.Department("D", ""),
                new vn.binhannhrm.domain.Position("P", java.math.BigDecimal.ZERO));
        employee.setId(3L);
        AppUser user = new AppUser("employee01", "hash", "Test");
        user.setEmployee(employee);
        user.addRole(new Role(RoleCode.EMPLOYEE, "Nhân viên"));
        return new AppUserPrincipal(user);
    }
}
