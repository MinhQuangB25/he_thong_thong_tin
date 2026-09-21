package vn.binhannhrm.leave;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.EmployeeRepository;
import vn.binhannhrm.domain.LeaveRequest;
import vn.binhannhrm.domain.LeaveRequestRepository;
import vn.binhannhrm.domain.LeaveStatus;
import vn.binhannhrm.domain.LeaveTypeRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class LeaveService {
    private final LeaveTypeRepository types;
    private final LeaveRequestRepository requests;
    private final EmployeeRepository employees;
    private final AuditLogService audit;
    public LeaveService(LeaveTypeRepository types, LeaveRequestRepository requests, EmployeeRepository employees, AuditLogService audit) {
        this.types = types; this.requests = requests; this.employees = employees; this.audit = audit;
    }
    @Transactional(readOnly = true)
    public List<LeaveDtos.LeaveTypeResponse> types() { return types.findAll().stream().map(LeaveDtos.LeaveTypeResponse::from).toList(); }
    @Transactional
    public LeaveDtos.LeaveResponse create(Long employeeId, LeaveDtos.CreateLeaveRequest request) {
        if (request.toDate().isBefore(request.fromDate())) throw new ConflictException("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
        if (requests.existsOverlapping(employeeId, request.fromDate(), request.toDate())) throw new ConflictException("Đơn nghỉ bị trùng thời gian");
        Employee employee = employees.findById(employeeId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
        var type = types.findById(request.leaveTypeId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại nghỉ"));
        return LeaveDtos.LeaveResponse.from(requests.save(new LeaveRequest(employee, type, request.fromDate(), request.toDate(), request.reason())));
    }
    @Transactional(readOnly = true)
    public Page<LeaveDtos.LeaveResponse> list(Long employeeId, boolean all, Pageable pageable) {
        var page = all ? requests.findAll(pageable) : requests.findByEmployeeId(employeeId, pageable);
        return page.map(LeaveDtos.LeaveResponse::from);
    }
    @Transactional
    public LeaveDtos.LeaveResponse review(Long reviewerId, Long requestId, LeaveDtos.ReviewLeaveRequest input) {
        LeaveRequest request = requests.findById(requestId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn nghỉ"));
        if (request.getStatus() != LeaveStatus.PENDING) throw new ConflictException("Đơn nghỉ không còn ở trạng thái chờ duyệt");
        LeaveStatus status;
        try { status = LeaveStatus.valueOf(input.status().toUpperCase()); }
        catch (IllegalArgumentException ex) { throw new ConflictException("Trạng thái duyệt không hợp lệ"); }
        if (status != LeaveStatus.APPROVED && status != LeaveStatus.REJECTED) throw new ConflictException("Chỉ được duyệt hoặc từ chối đơn nghỉ");
        request.setStatus(status);
        request.setReviewer(employees.findById(reviewerId).orElse(null));
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(status == LeaveStatus.REJECTED ? input.rejectionReason() : null);
        LeaveRequest saved = requests.save(request); audit.record("LEAVE_REVIEWED", "leave_requests", saved.getId(), status.name()); return LeaveDtos.LeaveResponse.from(saved);
    }
    @Transactional
    public void cancel(Long employeeId, Long requestId) {
        LeaveRequest request = requests.findById(requestId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn nghỉ"));
        if (!request.getEmployee().getId().equals(employeeId)) throw new org.springframework.security.access.AccessDeniedException("Không được hủy đơn của người khác");
        if (request.getStatus() != LeaveStatus.PENDING) throw new ConflictException("Chỉ được hủy đơn đang chờ duyệt");
        request.setStatus(LeaveStatus.CANCELLED);
    }
}
