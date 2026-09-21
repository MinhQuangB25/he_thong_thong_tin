package vn.binhannhrm.payroll;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;

class PayrollCalculatorTest {
    private final PayrollCalculator calculator = new PayrollCalculator();

    @Test
    void calculatesFullMonthAndOvertime() {
        PayrollCalculator.Input input = new PayrollCalculator.Input(
                money("26000000"),
                new BigDecimal("26"),
                new BigDecimal("4"),
                new BigDecimal("1.5"),
                money("1000000"),
                money("500000"),
                26
        );

        PayrollCalculator.Result result = calculator.calculate(input);

        assertEquals(money("26000000"), result.basePay());
        assertEquals(money("750000"), result.overtimePay());
        assertEquals(money("27250000"), result.netSalary());
    }

    @Test
    void calculatesPartialMonthWithoutOvertime() {
        PayrollCalculator.Input input = new PayrollCalculator.Input(
                money("13000000"),
                new BigDecimal("13.5"),
                BigDecimal.ZERO,
                new BigDecimal("1.5"),
                BigDecimal.ZERO,
                money("250000"),
                26
        );

        PayrollCalculator.Result result = calculator.calculate(input);

        assertEquals(money("6750000"), result.basePay());
        assertEquals(money("6500000"), result.netSalary());
    }

    private static BigDecimal money(String value) {
        return new BigDecimal(value).setScale(2);
    }
}

