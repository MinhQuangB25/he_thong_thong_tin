package vn.binhannhrm.admin;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.auth.*;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.AuditLog;
import vn.binhannhrm.domain.AuditLogRepository;

import java.util.List;

@Service
public class AdminService {
    private final AppUserRepository users; private final RoleRepository roles; private final AuditLogRepository auditLogs; private final AuditLogService audit;
    public AdminService(AppUserRepository users, RoleRepository roles, AuditLogRepository auditLogs, AuditLogService audit) { this.users = users; this.roles = roles; this.auditLogs = auditLogs; this.audit = audit; }
    @Transactional(readOnly = true) public List<AdminDtos.UserResponse> users() { return users.findAll().stream().map(AdminDtos.UserResponse::from).toList(); }
    @Transactional public AdminDtos.UserResponse updateRoles(Long id, AdminDtos.RoleUpdateRequest input) { AppUser user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản")); user.getRoles().clear(); input.roles().forEach(code -> user.addRole(roles.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vai trò")))); AppUser saved = users.save(user); audit.record("ROLE_CHANGED", "users", id, input.roles().toString()); return AdminDtos.UserResponse.from(saved); }
    @Transactional public AdminDtos.UserResponse updateStatus(Long id, AdminDtos.StatusUpdateRequest input) { AppUser user = users.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản")); user.setStatus(input.status()); AppUser saved = users.save(user); audit.record("STATUS_CHANGED", "users", id, input.status().name()); return AdminDtos.UserResponse.from(saved); }
    @Transactional(readOnly = true) public List<AuditLog> auditLogs() { return auditLogs.findAll(Sort.by(Sort.Direction.DESC, "createdAt")); }
}
