package vn.binhannhrm.leave;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vn.binhannhrm.domain.LeaveRequest;
import vn.binhannhrm.domain.LeaveType;

import java.time.LocalDate;
import java.time.LocalDateTime;

public final class LeaveDtos {
    private LeaveDtos() {}
    public record LeaveTypeResponse(Long id, String code, String name, int annualDays) {
        static LeaveTypeResponse from(LeaveType t) { return new LeaveTypeResponse(t.getId(), t.getCode().name(), t.getName(), t.getAnnualDays()); }
    }
    public record CreateLeaveRequest(@NotNull Long leaveTypeId, @NotNull @FutureOrPresent LocalDate fromDate,
                                     @NotNull @FutureOrPresent LocalDate toDate, @NotBlank String reason) {}
    public record ReviewLeaveRequest(@NotNull String status, String rejectionReason) {}
    public record LeaveResponse(Long id, Long employeeId, String employeeName, String leaveType,
                                LocalDate fromDate, LocalDate toDate, String reason,
                                LocalDateTime submittedAt, String status, String rejectionReason) {
        static LeaveResponse from(LeaveRequest r) {
            return new LeaveResponse(r.getId(), r.getEmployee().getId(), r.getEmployee().getFullName(), r.getLeaveType().getName(),
                    r.getFromDate(), r.getToDate(), r.getReason(), r.getSubmittedAt(), r.getStatus().name(), r.getRejectionReason());
        }
    }
}
