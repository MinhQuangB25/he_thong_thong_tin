package vn.binhannhrm.admin;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.auth.*;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.AuditLogRepository;
import vn.binhannhrm.domain.EmployeeRepository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceTest {
    @Mock AppUserRepository users;
    @Mock RoleRepository roles;
    @Mock EmployeeRepository employees;
    @Mock AuditLogRepository auditLogs;
    @Mock AuditLogService audit;
    @Mock PasswordEncoder passwordEncoder;
    private AdminService service;
    private final Role adminRole = new Role(RoleCode.ADMIN, "Quản trị");
    private final Role hrRole = new Role(RoleCode.HR_MANAGER, "Quản lý nhân sự");

    @BeforeEach
    void setUp() { service = new AdminService(users, roles, employees, auditLogs, audit, passwordEncoder); }

    @AfterEach
    void clearSecurity() { SecurityContextHolder.clearContext(); }

    private AppUser user(String username, Role... assigned) {
        AppUser user = new AppUser(username, "hash", username);
        for (Role role : assigned) user.addRole(role);
        return user;
    }

    @Test
    void createHashesPasswordAssignsRolesAndAudits() {
        when(passwordEncoder.encode("matkhau123")).thenReturn("hashed");
        when(roles.findByCode(RoleCode.HR_MANAGER)).thenReturn(Optional.of(hrRole));
        when(users.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var result = service.create(new AdminDtos.UserCreateRequest("  hr.moi ", "matkhau123", " HR mới ", Set.of(RoleCode.HR_MANAGER), AccountStatus.ACTIVE, null));

        assertEquals("hr.moi", result.username());
        assertEquals("HR mới", result.displayName());
        assertEquals(Set.of(RoleCode.HR_MANAGER), result.roles());
        verify(audit).record("ACCOUNT_CREATED", "users", null, "hr.moi");
    }

    @Test
    void createRejectsDuplicateUsernameAndUnknownLinkedEmployee() {
        when(users.existsByUsernameIgnoreCase("admin")).thenReturn(true);
        assertThrows(ConflictException.class, () -> service.create(new AdminDtos.UserCreateRequest(" admin ", "matkhau123", "A", Set.of(RoleCode.ADMIN), AccountStatus.ACTIVE, null)));

        when(employees.findById(99L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.create(new AdminDtos.UserCreateRequest("moi", "matkhau123", "M", Set.of(RoleCode.EMPLOYEE), AccountStatus.ACTIVE, 99L)));
        verify(users, never()).save(any());
        verifyNoInteractions(audit);
    }

    @Test
    void lastAdminCannotLoseAdminRole() {
        AppUser onlyAdmin = user("admin", adminRole);
        when(users.findById(1L)).thenReturn(Optional.of(onlyAdmin));
        when(users.findAll()).thenReturn(List.of(onlyAdmin, user("hr", hrRole)));

        var conflict = assertThrows(ConflictException.class, () -> service.updateRoles(1L, new AdminDtos.RoleUpdateRequest(Set.of(RoleCode.HR_MANAGER))));
        assertEquals("Hệ thống phải luôn có ít nhất một tài khoản Admin", conflict.getMessage());
        assertTrue(onlyAdmin.getRoles().contains(adminRole));
        verify(users, never()).save(any());
    }

    @Test
    void adminRoleCanMoveWhenAnotherAdminRemains() {
        AppUser first = user("admin", adminRole);
        when(users.findById(1L)).thenReturn(Optional.of(first));
        when(users.findAll()).thenReturn(List.of(first, user("admin2", adminRole)));
        when(roles.findByCode(RoleCode.HR_MANAGER)).thenReturn(Optional.of(hrRole));
        when(users.save(first)).thenReturn(first);

        var result = service.updateRoles(1L, new AdminDtos.RoleUpdateRequest(Set.of(RoleCode.HR_MANAGER)));

        assertEquals(Set.of(RoleCode.HR_MANAGER), result.roles());
        verify(audit).record("ROLE_CHANGED", "users", 1L, "[HR_MANAGER]");
    }

    @Test
    void cannotDeleteOwnAccountOrTheLastAdmin() {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken("admin", null, List.of()));
        AppUser self = user("admin", adminRole);
        when(users.findById(1L)).thenReturn(Optional.of(self));
        var own = assertThrows(ConflictException.class, () -> service.delete(1L));
        assertEquals("Không thể xóa tài khoản đang đăng nhập", own.getMessage());

        AppUser otherOnlyAdmin = user("root", adminRole);
        when(users.findById(2L)).thenReturn(Optional.of(otherOnlyAdmin));
        when(users.findAll()).thenReturn(List.of(otherOnlyAdmin));
        assertThrows(ConflictException.class, () -> service.delete(2L));
        verify(users, never()).delete(any());
        verifyNoInteractions(audit);
    }

    @Test
    void deletingAnotherNonAdminAccountAuditsFirst() {
        AppUser staff = user("employee09", new Role(RoleCode.EMPLOYEE, "Nhân viên"));
        when(users.findById(9L)).thenReturn(Optional.of(staff));

        service.delete(9L);

        verify(audit).record("ACCOUNT_DELETED", "users", 9L, "employee09");
        verify(users).delete(staff);
        assertTrue(staff.getRoles().isEmpty());
    }

    @Test
    void statusChangeIsAuditedAndUnknownAccountIsNotFound() {
        AppUser staff = user("employee09");
        when(users.findById(9L)).thenReturn(Optional.of(staff));
        when(users.save(staff)).thenReturn(staff);

        assertEquals(AccountStatus.LOCKED, service.updateStatus(9L, new AdminDtos.StatusUpdateRequest(AccountStatus.LOCKED)).status());
        verify(audit).record("STATUS_CHANGED", "users", 9L, "LOCKED");

        when(users.findById(404L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> service.updateStatus(404L, new AdminDtos.StatusUpdateRequest(AccountStatus.ACTIVE)));
        assertThrows(ResourceNotFoundException.class, () -> service.delete(404L));
    }
}
