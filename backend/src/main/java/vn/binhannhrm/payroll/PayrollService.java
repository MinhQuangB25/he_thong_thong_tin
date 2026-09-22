package vn.binhannhrm.payroll;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.time.YearMonth;
import java.time.Year;
import java.util.List;

@Service
public class PayrollService {
    private final PayrollPeriodRepository periods;
    private final PayrollRepository payrolls;
    private final EmployeeRepository employees;
    private final EmploymentContractRepository contracts;
    private final AttendanceRecordRepository attendance;
    private final SalarySettingsRepository settings;
    private final PayrollCalculator calculator;
    private final AuditLogService audit;
    public PayrollService(PayrollPeriodRepository periods, PayrollRepository payrolls, EmployeeRepository employees,
                          EmploymentContractRepository contracts, AttendanceRecordRepository attendance,
                          SalarySettingsRepository settings, PayrollCalculator calculator, AuditLogService audit) {
        this.periods = periods; this.payrolls = payrolls; this.employees = employees; this.contracts = contracts; this.attendance = attendance; this.settings = settings; this.calculator = calculator;
        this.audit = audit;
    }
    @Transactional
    public PayrollDtos.PeriodResponse createPeriod(PayrollDtos.PeriodRequest input) {
        if (periods.findByMonthAndYear(input.month(), input.year()).isPresent()) throw new ConflictException("Kỳ lương đã tồn tại");
        YearMonth ym = YearMonth.of(input.year(), input.month());
        return PayrollDtos.PeriodResponse.from(periods.save(new PayrollPeriod(input.month(), input.year(), ym.atDay(1), ym.atEndOfMonth())));
    }
    @Transactional
    public List<PayrollDtos.PayrollResponse> generate(Long periodId) {
        PayrollPeriod period = periods.findById(periodId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương"));
        if (period.getStatus() != PayrollStatus.DRAFT) throw new ConflictException("Kỳ lương đã khóa hoặc đã thanh toán");
        var salary = settings.findTopByOrderByEffectiveFromDesc().orElseThrow(() -> new ResourceNotFoundException("Chưa cấu hình ngày công chuẩn"));
        for (Employee employee : employees.findAll()) {
            if (employee.getStatus() == EmployeeStatus.TERMINATED) continue;
            var employeeContracts = contracts.findByEmployeeIdOrderByStartDateDesc(employee.getId());
            if (employeeContracts.isEmpty()) continue;
            var contract = employeeContracts.get(0);
            var records = attendance.findByEmployeeIdAndAttendanceDateBetweenOrderByAttendanceDate(employee.getId(), period.getFromDate(), period.getToDate());
            BigDecimal workedDays = BigDecimal.valueOf(records.stream().filter(r -> r.getStatus() == AttendanceStatus.PRESENT || r.getStatus() == AttendanceStatus.LATE).count());
            BigDecimal overtimeHours = records.stream().map(AttendanceRecord::getOvertimeHours).reduce(BigDecimal.ZERO, BigDecimal::add);
            var result = calculator.calculate(new PayrollCalculator.Input(contract.getBaseSalary(), workedDays, overtimeHours, salary.getOvertimeMultiplier(), contract.getAllowance(), BigDecimal.ZERO, salary.getStandardWorkDays()));
            Payroll payroll = payrolls.findByPeriodIdAndEmployeeId(periodId, employee.getId()).orElseGet(() -> new Payroll(period, employee));
            payroll.setBaseSalary(contract.getBaseSalary()); payroll.setWorkedDays(workedDays); payroll.setOvertimeHours(overtimeHours);
            payroll.setOvertimePay(result.overtimePay()); payroll.setAllowances(contract.getAllowance()); payroll.setDeductions(BigDecimal.ZERO); payroll.setNetSalary(result.netSalary()); payroll.setStatus(PayrollStatus.DRAFT);
            payrolls.save(payroll);
        }
        return payrolls.findByPeriodId(periodId).stream().map(PayrollDtos.PayrollResponse::from).toList();
    }
    @Transactional
    public PayrollDtos.PeriodResponse lock(Long periodId) {
        var period = periods.findById(periodId).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy kỳ lương"));
        if (payrolls.findByPeriodId(periodId).isEmpty()) throw new ConflictException("Chưa có bảng lương để khóa");
        period.setStatus(PayrollStatus.LOCKED); payrolls.findByPeriodId(periodId).forEach(p -> p.setStatus(PayrollStatus.LOCKED)); audit.record("PAYROLL_LOCKED", "payroll_periods", periodId, period.getMonth() + "/" + period.getYear());
        return PayrollDtos.PeriodResponse.from(period);
    }

    @Transactional(readOnly = true)
    public List<PayrollDtos.PeriodResponse> periods(Integer month, Integer year) {
        return periods.findAll().stream()
                .filter(period -> month == null || period.getMonth() == month)
                .filter(period -> year == null || period.getYear() == year)
                .sorted(java.util.Comparator.comparing(PayrollPeriod::getYear).reversed().thenComparing(PayrollPeriod::getMonth).reversed())
                .map(PayrollDtos.PeriodResponse::from)
                .toList();
    }
    @Transactional(readOnly = true)
    public List<PayrollDtos.PayrollResponse> list(Long employeeId, boolean all) {
        var result = all ? payrolls.findAll() : payrolls.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(employeeId);
        return result.stream().map(PayrollDtos.PayrollResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PayrollDtos.PayrollResponse> list(Long employeeId, boolean all, Integer month, Integer year) {
        int selectedYear = year == null ? Year.now().getValue() : year;
        if (month != null && (month < 1 || month > 12)) throw new ConflictException("Tháng lương không hợp lệ");
        var result = (all ? payrolls.findAll() : payrolls.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(employeeId)).stream()
                .filter(payroll -> month == null || payroll.getPeriod().getMonth() == month)
                .filter(payroll -> year == null || payroll.getPeriod().getYear() == selectedYear)
                .toList();
        return result.stream().map(PayrollDtos.PayrollResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public PayrollDtos.AnnualSummary annualSummary(Long employeeId, boolean all, Integer year) {
        int selectedYear = year == null ? Year.now().getValue() : year;
        var result = (all ? payrolls.findAll() : payrolls.findByEmployeeIdOrderByPeriodYearDescPeriodMonthDesc(employeeId)).stream()
                .filter(payroll -> payroll.getPeriod().getYear() == selectedYear)
                .toList();
        return new PayrollDtos.AnnualSummary(
                selectedYear,
                (int) result.stream().map(payroll -> payroll.getPeriod().getId()).distinct().count(),
                total(result, Payroll::getBaseSalary),
                total(result, Payroll::getAllowances),
                total(result, Payroll::getOvertimePay),
                total(result, Payroll::getDeductions),
                total(result, Payroll::getNetSalary)
        );
    }

    @Transactional(readOnly = true)
    public PayrollDtos.CalculationRule calculationRule() {
        var current = settings.findTopByOrderByEffectiveFromDesc().orElseThrow(() -> new ResourceNotFoundException("Chưa cấu hình công thức lương"));
        return new PayrollDtos.CalculationRule(current.getStandardWorkDays(), current.getOvertimeMultiplier(), "Lương thực tế + phụ cấp + tiền tăng ca - khấu trừ");
    }

    private BigDecimal total(List<Payroll> result, java.util.function.Function<Payroll, BigDecimal> getter) {
        return result.stream().map(getter).reduce(BigDecimal.ZERO, BigDecimal::add).setScale(2, java.math.RoundingMode.HALF_UP);
    }
}
