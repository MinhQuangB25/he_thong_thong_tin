package vn.binhannhrm.people;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.common.ResourceNotFoundException;
import vn.binhannhrm.audit.AuditLogService;
import vn.binhannhrm.domain.Department;
import vn.binhannhrm.domain.DepartmentRepository;
import vn.binhannhrm.domain.Employee;
import vn.binhannhrm.domain.EmployeeRepository;
import vn.binhannhrm.domain.EmployeeStatus;
import vn.binhannhrm.domain.ContractStatus;
import vn.binhannhrm.domain.EmploymentContractRepository;
import vn.binhannhrm.domain.Position;
import vn.binhannhrm.domain.PositionRepository;

import java.util.Collection;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final EmploymentContractRepository contractRepository;
    private final AuditLogService audit;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository, PositionRepository positionRepository,
                           EmploymentContractRepository contractRepository, AuditLogService audit) {
        this.employeeRepository = employeeRepository; this.departmentRepository = departmentRepository; this.positionRepository = positionRepository;
        this.contractRepository = contractRepository; this.audit = audit;
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<EmployeeDtos.EmployeeResponse> list(String search, Pageable pageable) {
        var page = search == null || search.isBlank()
                ? employeeRepository.findAll(pageable)
                : employeeRepository.findByFullNameContainingIgnoreCaseOrEmployeeCodeContainingIgnoreCase(search, search, pageable);
        return page.map(EmployeeDtos.EmployeeResponse::from);
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<EmployeeDtos.EmployeeResponse> list(String search, Pageable pageable, Collection<Long> visibleEmployeeIds) {
        if (visibleEmployeeIds == null) return list(search, pageable);
        if (visibleEmployeeIds.isEmpty()) return org.springframework.data.domain.Page.empty(pageable);
        var page = search == null || search.isBlank()
                ? employeeRepository.findByIdIn(visibleEmployeeIds, pageable)
                : employeeRepository.searchByIds(visibleEmployeeIds, search, pageable);
        return page.map(EmployeeDtos.EmployeeResponse::from);
    }

    @Transactional(readOnly = true)
    public EmployeeDtos.EmployeeResponse get(Long id) {
        return EmployeeDtos.EmployeeResponse.from(find(id));
    }

    @Transactional(readOnly = true)
    public org.springframework.data.domain.Page<EmployeeDtos.EmployeeResponse> list(
            String search, EmployeeStatus status, String department, String position,
            Pageable pageable, Collection<Long> visibleEmployeeIds) {
        if (visibleEmployeeIds != null && visibleEmployeeIds.isEmpty()) return org.springframework.data.domain.Page.empty(pageable);
        org.springframework.data.jpa.domain.Specification<Employee> filter = (root, query, cb) -> {
            var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
            if (visibleEmployeeIds != null) predicates.add(root.get("id").in(visibleEmployeeIds));
            if (search != null && !search.isBlank()) {
                String pattern = "%" + search.trim().toLowerCase(java.util.Locale.ROOT).replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
                predicates.add(cb.or(cb.like(cb.lower(root.get("fullName")), pattern, '\\'), cb.like(cb.lower(root.get("employeeCode")), pattern, '\\')));
            }
            if (status != null) predicates.add(cb.equal(root.get("status"), status));
            if (department != null && !department.isBlank()) predicates.add(cb.equal(root.get("department").get("name"), department));
            if (position != null && !position.isBlank()) predicates.add(cb.equal(root.get("position").get("title"), position));
            return cb.and(predicates.toArray(jakarta.persistence.criteria.Predicate[]::new));
        };
        return employeeRepository.findAll(filter, pageable).map(EmployeeDtos.EmployeeResponse::from);
    }

    @Transactional
    public EmployeeDtos.EmployeeResponse create(EmployeeDtos.CreateEmployeeRequest request) {
        if (employeeRepository.findByEmployeeCode(request.employeeCode()).isPresent()) {
            throw new ConflictException("Mã nhân viên đã tồn tại");
        }
        if (employeeRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ConflictException("Email nhân viên đã tồn tại");
        }
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức vụ"));
        Employee manager = request.managerId() == null ? null : find(request.managerId());
        Employee employee = new Employee(
                request.employeeCode(), request.fullName(), request.gender(), request.phone(), request.email(),
                request.joinDate(), department, position
        );
        employee.setNationalId(request.nationalId());
        employee.setAddress(request.address());
        employee.setEducationLevel(request.educationLevel());
        employee.setManager(manager);
        Employee saved = employeeRepository.save(employee); audit.record("EMPLOYEE_CREATED", "employees", saved.getId(), saved.getEmployeeCode()); return EmployeeDtos.EmployeeResponse.from(saved);
    }

    @Transactional
    public EmployeeDtos.EmployeeResponse update(Long id, EmployeeDtos.UpdateEmployeeRequest request) {
        Employee employee = find(id);
        if (employee.getStatus() == EmployeeStatus.TERMINATED) {
            throw new ConflictException("Nhân viên đã nghỉ việc, hồ sơ được giữ nguyên để lưu lịch sử");
        }
        employeeRepository.findByEmailIgnoreCase(request.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new ConflictException("Email nhân viên đã tồn tại"); });
        String nationalId = blankToNull(request.nationalId());
        if (nationalId != null) {
            employeeRepository.findByNationalId(nationalId)
                    .filter(existing -> !existing.getId().equals(id))
                    .ifPresent(existing -> { throw new ConflictException("Số CCCD đã tồn tại"); });
        }
        Department department = departmentRepository.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phòng ban"));
        Position position = positionRepository.findById(request.positionId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chức vụ"));

        // Audit names changed fields; organisation moves keep old -> new, personal values are not copied into the log.
        java.util.List<String> changes = new java.util.ArrayList<>();
        String fullName = request.fullName().trim();
        String email = request.email().trim();
        String phone = request.phone().trim();
        String address = blankToNull(request.address());
        String educationLevel = blankToNull(request.educationLevel());
        if (!fullName.equals(employee.getFullName())) changes.add("họ tên");
        if (request.gender() != employee.getGender()) changes.add("giới tính");
        if (!java.util.Objects.equals(nationalId, employee.getNationalId())) changes.add("CCCD");
        if (!phone.equals(employee.getPhone())) changes.add("số điện thoại");
        if (!email.equalsIgnoreCase(employee.getEmail())) changes.add("email");
        if (!java.util.Objects.equals(address, employee.getAddress())) changes.add("địa chỉ");
        if (!java.util.Objects.equals(educationLevel, employee.getEducationLevel())) changes.add("trình độ");
        if (!request.joinDate().equals(employee.getJoinDate())) changes.add("ngày vào làm");
        if (!java.util.Objects.equals(department.getId(), employee.getDepartment().getId())) {
            changes.add("phòng ban: " + employee.getDepartment().getName() + " → " + department.getName());
        }
        if (!java.util.Objects.equals(position.getId(), employee.getPosition().getId())) {
            changes.add("chức vụ: " + employee.getPosition().getTitle() + " → " + position.getTitle());
        }
        if (changes.isEmpty()) return EmployeeDtos.EmployeeResponse.from(employee);

        employee.setFullName(fullName);
        employee.setGender(request.gender());
        employee.setNationalId(nationalId);
        employee.setPhone(phone);
        employee.setEmail(email);
        employee.setAddress(address);
        employee.setEducationLevel(educationLevel);
        employee.setJoinDate(request.joinDate());
        employee.setDepartment(department);
        employee.setPosition(position);
        Employee saved = employeeRepository.save(employee);
        String detail = saved.getEmployeeCode() + ": " + String.join("; ", changes);
        audit.record("EMPLOYEE_UPDATED", "employees", saved.getId(), detail.length() > 500 ? detail.substring(0, 497) + "..." : detail);
        return EmployeeDtos.EmployeeResponse.from(saved);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Transactional
    public EmployeeDtos.EmployeeResponse updateOwnProfile(Long id, EmployeeDtos.UpdateProfileRequest request) {
        Employee employee = find(id);
        if ((request.expectedEmail() != null && !request.expectedEmail().equals(employee.getEmail()))
                || (request.expectedPhone() != null && !request.expectedPhone().equals(employee.getPhone()))) {
            throw new ConflictException("Hồ sơ đã thay đổi kể từ khi tạo bản nháp. Hãy kiểm tra lại.");
        }
        employeeRepository.findByEmailIgnoreCase(request.email())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> { throw new ConflictException("Email nhân viên đã tồn tại"); });
        employee.setPhone(request.phone());
        employee.setEmail(request.email());
        Employee saved = employeeRepository.save(employee);
        audit.record("EMPLOYEE_PROFILE_UPDATED", "employees", saved.getId(), saved.getEmployeeCode());
        return EmployeeDtos.EmployeeResponse.from(saved);
    }

    @Transactional
    public EmployeeDtos.EmployeeResponse terminate(Long id) {
        Employee employee = find(id);
        if (employee.getStatus() == EmployeeStatus.TERMINATED) {
            throw new ConflictException("Nhân viên đã nghỉ việc từ trước; ngày nghỉ việc được giữ nguyên");
        }
        java.time.LocalDate endDate = java.time.LocalDate.now();
        employee.setStatus(EmployeeStatus.TERMINATED);
        employee.setEndDate(endDate);
        Employee saved = employeeRepository.save(employee);
        audit.record("EMPLOYEE_TERMINATED", "employees", saved.getId(), saved.getEmployeeCode());
        closeOpenContracts(saved, endDate);
        return EmployeeDtos.EmployeeResponse.from(saved);
    }

    /**
     * Ends every contract still open on the termination date so payroll, reports and the contract screen
     * stop treating it as in force. A contract signed for a later start is cancelled: its end date (the
     * termination date) falls before its start, so no date range ever selects it.
     */
    private void closeOpenContracts(Employee employee, java.time.LocalDate endDate) {
        java.time.format.DateTimeFormatter format = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
        for (var contract : contractRepository.findByEmployeeIdOrderByStartDateDesc(employee.getId())) {
            if (contract.getStatus() != ContractStatus.ACTIVE) continue;
            if (contract.getEndDate() != null && contract.getEndDate().isBefore(endDate)) continue;
            boolean upcoming = contract.getStartDate().isAfter(endDate);
            contract.setStatus(ContractStatus.TERMINATED);
            contract.setEndDate(endDate);
            contractRepository.save(contract);
            audit.record("CONTRACT_TERMINATED", "employment_contracts", contract.getId(),
                    contract.getContractNumber() + " · " + employee.getEmployeeCode() + " · "
                            + (upcoming ? "hủy (chưa hiệu lực)" : "chấm dứt từ " + format.format(endDate)) + " do cho nghỉ việc");
        }
    }

    public Employee find(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
    }
}
