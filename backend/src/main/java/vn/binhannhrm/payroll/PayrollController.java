package vn.binhannhrm.payroll;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.common.ResourceNotFoundException;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class PayrollController {
    private final PayrollService service;
    public PayrollController(PayrollService service) { this.service = service; }
    @PostMapping("/payroll-periods")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public PayrollDtos.PeriodResponse createPeriod(@Valid @RequestBody PayrollDtos.PeriodRequest input) { return service.createPeriod(input); }
    @PostMapping("/payroll-periods/{id}/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public List<PayrollDtos.PayrollResponse> generate(@PathVariable Long id) { return service.generate(id); }
    @PatchMapping("/payroll-periods/{id}/lock")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public PayrollDtos.PeriodResponse lock(@PathVariable Long id) { return service.lock(id); }
    @GetMapping("/payrolls")
    @PreAuthorize("isAuthenticated()")
    public List<PayrollDtos.PayrollResponse> list(@AuthenticationPrincipal AppUserPrincipal principal) {
        boolean all = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR_MANAGER"));
        Long employeeId = principal.getUser().getEmployee() == null ? null : principal.getUser().getEmployee().getId();
        if (!all && employeeId == null) throw new ResourceNotFoundException("Tài khoản chưa liên kết hồ sơ nhân viên");
        return service.list(employeeId, all);
    }
}
