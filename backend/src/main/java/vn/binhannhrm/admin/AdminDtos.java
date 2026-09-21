package vn.binhannhrm.admin;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import vn.binhannhrm.auth.AccountStatus;
import vn.binhannhrm.auth.AppUser;
import vn.binhannhrm.auth.RoleCode;

import java.util.Set;

public final class AdminDtos {
    private AdminDtos() {}
    public record UserResponse(Long id, String username, String displayName, AccountStatus status, Set<RoleCode> roles, Long employeeId) {
        static UserResponse from(AppUser user) { return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getStatus(), user.getRoles().stream().map(role -> role.getCode()).collect(java.util.stream.Collectors.toSet()), user.getEmployee() == null ? null : user.getEmployee().getId()); }
    }
    public record RoleUpdateRequest(@NotEmpty Set<@NotNull RoleCode> roles) {}
    public record StatusUpdateRequest(@NotNull AccountStatus status) {}
}
