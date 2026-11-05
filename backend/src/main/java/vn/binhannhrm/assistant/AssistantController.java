package vn.binhannhrm.assistant;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.binhannhrm.auth.AppUserPrincipal;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {
    private final AssistantService service;

    public AssistantController(AssistantService service) { this.service = service; }

    @PostMapping("/answers")
    @PreAuthorize("isAuthenticated()")
    public AssistantDtos.Result answer(@AuthenticationPrincipal AppUserPrincipal principal,
                                       @Valid @RequestBody AssistantDtos.Question request) {
        return service.answer(principal, request);
    }
}
