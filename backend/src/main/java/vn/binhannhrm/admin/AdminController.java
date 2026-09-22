package vn.binhannhrm.admin;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
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
    @PostMapping("/users") @ResponseStatus(HttpStatus.CREATED) public AdminDtos.UserResponse create(@Valid @RequestBody AdminDtos.UserCreateRequest input) { return service.create(input); }
    @PutMapping("/users/{id}/roles") public AdminDtos.UserResponse updateRoles(@PathVariable Long id, @Valid @RequestBody AdminDtos.RoleUpdateRequest input) { return service.updateRoles(id, input); }
    @PatchMapping("/users/{id}/status") public AdminDtos.UserResponse updateStatus(@PathVariable Long id, @Valid @RequestBody AdminDtos.StatusUpdateRequest input) { return service.updateStatus(id, input); }
    @DeleteMapping("/users/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) public void delete(@PathVariable Long id) { service.delete(id); }
    @GetMapping("/audit-logs") public List<vn.binhannhrm.domain.AuditLog> auditLogs() { return service.auditLogs(); }
}
