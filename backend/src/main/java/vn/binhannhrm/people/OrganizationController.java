package vn.binhannhrm.people;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class OrganizationController {
    private final OrganizationService service;
    public OrganizationController(OrganizationService service) { this.service = service; }
    @GetMapping("/departments")
    @PreAuthorize("isAuthenticated()")
    public List<OrganizationDtos.DepartmentResponse> departments() { return service.listDepartments(); }
    @PostMapping("/departments")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public OrganizationDtos.DepartmentResponse createDepartment(@Valid @RequestBody OrganizationDtos.DepartmentRequest request) { return service.createDepartment(request); }
    @GetMapping("/positions")
    @PreAuthorize("isAuthenticated()")
    public List<OrganizationDtos.PositionResponse> positions() { return service.listPositions(); }
    @PostMapping("/positions")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public OrganizationDtos.PositionResponse createPosition(@Valid @RequestBody OrganizationDtos.PositionRequest request) { return service.createPosition(request); }
}
