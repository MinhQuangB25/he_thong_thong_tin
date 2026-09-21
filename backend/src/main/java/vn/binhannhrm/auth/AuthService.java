package vn.binhannhrm.auth;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import vn.binhannhrm.common.InvalidCredentialsException;
import vn.binhannhrm.security.JwtService;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AppUserRepository userRepository;
    private final JwtService jwtService;

    public AuthService(
            AuthenticationManager authenticationManager,
            AppUserRepository userRepository,
            JwtService jwtService
    ) {
        this.authenticationManager = authenticationManager;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password())
            );
            AppUserPrincipal principal = (AppUserPrincipal) authentication.getPrincipal();
            AppUser user = userRepository.findByUsername(principal.getUsername())
                    .orElseThrow(InvalidCredentialsException::new);
            return new AuthDtos.LoginResponse(
                    jwtService.generateToken(principal),
                    "Bearer",
                    jwtService.getExpirationSeconds(),
                    AuthDtos.UserSummary.from(user)
            );
        } catch (RuntimeException exception) {
            if (exception instanceof InvalidCredentialsException) {
                throw exception;
            }
            throw new InvalidCredentialsException();
        }
    }
}

