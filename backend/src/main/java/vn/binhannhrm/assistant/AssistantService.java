package vn.binhannhrm.assistant;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.people.EmployeeDtos;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;

@Service
public class AssistantService {
    private final AssistantModel model;
    private final AssistantData data;

    public AssistantService(AssistantModel model, AssistantData data) {
        this.model = model;
        this.data = data;
    }

    public AssistantDtos.Result answer(AppUserPrincipal principal, String question) {
        return answer(principal, new AssistantDtos.Question(question, List.of()));
    }

    public AssistantDtos.Result answer(AppUserPrincipal principal, AssistantDtos.Question request) {
        JsonNode decision = model.decide(request.question().trim(), request.history());
        String intent = decision.path("intent").asText("");
        return switch (intent) {
            case "UPDATE_OWN_PROFILE" -> updateOwnProfile(principal, decision);
            case "CREATE_OWN_LEAVE" -> createOwnLeave(principal, decision);
            case "CANCEL_OWN_LEAVE" -> cancelOwnLeave(principal, decision);
            case "OWN_PROFILE" -> data.ownProfile(employeeId(principal));
            case "OWN_LEAVES" -> data.ownLeaves(employeeId(principal));
            case "OWN_ATTENDANCE" -> data.ownAttendance(employeeId(principal), month(decision), year(decision));
            case "OWN_PAYROLL" -> data.ownPayroll(employeeId(principal), month(decision), year(decision));
            case "TEAM_ATTENDANCE" -> {
                if (!hasRole(principal, "TEAM_LEADER"))
                    throw new AccessDeniedException("Bạn không có quyền xem chấm công nhóm");
                yield data.teamAttendance(principal, month(decision), year(decision));
            }
            case "PAYROLL_RULE" -> data.payrollRule();
            case "LEAVE_TYPES" -> data.leaveTypes();
            case "HR_SUMMARY" -> {
                requireHr(principal);
                yield data.hrSummary(month(decision), year(decision));
            }
            case "HR_PAYROLL" -> {
                requireHr(principal);
                yield data.hrPayroll(month(decision), year(decision));
            }
            default -> unsupported();
        };
    }

    private AssistantDtos.Result createOwnLeave(AppUserPrincipal principal, JsonNode decision) {
        Long employeeId = employeeId(principal);
        String typeCode = decision.path("leaveType").asText("").trim().toUpperCase();
        String reason = decision.path("reason").asText("").trim();
        LocalDate from;
        LocalDate to;
        try {
            from = LocalDate.parse(decision.path("fromDate").asText(""));
            to = LocalDate.parse(decision.path("toDate").asText(""));
        } catch (DateTimeParseException exception) {
            return clarify("Hãy cho biết ngày bắt đầu và kết thúc theo định dạng ngày/tháng/năm.");
        }
        if (reason.isBlank() || reason.length() > 1000 || from.isBefore(LocalDate.now()) || to.isBefore(from))
            return clarify("Lý do hoặc ngày nghỉ chưa hợp lệ. Hãy cung cấp ngày từ hôm nay trở đi và lý do rõ ràng.");
        if (!List.of("ANNUAL", "SICK", "MATERNITY", "RESIGNATION").contains(typeCode))
            return clarify("Hãy chọn loại nghỉ phép năm, nghỉ ốm, thai sản hoặc nghỉ việc.");
        AssistantData.LeaveTypeInfo type = data.leaveType(typeCode);
        if (data.overlaps(employeeId, from, to))
            return clarify("Bạn đã có đơn nghỉ trùng thời gian này. Hãy kiểm tra lại trước khi tạo đơn mới.");
        return AssistantDtos.Result.proposal(new AssistantDtos.Proposal("CREATE_OWN_LEAVE",
                "Kiểm tra đơn " + type.name() + " từ " + from + " đến " + to + " trước khi gửi",
                Map.of("leaveTypeId", type.id(), "fromDate", from.toString(), "toDate", to.toString(), "reason", reason)));
    }

    private AssistantDtos.Result cancelOwnLeave(AppUserPrincipal principal, JsonNode decision) {
        Long employeeId = employeeId(principal);
        Long requestId = decision.path("leaveRequestId").canConvertToLong() ? decision.path("leaveRequestId").asLong() : null;
        AssistantData.LeaveInfo leave = data.pendingLeave(employeeId, requestId);
        return AssistantDtos.Result.proposal(new AssistantDtos.Proposal("CANCEL_OWN_LEAVE",
                "Hủy đơn " + leave.type() + " từ " + leave.fromDate() + " đến " + leave.toDate(),
                Map.of("leaveRequestId", leave.id())));
    }

    private AssistantDtos.Result updateOwnProfile(AppUserPrincipal principal, JsonNode decision) {
        Long employeeId = employeeId(principal);
        EmployeeDtos.EmployeeResponse profile = data.profile(employeeId);
        String email = decision.path("email").asText("").trim();
        String phone = decision.path("phone").asText("").trim();
        if (email.isEmpty() && phone.isEmpty()) return unsupported();
        if (email.isEmpty()) email = profile.email();
        if (phone.isEmpty()) phone = profile.phone();
        if (email.isBlank() || phone.isBlank() || !email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")) {
            return AssistantDtos.Result.answer("Thông tin liên hệ chưa hợp lệ. Hãy nhập lại email hoặc số điện thoại.", List.of(), List.of());
        }
        return AssistantDtos.Result.proposal(new AssistantDtos.Proposal("UPDATE_OWN_PROFILE",
                "Kiểm tra email và số điện thoại trước khi lưu", Map.of("email", email, "phone", phone,
                        "expectedEmail", profile.email(), "expectedPhone", profile.phone())));
    }

    private void requireHr(AppUserPrincipal principal) {
        if (!hasRole(principal, "ADMIN") && !hasRole(principal, "HR_MANAGER")) {
            throw new AccessDeniedException("Chỉ HR/Admin được xem báo cáo");
        }
    }

    private boolean hasRole(AppUserPrincipal principal, String role) {
        return principal.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    private Long employeeId(AppUserPrincipal principal) {
        if (principal.getUser().getEmployee() == null) {
            throw new AccessDeniedException("Tài khoản chưa liên kết nhân viên");
        }
        return principal.getUser().getEmployee().getId();
    }

    private AssistantDtos.Result unsupported() {
        return AssistantDtos.Result.answer("Trợ lý chưa hỗ trợ yêu cầu này hoặc chưa có đủ dữ liệu để trả lời.", List.of(), List.of());
    }

    private AssistantDtos.Result clarify(String message) {
        return AssistantDtos.Result.answer(message, List.of(), List.of());
    }

    private int month(JsonNode decision) {
        int value = decision.path("month").isInt() ? decision.path("month").asInt() : YearMonth.now().getMonthValue();
        if (value < 1 || value > 12) throw new vn.binhannhrm.common.BadRequestException("Tháng không hợp lệ");
        return value;
    }

    private int year(JsonNode decision) {
        int value = decision.path("year").isInt() ? decision.path("year").asInt() : YearMonth.now().getYear();
        if (value < 2020 || value > 2100) throw new vn.binhannhrm.common.BadRequestException("Năm không hợp lệ");
        return value;
    }
}
