package vn.binhannhrm.people;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.binhannhrm.domain.ContractStatus;
import vn.binhannhrm.domain.EmploymentContract;

import java.math.BigDecimal;
import java.time.LocalDate;

public final class ContractDtos {
    private ContractDtos() {}

    public record ContractRequest(
            @NotNull(message = "Nhân viên là bắt buộc") Long employeeId,
            @NotBlank(message = "Số hợp đồng là bắt buộc") @Size(max = 50, message = "Số hợp đồng tối đa 50 ký tự") String contractNumber,
            @NotBlank(message = "Loại hợp đồng là bắt buộc") @Size(max = 80, message = "Loại hợp đồng tối đa 80 ký tự") String contractType,
            @NotNull(message = "Ngày bắt đầu là bắt buộc") LocalDate startDate,
            LocalDate endDate,
            @NotNull(message = "Lương cơ bản là bắt buộc") @DecimalMin(value = "0.0", message = "Lương cơ bản không được âm")
            @DecimalMax(value = "999999999999.99", message = "Lương cơ bản quá lớn") BigDecimal baseSalary,
            @NotNull(message = "Phụ cấp là bắt buộc") @DecimalMin(value = "0.0", message = "Phụ cấp không được âm")
            @DecimalMax(value = "999999999999.99", message = "Phụ cấp quá lớn") BigDecimal allowance
    ) {
        @JsonIgnore
        @AssertTrue(message = "Ngày kết thúc phải bằng hoặc sau ngày bắt đầu")
        public boolean isDateRangeValid() {
            return startDate == null || endDate == null || !endDate.isBefore(startDate);
        }
    }

    public record TerminateRequest(@NotNull(message = "Ngày chấm dứt là bắt buộc") LocalDate endDate) {}

    /**
     * {@code status} is the stored lifecycle value; {@code effectiveStatus} adds the date view
     * (UPCOMING, ACTIVE, EXPIRED, TERMINATED) so every client shows the same answer for "today".
     */
    public record ContractResponse(Long id, Long employeeId, String employeeName, String employeeCode, String contractNumber,
                                   String contractType, LocalDate startDate, LocalDate endDate,
                                   BigDecimal baseSalary, BigDecimal allowance, String status, String effectiveStatus) {
        static ContractResponse from(EmploymentContract c, LocalDate today) {
            return new ContractResponse(c.getId(), c.getEmployee().getId(), c.getEmployee().getFullName(), c.getEmployee().getEmployeeCode(),
                    c.getContractNumber(), c.getContractType(), c.getStartDate(), c.getEndDate(), c.getBaseSalary(), c.getAllowance(),
                    c.getStatus().name(), effectiveStatus(c, today));
        }

        static String effectiveStatus(EmploymentContract c, LocalDate today) {
            if (c.getStatus() == ContractStatus.TERMINATED) return "TERMINATED";
            if (c.getStatus() == ContractStatus.EXPIRED || (c.getEndDate() != null && c.getEndDate().isBefore(today))) return "EXPIRED";
            if (c.getStartDate().isAfter(today)) return "UPCOMING";
            return "ACTIVE";
        }
    }
}
