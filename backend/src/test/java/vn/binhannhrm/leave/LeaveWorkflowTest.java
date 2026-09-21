package vn.binhannhrm.leave;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.domain.EmployeeRepository;
import vn.binhannhrm.domain.LeaveRequestRepository;
import vn.binhannhrm.domain.LeaveTypeRepository;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeaveWorkflowTest {
    @Mock LeaveTypeRepository types;
    @Mock LeaveRequestRepository requests;
    @Mock EmployeeRepository employees;
    @Mock AuditLogService audit;
    private LeaveService service;

    @BeforeEach
    void setUp() { service = new LeaveService(types, requests, employees, audit); }

    @Test
    void overlappingLeaveIsRejected() {
        LocalDate from = LocalDate.now().plusDays(1);
        when(requests.existsOverlapping(7L, from, from.plusDays(1))).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.create(7L, new LeaveDtos.CreateLeaveRequest(1L, from, from.plusDays(1), "Việc gia đình")));
    }

    @Test
    void reversedDatesAreRejected() {
        LocalDate from = LocalDate.now().plusDays(3);
        assertThrows(ConflictException.class, () -> service.create(7L, new LeaveDtos.CreateLeaveRequest(1L, from, from.minusDays(1), "Sai ngày")));
    }
}
