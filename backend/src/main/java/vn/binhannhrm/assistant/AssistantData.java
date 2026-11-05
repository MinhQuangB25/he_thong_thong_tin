package vn.binhannhrm.assistant;

import vn.binhannhrm.people.EmployeeDtos;
import vn.binhannhrm.auth.AppUserPrincipal;

import java.time.LocalDate;

public interface AssistantData {
    EmployeeDtos.EmployeeResponse profile(Long employeeId);
    AssistantDtos.Result ownProfile(Long employeeId);
    AssistantDtos.Result ownLeaves(Long employeeId);
    AssistantDtos.Result ownAttendance(Long employeeId, int month, int year);
    AssistantDtos.Result teamAttendance(AppUserPrincipal principal, int month, int year);
    AssistantDtos.Result ownPayroll(Long employeeId, int month, int year);
    AssistantDtos.Result hrSummary(int month, int year);
    AssistantDtos.Result hrPayroll(int month, int year);
    AssistantDtos.Result payrollRule();
    AssistantDtos.Result leaveTypes();
    LeaveTypeInfo leaveType(String code);
    boolean overlaps(Long employeeId, LocalDate from, LocalDate to);
    LeaveInfo pendingLeave(Long employeeId, Long requestId);

    record LeaveTypeInfo(Long id, String name) {}
    record LeaveInfo(Long id, String type, LocalDate fromDate, LocalDate toDate) {}
}
