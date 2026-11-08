package vn.binhannhrm.people;

import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
@PreAuthorize("hasAnyRole('ADMIN', 'HR_MANAGER')")
public class ContractController {
    private final ContractService service;

    public ContractController(ContractService service) { this.service = service; }

    @GetMapping
    public List<ContractDtos.ContractResponse> list(@RequestParam(required = false) Long employeeId) {
        return service.list(employeeId);
    }

    @PostMapping
    public ContractDtos.ContractResponse create(@Valid @RequestBody ContractDtos.ContractRequest request) {
        return service.create(request);
    }

    @PatchMapping("/{id}/terminate")
    public ContractDtos.ContractResponse terminate(@PathVariable Long id, @Valid @RequestBody ContractDtos.TerminateRequest request) {
        return service.terminate(id, request);
    }
}
