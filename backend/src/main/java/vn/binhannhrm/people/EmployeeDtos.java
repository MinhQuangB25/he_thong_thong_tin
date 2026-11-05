package vn.binhannhrm.people;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.Gender;

import java.time.LocalDate;

public final class EmployeeDtos {
    private EmployeeDtos() {
    }

    public record CreateEmployeeRequest(
            @NotBlank(message = "Mã nhân viên là bắt buộc") String employeeCode,
            @NotBlank(message = "Họ tên là bắt buộc") String fullName,
            @NotNull(message = "Giới tính là bắt buộc") Gender gender,
            String nationalId,
            @NotBlank(message = "Số điện thoại là bắt buộc") String phone,
            @Email(message = "Email không hợp lệ") @NotBlank(message = "Email là bắt buộc") String email,
            String address,
            String educationLevel,
            @NotNull @PastOrPresent(message = "Ngày vào làm không được ở tương lai") LocalDate joinDate,
            @NotNull Long departmentId,
            @NotNull Long positionId,
            Long managerId
    ) {
    }

    /** HR edit of an employee record. Code, status, end date and salary are managed by their own flows. */
    public record UpdateEmployeeRequest(
            @NotBlank(message = "Họ tên là bắt buộc") @Size(max = 120, message = "Họ tên tối đa 120 ký tự") String fullName,
            @NotNull(message = "Giới tính là bắt buộc") Gender gender,
            @Size(max = 20, message = "Số CCCD tối đa 20 ký tự") String nationalId,
            @NotBlank(message = "Số điện thoại là bắt buộc") @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự") String phone,
            @Email(message = "Email không hợp lệ") @NotBlank(message = "Email là bắt buộc") @Size(max = 120, message = "Email tối đa 120 ký tự") String email,
            @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String address,
            @Size(max = 120, message = "Trình độ tối đa 120 ký tự") String educationLevel,
            @NotNull(message = "Ngày vào làm là bắt buộc") @PastOrPresent(message = "Ngày vào làm không được ở tương lai") LocalDate joinDate,
            @NotNull(message = "Phòng ban là bắt buộc") Long departmentId,
            @NotNull(message = "Chức vụ là bắt buộc") Long positionId
    ) {
    }

    public record UpdateProfileRequest(
            @NotBlank(message = "Số điện thoại là bắt buộc") String phone,
            @Email(message = "Email không hợp lệ") @NotBlank(message = "Email là bắt buộc") String email,
            String expectedEmail,
            String expectedPhone
    ) {
        public UpdateProfileRequest(String phone, String email) {
            this(phone, email, null, null);
        }
    }

    public record EmployeeResponse(
            Long id,
            String employeeCode,
            String fullName,
            Gender gender,
            String nationalId,
            String phone,
            String email,
            String address,
            String educationLevel,
            LocalDate joinDate,
            LocalDate endDate,
            String status,
            Long departmentId,
            String departmentName,
            Long positionId,
            String positionTitle,
            Long managerId
    ) {
        public static EmployeeResponse from(Employee employee) {
            return new EmployeeResponse(
                    employee.getId(), employee.getEmployeeCode(), employee.getFullName(), employee.getGender(),
                    employee.getNationalId(), employee.getPhone(), employee.getEmail(), employee.getAddress(),
                    employee.getEducationLevel(), employee.getJoinDate(), employee.getEndDate(), employee.getStatus().name(),
                    employee.getDepartment().getId(), employee.getDepartment().getName(),
                    employee.getPosition().getId(), employee.getPosition().getTitle(),
                    employee.getManager() == null ? null : employee.getManager().getId()
            );
        }
    }
}
