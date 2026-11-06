package vn.binhannhrm.people;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vn.binhannhrm.domain.Department;
import vn.binhannhrm.domain.Position;

import java.math.BigDecimal;

public final class OrganizationDtos {
    private OrganizationDtos() {}
    public record DepartmentRequest(@NotBlank String name, String description) {}
    public record DepartmentResponse(Long id, String name, String description, boolean active) {
        static DepartmentResponse from(Department d) { return new DepartmentResponse(d.getId(), d.getName(), d.getDescription(), d.isActive()); }
    }
    public record PositionRequest(@NotBlank String title, @NotNull @DecimalMin("0.0") BigDecimal defaultAllowance) {}
    public record PositionResponse(Long id, String title, BigDecimal defaultAllowance, boolean active) {
        static PositionResponse from(Position p) { return new PositionResponse(p.getId(), p.getTitle(), p.getDefaultAllowance(), p.isActive()); }
    }
}
