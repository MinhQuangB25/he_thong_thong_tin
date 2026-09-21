package vn.binhannhrm.people;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import vn.binhannhrm.domain.Department;
import vn.binhannhrm.domain.EmploymentContract;
import vn.binhannhrm.domain.Position;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    public record ContractRequest(@NotNull Long employeeId, @NotBlank String contractNumber, @NotBlank String contractType,
                                  @NotNull LocalDate startDate, LocalDate endDate,
                                  @NotNull @DecimalMin("0.0") BigDecimal baseSalary,
                                  @NotNull @DecimalMin("0.0") BigDecimal allowance) {}
    public record ContractResponse(Long id, Long employeeId, String employeeName, String contractNumber,
                                   String contractType, LocalDate startDate, LocalDate endDate,
                                   BigDecimal baseSalary, BigDecimal allowance, String status) {
        static ContractResponse from(EmploymentContract c) {
            return new ContractResponse(c.getId(), c.getEmployee().getId(), c.getEmployee().getFullName(), c.getContractNumber(),
                    c.getContractType(), c.getStartDate(), c.getEndDate(), c.getBaseSalary(), c.getAllowance(), c.getStatus().name());
        }
    }
}
