package vn.binhannhrm.people;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import vn.binhannhrm.common.ConflictException;
import vn.binhannhrm.domain.*;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrganizationServiceTest {
    @Mock DepartmentRepository departments;
    @Mock PositionRepository positions;
    @Mock EmployeeRepository employees;
    @Mock EmploymentContractRepository contracts;
    private OrganizationService service;

    @BeforeEach
    void setUp() { service = new OrganizationService(departments, positions, employees, contracts); }

    @Test
    void departmentsAndPositionsAreListed() {
        when(departments.findAll()).thenReturn(List.of(new Department("Đào tạo", "Giảng dạy")));
        when(positions.findAll()).thenReturn(List.of(new Position("Giáo viên", new BigDecimal("500000"))));

        assertEquals("Đào tạo", service.listDepartments().get(0).name());
        assertEquals(new BigDecimal("500000"), service.listPositions().get(0).defaultAllowance());
    }

    @Test
    void duplicateNamesAreRejectedCaseInsensitively() {
        when(departments.existsByNameIgnoreCase("đào tạo")).thenReturn(true);
        when(positions.existsByTitleIgnoreCase("giáo viên")).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.createDepartment(new OrganizationDtos.DepartmentRequest("đào tạo", null)));
        assertThrows(ConflictException.class, () -> service.createPosition(new OrganizationDtos.PositionRequest("giáo viên", BigDecimal.ZERO)));
        verify(departments, never()).save(any());
        verify(positions, never()).save(any());
    }

    @Test
    void newDepartmentAndPositionAreSaved() {
        when(departments.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(positions.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var department = service.createDepartment(new OrganizationDtos.DepartmentRequest("Tuyển sinh", "Tư vấn khóa học"));
        var position = service.createPosition(new OrganizationDtos.PositionRequest("Tư vấn viên", new BigDecimal("300000")));

        assertEquals("Tuyển sinh", department.name());
        assertEquals("Tư vấn khóa học", department.description());
        assertEquals("Tư vấn viên", position.title());
    }
}
