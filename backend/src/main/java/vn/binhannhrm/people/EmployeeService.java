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
import vn.binhannhrm.domain.Position;
import vn.binhannhrm.domain.PositionRepository;

import java.util.Collection;

@Service
public class EmployeeService {
    private final EmployeeRepository employeeRepository;
    private final DepartmentRepository departmentRepository;
    private final PositionRepository positionRepository;
    private final AuditLogService audit;

    public EmployeeService(EmployeeRepository employeeRepository, DepartmentRepository departmentRepository, PositionRepository positionRepository, AuditLogService audit) {
        this.employeeRepository = employeeRepository; this.departmentRepository = departmentRepository; this.positionRepository = positionRepository; this.audit = audit;
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
    public EmployeeDtos.EmployeeResponse updateOwnProfile(Long id, EmployeeDtos.UpdateProfileRequest request) {
        Employee employee = find(id);
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
        employee.setStatus(EmployeeStatus.TERMINATED);
        employee.setEndDate(java.time.LocalDate.now());
        Employee saved = employeeRepository.save(employee);
        audit.record("EMPLOYEE_TERMINATED", "employees", saved.getId(), saved.getEmployeeCode());
        return EmployeeDtos.EmployeeResponse.from(saved);
    }

    public Employee find(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhân viên"));
    }
}
