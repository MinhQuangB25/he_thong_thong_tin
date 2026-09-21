package vn.binhannhrm.auth;

import jakarta.validation.constraints.NotBlank;

public final class AuthDtos {
    private AuthDtos() {
    }

    public record LoginRequest(
            @NotBlank(message = "Tên đăng nhập là bắt buộc") String username,
            @NotBlank(message = "Mật khẩu là bắt buộc") String password
    ) {
    }

    public record UserSummary(
            Long id,
            String username,
            String displayName,
            java.util.List<String> roles
    ) {
        public static UserSummary from(AppUser user) {
            return new UserSummary(
                    user.getId(),
                    user.getUsername(),
                    user.getDisplayName(),
                    user.getRoles().stream().map(role -> role.getCode().name()).sorted().toList()
            );
        }
    }

    public record LoginResponse(
            String accessToken,
            String tokenType,
            long expiresIn,
            UserSummary user
    ) {
    }
}

