package vn.binhannhrm.people;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.domain.Department;
import vn.binhannhrm.domain.DepartmentRepository;
import vn.binhannhrm.domain.EmployeeRepository;
import vn.binhannhrm.domain.EmploymentContractRepository;
import vn.binhannhrm.domain.Position;
import vn.binhannhrm.domain.PositionRepository;

import java.util.List;

@Service
public class OrganizationService {
    private final DepartmentRepository departments;
    private final PositionRepository positions;
    private final EmployeeRepository employees;
    private final EmploymentContractRepository contracts;
    public OrganizationService(DepartmentRepository departments, PositionRepository positions,
                               EmployeeRepository employees, EmploymentContractRepository contracts) {
        this.departments = departments; this.positions = positions; this.employees = employees; this.contracts = contracts;
    }
    @Transactional(readOnly = true)
    public List<OrganizationDtos.DepartmentResponse> listDepartments() { return departments.findAll().stream().map(OrganizationDtos.DepartmentResponse::from).toList(); }
    @Transactional(readOnly = true)
    public List<OrganizationDtos.PositionResponse> listPositions() { return positions.findAll().stream().map(OrganizationDtos.PositionResponse::from).toList(); }
    @Transactional
    public OrganizationDtos.DepartmentResponse createDepartment(OrganizationDtos.DepartmentRequest request) {
        if (departments.existsByNameIgnoreCase(request.name())) throw new ConflictException("Phòng ban đã tồn tại");
        return OrganizationDtos.DepartmentResponse.from(departments.save(new Department(request.name(), request.description())));
    }
    @Transactional
    public OrganizationDtos.PositionResponse createPosition(OrganizationDtos.PositionRequest request) {
        if (positions.existsByTitleIgnoreCase(request.title())) throw new ConflictException("Chức vụ đã tồn tại");
        return OrganizationDtos.PositionResponse.from(positions.save(new Position(request.title(), request.defaultAllowance())));
    }
}
