package vn.binhannhrm.people;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.domain.TeamMemberRepository;

import java.util.List;

@Service
public class TeamAccessService {
    private final TeamMemberRepository teamMembers;

    public TeamAccessService(TeamMemberRepository teamMembers) {
        this.teamMembers = teamMembers;
    }

    public List<Long> scope(AppUserPrincipal principal, Long requestedEmployeeId) {
        if (hasRole(principal, "ADMIN") || hasRole(principal, "HR_MANAGER")) {
            return requestedEmployeeId == null ? null : List.of(requestedEmployeeId);
        }
        if (hasRole(principal, "TEAM_LEADER")) {
            Long leaderId = employeeId(principal);
            List<Long> visibleIds = teamMembers.findActiveEmployeeIdsByLeaderId(leaderId);
            if (requestedEmployeeId != null && !visibleIds.contains(requestedEmployeeId)) {
                throw new AccessDeniedException("Trưởng nhóm chỉ được xem dữ liệu của nhóm mình");
            }
            return requestedEmployeeId == null ? visibleIds : List.of(requestedEmployeeId);
        }
        Long ownId = employeeId(principal);
        if (requestedEmployeeId != null && !ownId.equals(requestedEmployeeId)) {
            throw new AccessDeniedException("Bạn chỉ được xem dữ liệu của chính mình");
        }
        return List.of(ownId);
    }

    public void assertVisible(AppUserPrincipal principal, Long employeeId) {
        scope(principal, employeeId);
    }

    private Long employeeId(AppUserPrincipal principal) {
        if (principal.getUser().getEmployee() == null) {
            throw new AccessDeniedException("Tài khoản chưa liên kết hồ sơ nhân viên");
        }
        return principal.getUser().getEmployee().getId();
    }

    private boolean hasRole(AppUserPrincipal principal, String role) {
        return principal.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }
}
