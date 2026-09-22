package vn.binhannhrm.admin;

import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.auth.*;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.AuditLog;
import vn.binhannhrm.domain.AuditLogRepository;
import vn.binhannhrm.domain.EmployeeRepository;

import java.util.List;

@Service
public class AdminService {
    private final AppUserRepository users; private final RoleRepository roles; private final EmployeeRepository employees; private final AuditLogRepository auditLogs; private final AuditLogService audit; private final PasswordEncoder passwordEncoder;
    public AdminService(AppUserRepository users, RoleRepository roles, EmployeeRepository employees, AuditLogRepository auditLogs, AuditLogService audit, PasswordEncoder passwordEncoder) { this.users = users; this.roles = roles; this.employees = employees; this.auditLogs = auditLogs; this.audit = audit; this.passwordEncoder = passwordEncoder; }
    @Transactional(readOnly = true) public List<AdminDtos.UserResponse> users() { return users.findAll().stream().map(AdminDtos.UserResponse::from).toList(); }
    @Transactional public AdminDtos.UserResponse create(AdminDtos.UserCreateRequest input) {
        String username = input.username().trim();
        if (users.existsByUsernameIgnoreCase(username)) throw new vn.binhannhrm.common.ConflictException("Tên tài khoản đã tồn tại");
        AppUser user = new AppUser(username, passwordEncoder.encode(input.password()), input.displayName().trim());
        user.setStatus(input.status());
        if (input.employeeId() != null) user.setEmployee(employees.findById(input.employeeId()).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân sự liên kết")));
        input.roles().forEach(code -> user.addRole(roles.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò"))));
        AppUser saved = users.save(user);
        audit.record("ACCOUNT_CREATED", "users", saved.getId(), saved.getUsername());
        return AdminDtos.UserResponse.from(saved);
    }
    @Transactional public AdminDtos.UserResponse updateRoles(Long id, AdminDtos.RoleUpdateRequest input) { AppUser user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản")); boolean wasAdmin = user.getRoles().stream().anyMatch(role -> role.getCode() == RoleCode.ADMIN); boolean remainsAdmin = input.roles().contains(RoleCode.ADMIN); if (wasAdmin && !remainsAdmin && countAdmins() <= 1) throw new vn.binhannhrm.common.ConflictException("Hệ thống phải luôn có ít nhất một tài khoản Admin"); user.getRoles().clear(); input.roles().forEach(code -> user.addRole(roles.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò")))); AppUser saved = users.save(user); audit.record("ROLE_CHANGED", "users", id, input.roles().toString()); return AdminDtos.UserResponse.from(saved); }
    @Transactional public AdminDtos.UserResponse updateStatus(Long id, AdminDtos.StatusUpdateRequest input) { AppUser user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản")); user.setStatus(input.status()); AppUser saved = users.save(user); audit.record("STATUS_CHANGED", "users", id, input.status().name()); return AdminDtos.UserResponse.from(saved); }
    @Transactional public void delete(Long id) { AppUser user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản")); String currentUsername = SecurityContextHolder.getContext().getAuthentication() == null ? "" : SecurityContextHolder.getContext().getAuthentication().getName(); if (user.getUsername().equals(currentUsername)) throw new vn.binhannhrm.common.ConflictException("Không thể xóa tài khoản đang đăng nhập"); if (user.getRoles().stream().anyMatch(role -> role.getCode() == RoleCode.ADMIN) && countAdmins() <= 1) throw new vn.binhannhrm.common.ConflictException("Hệ thống phải luôn có ít nhất một tài khoản Admin"); audit.record("ACCOUNT_DELETED", "users", id, user.getUsername()); user.getRoles().clear(); users.delete(user); }
    @Transactional(readOnly = true) public List<AuditLog> auditLogs() { return auditLogs.findAll(Sort.by(Sort.Direction.DESC, "createdAt")); }
    private long countAdmins() { return users.findAll().stream().filter(user -> user.getRoles().stream().anyMatch(role -> role.getCode() == RoleCode.ADMIN)).count(); }
}
