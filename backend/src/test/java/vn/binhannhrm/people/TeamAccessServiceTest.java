package vn.binhannhrm.people;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import vn.binhannhrm.auth.AppUser;
import vn.binhannhrm.auth.AppUserPrincipal;
import vn.binhannhrm.auth.Role;
import vn.binhannhrm.auth.RoleCode;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.Gender;
import vn.binhannhrm.domain.TeamMemberRepository;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamAccessServiceTest {
    @Mock TeamMemberRepository teamMembers;
    private TeamAccessService service;

    @BeforeEach
    void setUp() {
        service = new TeamAccessService(teamMembers);
    }

    @Test
    void teamLeaderCanOnlyScopeToOwnTeam() {
        Employee leader = employee(10L, "Leader");
        AppUser user = new AppUser("leader01", "hash", "Leader");
        user.setEmployee(leader);
        user.addRole(new Role(RoleCode.TEAM_LEADER, "Trưởng nhóm"));
        when(teamMembers.findActiveEmployeeIdsByLeaderId(10L)).thenReturn(List.of(10L, 11L));

        assertEquals(List.of(10L, 11L), service.scope(new AppUserPrincipal(user), null));
        assertThrows(AccessDeniedException.class, () -> service.scope(new AppUserPrincipal(user), 99L));
    }

    private static Employee employee(Long id, String name) {
        Employee employee = new Employee("E-" + id, name, Gender.OTHER, "0900000000", id + "@example.local", LocalDate.now().minusYears(1), new vn.binhannhrm.domain.Department("Đào tạo", ""), new vn.binhannhrm.domain.Position("Giáo viên", java.math.BigDecimal.ZERO));
        employee.setId(id);
        return employee;
    }
}
