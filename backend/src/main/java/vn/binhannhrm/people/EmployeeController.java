package vn.binhannhrm.people;

import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.common.PageResponse;

@RestController
@RequestMapping("/api/v1/employees")
public class EmployeeController {
    private final EmployeeService service;
    private final TeamAccessService teamAccess;

    public EmployeeController(EmployeeService service, TeamAccessService teamAccess) {
        this.service = service;
        this.teamAccess = teamAccess;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public PageResponse<EmployeeDtos.EmployeeResponse> list(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(defaultValue = "") String search,
            Pageable pageable
    ) {
        return PageResponse.from(service.list(search, pageable, teamAccess.scope(principal, null)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public EmployeeDtos.EmployeeResponse get(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable Long id) {
        teamAccess.assertVisible(principal, id);
        return service.get(id);
    }

    @GetMapping("/me")
    public EmployeeDtos.EmployeeResponse getOwnProfile(@AuthenticationPrincipal AppUserPrincipal principal) {
        if (principal.getUser().getEmployee() == null) {
            throw new vn.binhannhrm.common.ResourceNotFoundException("Tài khoản chưa liên kết hồ sơ nhân viên");
        }
        return service.get(principal.getUser().getEmployee().getId());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public EmployeeDtos.EmployeeResponse create(@Valid @RequestBody EmployeeDtos.CreateEmployeeRequest request) {
        return service.create(request);
    }

    @PatchMapping("/me")
    public EmployeeDtos.EmployeeResponse updateOwnProfile(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @Valid @RequestBody EmployeeDtos.UpdateProfileRequest request
    ) {
        if (principal.getUser().getEmployee() == null) {
            throw new vn.binhannhrm.common.ResourceNotFoundException("Tài khoản chưa liên kết hồ sơ nhân viên");
        }
        return service.updateOwnProfile(principal.getUser().getEmployee().getId(), request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public EmployeeDtos.EmployeeResponse terminate(@PathVariable Long id) {
        return service.terminate(id);
    }
}
