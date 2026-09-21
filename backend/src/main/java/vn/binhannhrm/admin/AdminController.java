package vn.binhannhrm.admin;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final AdminService service;
    public AdminController(AdminService service) { this.service = service; }
    @GetMapping("/users") public List<AdminDtos.UserResponse> users() { return service.users(); }
    @PutMapping("/users/{id}/roles") public AdminDtos.UserResponse updateRoles(@PathVariable Long id, @Valid @RequestBody AdminDtos.RoleUpdateRequest input) { return service.updateRoles(id, input); }
    @PatchMapping("/users/{id}/status") public AdminDtos.UserResponse updateStatus(@PathVariable Long id, @Valid @RequestBody AdminDtos.StatusUpdateRequest input) { return service.updateStatus(id, input); }
    @GetMapping("/audit-logs") public List<vn.binhannhrm.domain.AuditLog> auditLogs() { return service.auditLogs(); }
}
