package vn.binhannhrm.leave;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.common.PageResponse;
import vn.binhannhrm.common.ResourceNotFoundException;

@RestController
@RequestMapping("/api/v1")
public class LeaveController {
    private final LeaveService service;
    public LeaveController(LeaveService service) { this.service = service; }
    @GetMapping("/leave-types")
    @PreAuthorize("isAuthenticated()")
    public java.util.List<LeaveDtos.LeaveTypeResponse> types() { return service.types(); }
    @PostMapping("/leave-requests")
    @PreAuthorize("isAuthenticated()")
    public LeaveDtos.LeaveResponse create(@AuthenticationPrincipal AppUserPrincipal principal, @Valid @RequestBody LeaveDtos.CreateLeaveRequest request) {
        return service.create(employeeId(principal), request);
    }
    @GetMapping("/leave-requests")
    @PreAuthorize("isAuthenticated()")
    public PageResponse<LeaveDtos.LeaveResponse> list(@AuthenticationPrincipal AppUserPrincipal principal, Pageable pageable) {
        boolean all = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR_MANAGER"));
        return PageResponse.from(service.list(employeeIdOrNull(principal), all, pageable));
    }
    @PatchMapping("/leave-requests/{id}/review")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public LeaveDtos.LeaveResponse review(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable Long id, @Valid @RequestBody LeaveDtos.ReviewLeaveRequest request) {
        return service.review(employeeId(principal), id, request);
    }
    @PatchMapping("/leave-requests/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public void cancel(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable Long id) { service.cancel(employeeId(principal), id); }
    private Long employeeId(AppUserPrincipal p) { if (p.getUser().getEmployee() == null) throw new ResourceNotFoundException("Tài khoản chưa liên kết hồ sơ nhân viên"); return p.getUser().getEmployee().getId(); }
    private Long employeeIdOrNull(AppUserPrincipal p) { return p.getUser().getEmployee() == null ? null : p.getUser().getEmployee().getId(); }
}
