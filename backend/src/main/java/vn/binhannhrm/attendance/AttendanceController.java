package vn.binhannhrm.attendance;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.people.TeamAccessService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
public class AttendanceController {
    private final AttendanceService service;
    private final TeamAccessService teamAccess;
    private final vn.binhannhrm.domain.WorkShiftRepository shifts;
    public AttendanceController(AttendanceService service, TeamAccessService teamAccess, vn.binhannhrm.domain.WorkShiftRepository shifts) { this.service = service; this.teamAccess = teamAccess; this.shifts = shifts; }

    @GetMapping("/work-shifts")
    @PreAuthorize("isAuthenticated()")
    public List<AttendanceDtos.WorkShiftResponse> shifts() {
        return shifts.findByActiveTrueOrderByName().stream().map(AttendanceDtos.WorkShiftResponse::from).toList();
    }
    @PostMapping("/work-schedules")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public AttendanceDtos.ScheduleResponse schedule(@Valid @RequestBody AttendanceDtos.ScheduleRequest request) { return service.createSchedule(request); }
    @GetMapping("/work-schedules")
    @PreAuthorize("isAuthenticated()")
    public List<AttendanceDtos.ScheduleResponse> schedules(@AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.schedules(teamAccess.scope(principal, employeeId), from, to);
    }
    @PostMapping("/attendance")
    @PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
    public AttendanceDtos.AttendanceResponse record(@Valid @RequestBody AttendanceDtos.AttendanceRequest request) { return service.record(request); }
    @GetMapping("/attendance")
    @PreAuthorize("isAuthenticated()")
    public List<AttendanceDtos.AttendanceResponse> records(@AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) Long employeeId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.records(teamAccess.scope(principal, employeeId), from, to);
    }
}
