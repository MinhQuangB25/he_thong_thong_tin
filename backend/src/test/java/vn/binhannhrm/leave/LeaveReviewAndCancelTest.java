package vn.binhannhrm.leave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.AccessDeniedException;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaveReviewAndCancelTest {
    @Mock LeaveTypeRepository types;
    @Mock LeaveRequestRepository requests;
    @Mock EmployeeRepository employees;
    @Mock AuditLogService audit;
    private LeaveService service;
    private Employee owner;
    private LeaveType annual;

    @BeforeEach
    void setUp() {
        service = new LeaveService(types, requests, employees, audit);
        owner = employee(3L);
        annual = new LeaveType(LeaveTypeCode.ANNUAL, "Nghỉ phép năm", 12);
        annual.setId(1L);
    }

    private LeaveRequest pending(Long id) {
        LeaveRequest request = new LeaveRequest(owner, annual, LocalDate.of(2030, 3, 2), LocalDate.of(2030, 3, 3), "Việc gia đình");
        request.setId(id);
        return request;
    }

    @Test
    void createSavesPendingRequestForValidRange() {
        when(employees.findById(3L)).thenReturn(Optional.of(owner));
        when(types.findById(1L)).thenReturn(Optional.of(annual));
        when(requests.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.create(3L, new LeaveDtos.CreateLeaveRequest(1L, LocalDate.of(2030, 3, 2), LocalDate.of(2030, 3, 2), "Khám bệnh"));

        assertEquals("PENDING", result.status());
        assertEquals("Nghỉ phép năm", result.leaveType());
    }

    @Test
    void createRejectsUnknownLeaveType() {
        when(employees.findById(3L)).thenReturn(Optional.of(owner));
        when(types.findById(9L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(3L,
                new LeaveDtos.CreateLeaveRequest(9L, LocalDate.of(2030, 3, 2), LocalDate.of(2030, 3, 3), "Lý do")));
        verify(requests, never()).save(any());
    }

    @Test
    void approvingRecordsReviewerTimeAuditAndDropsRejectionReason() {
        LeaveRequest request = pending(5L);
        Employee reviewer = employee(1L);
        when(requests.findById(5L)).thenReturn(Optional.of(request));
        when(employees.findById(1L)).thenReturn(Optional.of(reviewer));
        when(requests.save(request)).thenReturn(request);

        var result = service.review(1L, 5L, new LeaveDtos.ReviewLeaveRequest("approved", "không dùng"));

        assertEquals("APPROVED", result.status());
        assertEquals(reviewer, request.getReviewer());
        assertNotNull(request.getReviewedAt());
        assertNull(request.getRejectionReason());
        verify(audit).record("LEAVE_REVIEWED", "leave_requests", 5L, "APPROVED");
    }

    @Test
    void rejectingKeepsTheReason() {
        LeaveRequest request = pending(5L);
        when(requests.findById(5L)).thenReturn(Optional.of(request));
        when(requests.save(request)).thenReturn(request);

        service.review(null, 5L, new LeaveDtos.ReviewLeaveRequest("REJECTED", "Trùng lịch dạy"));

        assertEquals(LeaveStatus.REJECTED, request.getStatus());
        assertEquals("Trùng lịch dạy", request.getRejectionReason());
        assertNull(request.getReviewer());
    }

    @Test
    void reviewOnlyAcceptsApproveOrRejectOnPendingRequests() {
        LeaveRequest request = pending(5L);
        when(requests.findById(5L)).thenReturn(Optional.of(request));

        var invalid = assertThrows(ConflictException.class, () -> service.review(1L, 5L, new LeaveDtos.ReviewLeaveRequest("MAYBE", null)));
        assertEquals("Trạng thái duyệt không hợp lệ", invalid.getMessage());
        for (String status : new String[]{"PENDING", "CANCELLED"}) {
            var notAllowed = assertThrows(ConflictException.class, () -> service.review(1L, 5L, new LeaveDtos.ReviewLeaveRequest(status, null)));
            assertEquals("Chỉ được duyệt hoặc từ chối đơn nghỉ", notAllowed.getMessage());
        }

        request.setStatus(LeaveStatus.APPROVED);
        var done = assertThrows(ConflictException.class, () -> service.review(1L, 5L, new LeaveDtos.ReviewLeaveRequest("REJECTED", null)));
        assertEquals("Đơn nghỉ không còn ở trạng thái chờ duyệt", done.getMessage());
        assertEquals(LeaveStatus.APPROVED, request.getStatus());
        verify(requests, never()).save(any());
        verifyNoInteractions(audit);
    }

    @Test
    void ownerCancelsOnlyOwnPendingRequest() {
        LeaveRequest request = pending(5L);
        when(requests.findById(5L)).thenReturn(Optional.of(request));

        var other = assertThrows(AccessDeniedException.class, () -> service.cancel(4L, 5L));
        assertEquals("Không được hủy đơn của người khác", other.getMessage());
        assertEquals(LeaveStatus.PENDING, request.getStatus());

        service.cancel(3L, 5L);
        assertEquals(LeaveStatus.CANCELLED, request.getStatus());

        var again = assertThrows(ConflictException.class, () -> service.cancel(3L, 5L));
        assertEquals("Chỉ được hủy đơn đang chờ duyệt", again.getMessage());
    }

    @Test
    void missingRequestIsNotFoundAndPersonalListWithoutProfileIsEmpty() {
        when(requests.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.cancel(3L, 99L));
        assertThrows(ResourceNotFoundException.class, () -> service.review(1L, 99L, new LeaveDtos.ReviewLeaveRequest("APPROVED", null)));

        assertTrue(service.list(null, false, null, PageRequest.of(0, 20)).isEmpty());
    }

    private static Employee employee(Long id) {
        Employee employee = new Employee("E-" + id, "Nhân viên " + id, Gender.FEMALE, "0900000000", id + "@example.local",
                LocalDate.of(2025, 1, 1), new Department("Đào tạo", ""), new Position("Giáo viên", BigDecimal.ZERO));
        employee.setId(id);
        return employee;
    }
}
