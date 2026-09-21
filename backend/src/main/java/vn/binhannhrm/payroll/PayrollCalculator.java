package vn.binhannhrm.payroll;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Component
public class PayrollCalculator {
    private static final BigDecimal HOURS_PER_DAY = BigDecimal.valueOf(8);
    private static final int MONEY_SCALE = 2;

    public Result calculate(Input input) {
        requirePositive(input.standardWorkDays(), "Ngày công chuẩn phải lớn hơn 0");
        requireNonNegative(input.workedDays(), "Ngày công không được âm");
        requireNonNegative(input.overtimeHours(), "Giờ tăng ca không được âm");
        requireNonNegative(input.baseSalary(), "Lương cơ bản không được âm");

        BigDecimal standardDays = BigDecimal.valueOf(input.standardWorkDays());
        BigDecimal dailySalary = input.baseSalary().divide(standardDays, 8, RoundingMode.HALF_UP);
        BigDecimal basePay = dailySalary.multiply(input.workedDays());
        BigDecimal hourlySalary = dailySalary.divide(HOURS_PER_DAY, 8, RoundingMode.HALF_UP);
        BigDecimal overtimePay = hourlySalary.multiply(input.overtimeHours()).multiply(input.overtimeMultiplier());
        BigDecimal netSalary = basePay
                .add(input.allowances())
                .add(overtimePay)
                .subtract(input.deductions());

        return new Result(
                money(basePay),
                money(overtimePay),
                money(netSalary.max(BigDecimal.ZERO))
        );
    }

    private void requirePositive(int value, String message) {
        if (value <= 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private void requireNonNegative(BigDecimal value, String message) {
        if (value == null || value.signum() < 0) {
            throw new IllegalArgumentException(message);
        }
    }

    private BigDecimal money(BigDecimal value) {
        return value.setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    public record Input(
            BigDecimal baseSalary,
            BigDecimal workedDays,
            BigDecimal overtimeHours,
            BigDecimal overtimeMultiplier,
            BigDecimal allowances,
            BigDecimal deductions,
            int standardWorkDays
    ) {
        public Input {
            overtimeMultiplier = overtimeMultiplier == null ? BigDecimal.ONE : overtimeMultiplier;
            allowances = allowances == null ? BigDecimal.ZERO : allowances;
            deductions = deductions == null ? BigDecimal.ZERO : deductions;
        }
    }

    public record Result(
            BigDecimal basePay,
            BigDecimal overtimePay,
            BigDecimal netSalary
    ) {
    }
}
