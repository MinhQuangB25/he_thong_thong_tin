package vn.binhannhrm.people;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.domain.ContractStatus;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.EmployeeRepository;
import vn.binhannhrm.domain.EmployeeStatus;
import vn.binhannhrm.domain.EmploymentContract;
import vn.binhannhrm.domain.EmploymentContractRepository;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

/**
 * Contracts are the salary source of truth. A salary change is a new contract: the previous open
 * contract is closed the day before the new one starts, so payroll and reports can pick the
 * contract that was effective on any date and the old salary stays in history.
 */
@Service
public class ContractService {
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private final EmploymentContractRepository contracts;
    private final EmployeeRepository employees;
    private final AuditLogService audit;

    public ContractService(EmploymentContractRepository contracts, EmployeeRepository employees, AuditLogService audit) {
        this.contracts = contracts; this.employees = employees; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public List<ContractDtos.ContractResponse> list(Long employeeId) {
        LocalDate today = LocalDate.now();
        List<EmploymentContract> rows = employeeId == null ? contracts.findAll() : contracts.findByEmployeeIdOrderByStartDateDesc(employeeId);
        return rows.stream()
                .sorted(Comparator.comparing((EmploymentContract c) -> c.getEmployee().getFullName(), Comparator.nullsLast(String::compareTo))
                        .thenComparing(EmploymentContract::getStartDate, Comparator.reverseOrder()))
                .map(c -> ContractDtos.ContractResponse.from(c, today))
                .toList();
    }

    @Transactional
    public ContractDtos.ContractResponse create(ContractDtos.ContractRequest request) {
        String number = request.contractNumber().trim();
        if (contracts.existsByContractNumber(number)) throw new ConflictException("Số hợp đồng đã tồn tại");
        Employee employee = employees.findById(request.employeeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
        if (employee.getStatus() == EmployeeStatus.TERMINATED) {
            throw new ConflictException("Nhân viên đã nghỉ việc, không thể ký hợp đồng mới");
        }
        if (request.startDate().isBefore(employee.getJoinDate())) {
            throw new ConflictException("Ngày bắt đầu hợp đồng không được trước ngày vào làm (" + DATE.format(employee.getJoinDate()) + ")");
        }

        List<EmploymentContract> open = contracts.findByEmployeeIdOrderByStartDateDesc(employee.getId()).stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .filter(c -> c.getEndDate() == null || !c.getEndDate().isBefore(request.startDate()))
                .toList();
        for (EmploymentContract current : open) {
            if (!current.getStartDate().isBefore(request.startDate())) {
                throw new ConflictException("Hợp đồng " + current.getContractNumber() + " bắt đầu từ " + DATE.format(current.getStartDate())
                        + "; hợp đồng mới phải bắt đầu sau ngày này");
            }
        }
        EmploymentContract previous = open.isEmpty() ? null : open.get(0);
        for (EmploymentContract current : open) current.setEndDate(request.startDate().minusDays(1));

        EmploymentContract contract = new EmploymentContract(employee, number, request.contractType().trim(), request.startDate(),
                request.baseSalary(), request.allowance());
        contract.setEndDate(request.endDate());
        EmploymentContract saved = contracts.save(contract);

        String detail = number + " · " + employee.getEmployeeCode() + " · từ " + DATE.format(saved.getStartDate())
                + (previous == null
                ? " · lương cơ bản " + money(saved.getBaseSalary()) + "; phụ cấp " + money(saved.getAllowance())
                : " · thay " + previous.getContractNumber()
                + " · lương cơ bản " + money(previous.getBaseSalary()) + " → " + money(saved.getBaseSalary())
                + "; phụ cấp " + money(previous.getAllowance()) + " → " + money(saved.getAllowance()));
        audit.record("CONTRACT_CREATED", "employment_contracts", saved.getId(), truncate(detail));
        return ContractDtos.ContractResponse.from(saved, LocalDate.now());
    }

    @Transactional
    public ContractDtos.ContractResponse terminate(Long id, ContractDtos.TerminateRequest request) {
        EmploymentContract contract = contracts.findById(id).orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hợp đồng"));
        if (contract.getStatus() != ContractStatus.ACTIVE) throw new ConflictException("Chỉ chấm dứt được hợp đồng đang hiệu lực");
        if (contract.getStartDate().isAfter(LocalDate.now())) {
            throw new ConflictException("Hợp đồng chưa có hiệu lực (bắt đầu " + DATE.format(contract.getStartDate()) + "), không thể chấm dứt");
        }
        if (request.endDate().isBefore(contract.getStartDate())) {
            throw new ConflictException("Ngày chấm dứt không được trước ngày bắt đầu (" + DATE.format(contract.getStartDate()) + ")");
        }
        if (contract.getEndDate() != null && request.endDate().isAfter(contract.getEndDate())) {
            throw new ConflictException("Ngày chấm dứt không được sau ngày kết thúc hiện tại (" + DATE.format(contract.getEndDate()) + ")");
        }
        contract.setStatus(ContractStatus.TERMINATED);
        contract.setEndDate(request.endDate());
        EmploymentContract saved = contracts.save(contract);
        audit.record("CONTRACT_TERMINATED", "employment_contracts", saved.getId(),
                saved.getContractNumber() + " · " + saved.getEmployee().getEmployeeCode() + " · chấm dứt từ " + DATE.format(request.endDate()));
        return ContractDtos.ContractResponse.from(saved, LocalDate.now());
    }

    private static String money(BigDecimal value) {
        return NumberFormat.getIntegerInstance(Locale.forLanguageTag("vi-VN")).format(value) + " ₫";
    }

    private static String truncate(String detail) {
        return detail.length() > 500 ? detail.substring(0, 497) + "..." : detail;
    }
}
