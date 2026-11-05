package vn.binhannhrm.assistant;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.attendance.AttendanceService;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.LeaveRequest;
import vn.binhannhrm.domain.LeaveRequestRepository;
import vn.binhannhrm.domain.LeaveStatus;
import vn.binhannhrm.domain.LeaveTypeCode;
import vn.binhannhrm.domain.LeaveTypeRepository;
import vn.binhannhrm.leave.LeaveService;
import vn.binhannhrm.payroll.PayrollService;
import vn.binhannhrm.people.EmployeeDtos;
import vn.binhannhrm.people.EmployeeService;
import vn.binhannhrm.people.TeamAccessService;
import vn.binhannhrm.report.ReportService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Component
@Transactional(readOnly = true)
public class JpaAssistantData implements AssistantData {
    private final EmployeeService employees;
    private final LeaveService leaves;
    private final AttendanceService attendance;
    private final PayrollService payrolls;
    private final ReportService reports;
    private final TeamAccessService teamAccess;
    private final LeaveTypeRepository leaveTypes;
    private final LeaveRequestRepository leaveRequests;

    public JpaAssistantData(EmployeeService employees, LeaveService leaves, AttendanceService attendance,
            PayrollService payrolls, ReportService reports, TeamAccessService teamAccess,
            LeaveTypeRepository leaveTypes, LeaveRequestRepository leaveRequests) {
        this.employees = employees;
        this.leaves = leaves;
        this.attendance = attendance;
        this.payrolls = payrolls;
        this.reports = reports;
        this.teamAccess = teamAccess;
        this.leaveTypes = leaveTypes;
        this.leaveRequests = leaveRequests;
    }

    @Override public EmployeeDtos.EmployeeResponse profile(Long employeeId) { return employees.get(employeeId); }

    @Override public AssistantDtos.Result ownProfile(Long employeeId) {
        var profile = profile(employeeId);
        return answer("Thông tin hồ sơ cá nhân hiện tại:", "Hồ sơ cá nhân", List.of(
                fact("Họ tên", profile.fullName()), fact("Mã nhân viên", profile.employeeCode()),
                fact("Email", profile.email()), fact("Điện thoại", profile.phone()),
                fact("Phòng ban", profile.departmentName()), fact("Chức vụ", profile.positionTitle())));
    }

    @Override public AssistantDtos.Result ownLeaves(Long employeeId) {
        var page = leaves.list(employeeId, false, null, PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "submittedAt")));
        if (page.isEmpty()) return answer("Bạn chưa có đơn nghỉ nào.", "Đơn từ của tôi", List.of());
        var facts = page.getContent().stream().map(item -> fact("Đơn #" + item.id(),
                item.leaveType() + ": " + item.fromDate() + " → " + item.toDate() + " (" + item.status() + ")")).toList();
        return answer("Các đơn nghỉ gần nhất của bạn:", "Đơn từ của tôi", facts);
    }

    @Override public AssistantDtos.Result ownAttendance(Long employeeId, int month, int year) {
        return attendanceFor(List.of(employeeId), month, year, "Chấm công của tôi");
    }

    @Override public AssistantDtos.Result teamAttendance(AppUserPrincipal principal, int month, int year) {
        return attendanceFor(teamAccess.scope(principal, null), month, year, "Chấm công nhóm");
    }

    private AssistantDtos.Result attendanceFor(List<Long> ids, int month, int year, String source) {
        YearMonth period = YearMonth.of(year, month);
        var rows = attendance.records(ids, period.atDay(1), period.atEndOfMonth());
        BigDecimal hours = rows.stream().map(row -> row.workedHours()).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal overtime = rows.stream().map(row -> row.overtimeHours()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return answer("Tình hình chấm công tháng " + month + "/" + year + ":", source,
                List.of(fact("Bản ghi", rows.size()), fact("Giờ làm", hours), fact("Giờ tăng ca", overtime)));
    }

    @Override public AssistantDtos.Result ownPayroll(Long employeeId, int month, int year) {
        var rows = payrolls.list(employeeId, false, month, year);
        if (rows.isEmpty()) return answer("Chưa có bảng lương của bạn cho tháng " + month + "/" + year + ".", "Bảng lương của tôi", List.of());
        var row = rows.get(0);
        return answer("Bảng lương của bạn tháng " + month + "/" + year + ":", "Bảng lương của tôi", List.of(
                fact("Lương cơ bản", row.baseSalary()), fact("Ngày công", row.workedDays()),
                fact("Phụ cấp", row.allowances()), fact("Tăng ca", row.overtimePay()),
                fact("Khấu trừ", row.deductions()), fact("Thực lĩnh", row.netSalary()), fact("Trạng thái", row.status())));
    }

    @Override public AssistantDtos.Result hrSummary(int month, int year) {
        var report = reports.employeeReport(month, year);
        return answer("Tình hình nhân sự cuối tháng " + month + "/" + year + ":", "Báo cáo nhân sự", List.of(
                fact("Tổng nhân sự", report.totalEmployees()), fact("Đang làm", report.active()),
                fact("Đang nghỉ phép", report.onLeave()), fact("Đã nghỉ việc", report.terminated())));
    }

    @Override public AssistantDtos.Result hrPayroll(int month, int year) {
        var rows = payrolls.list(null, true, month, year);
        BigDecimal total = rows.stream().map(row -> row.netSalary()).reduce(BigDecimal.ZERO, BigDecimal::add);
        return answer("Tổng hợp bảng lương tháng " + month + "/" + year + ":", "Báo cáo lương", List.of(
                fact("Số bảng lương", rows.size()), fact("Tổng thực lĩnh", total)));
    }

    @Override public AssistantDtos.Result payrollRule() {
        var rule = payrolls.calculationRule();
        return answer("Công thức lương đang áp dụng: " + rule.formula() + ".", "Quy tắc tính lương", List.of(
                fact("Ngày công chuẩn", rule.standardWorkDays()), fact("Hệ số tăng ca", rule.overtimeMultiplier())));
    }

    @Override public AssistantDtos.Result leaveTypes() {
        var facts = leaves.types().stream().map(type -> fact(type.name(),
                type.annualDays() > 0 ? type.annualDays() + " ngày/năm theo dữ liệu hệ thống" : "Có thể gửi đơn")).toList();
        return answer("Các loại đơn đang có trong hệ thống:", "Loại nghỉ", facts);
    }

    @Override public LeaveTypeInfo leaveType(String code) {
        var type = leaveTypes.findByCode(LeaveTypeCode.valueOf(code))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại nghỉ"));
        return new LeaveTypeInfo(type.getId(), type.getName());
    }

    @Override public boolean overlaps(Long employeeId, LocalDate from, LocalDate to) {
        return leaveRequests.existsOverlapping(employeeId, from, to);
    }

    @Override public LeaveInfo pendingLeave(Long employeeId, Long requestId) {
        LeaveRequest leave = requestId == null
                ? leaveRequests.findByEmployeeId(employeeId, PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "submittedAt")))
                    .stream().filter(item -> item.getStatus() == LeaveStatus.PENDING).findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Bạn không có đơn chờ duyệt để hủy"))
                : leaveRequests.findById(requestId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn nghỉ"));
        if (!leave.getEmployee().getId().equals(employeeId)) throw new AccessDeniedException("Không được xem đơn của người khác");
        if (leave.getStatus() != LeaveStatus.PENDING) throw new ConflictException("Chỉ được hủy đơn chờ duyệt");
        return new LeaveInfo(leave.getId(), leave.getLeaveType().getName(), leave.getFromDate(), leave.getToDate());
    }

    private AssistantDtos.Result answer(String message, String source, List<AssistantDtos.Fact> facts) {
        return AssistantDtos.Result.answer(message, facts, List.of(source));
    }
    private AssistantDtos.Fact fact(String label, Object value) {
        return new AssistantDtos.Fact(label, String.valueOf(value));
    }
}
