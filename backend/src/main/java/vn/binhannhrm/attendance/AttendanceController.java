package vn.binhannhrm.attendance;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.common.ResourceNotFoundException;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AttendanceController {
    private final AttendanceService service;
    public AttendanceController(AttendanceService service) { this.service = service; }
    @PostMapping("/work-schedules")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public AttendanceDtos.ScheduleResponse schedule(@Valid @RequestBody AttendanceDtos.ScheduleRequest request) { return service.createSchedule(request); }
    @GetMapping("/work-schedules")
    @PreAuthorize("isAuthenticated()")
    public List<AttendanceDtos.ScheduleResponse> schedules(@AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.schedules(targetEmployee(principal, employeeId), from, to);
    }
    @PostMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER', 'TEAM_LEADER')")
    public AttendanceDtos.AttendanceResponse record(@Valid @RequestBody AttendanceDtos.AttendanceRequest request) { return service.record(request); }
    @GetMapping("/attendance")
    @PreAuthorize("isAuthenticated()")
    public List<AttendanceDtos.AttendanceResponse> records(@AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.records(targetEmployee(principal, employeeId), from, to);
    }
    private Long targetEmployee(AppUserPrincipal principal, Long requested) {
        boolean manager = principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_HR_MANAGER") || a.getAuthority().equals("ROLE_TEAM_LEADER"));
        if (manager && requested != null) return requested;
        if (principal.getUser().getEmployee() == null) throw new ResourceNotFoundException("Tài khoản chưa liên kết hồ sơ nhân viên");
        return principal.getUser().getEmployee().getId();
    }
}
