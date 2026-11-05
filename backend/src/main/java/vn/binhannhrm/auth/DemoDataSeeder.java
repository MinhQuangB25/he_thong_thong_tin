package vn.binhannhrm.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.binhannhrm.domain.*;
import vn.binhannhrm.payroll.PayrollService;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Configuration
public class DemoDataSeeder {
    @Bean
    CommandLineRunner seedDemoData(RoleRepository roleRepository, AppUserRepository userRepository, PasswordEncoder passwordEncoder,
            DepartmentRepository departmentRepository, PositionRepository positionRepository, EmployeeRepository employeeRepository,
            EmploymentContractRepository contractRepository, LeaveTypeRepository leaveTypeRepository, LeaveRequestRepository leaveRequestRepository, WorkShiftRepository shiftRepository,
            WorkScheduleRepository scheduleRepository, AttendanceRecordRepository attendanceRepository, TeamRepository teamRepository,
            TeamMemberRepository teamMemberRepository, SalarySettingsRepository settingsRepository, PayrollPeriodRepository periodRepository,
            PayrollService payrollService) {
        return args -> {
            for (RoleCode code : RoleCode.values()) roleRepository.findByCode(code).orElseGet(() -> roleRepository.save(new Role(code, roleName(code))));
            Department academic = departmentRepository.findByNameIgnoreCase("Đào tạo").orElseGet(() -> departmentRepository.save(new Department("Đào tạo", "Giảng dạy và quản lý chuyên môn")));
            Department operations = departmentRepository.findByNameIgnoreCase("Vận hành").orElseGet(() -> departmentRepository.save(new Department("Vận hành", "Hành chính và nhân sự")));
            Position teacher = positionRepository.findByTitleIgnoreCase("Giáo viên tiếng Anh").orElseGet(() -> positionRepository.save(new Position("Giáo viên tiếng Anh", BigDecimal.valueOf(500000))));
            Position hr = positionRepository.findByTitleIgnoreCase("Chuyên viên nhân sự").orElseGet(() -> positionRepository.save(new Position("Chuyên viên nhân sự", BigDecimal.valueOf(1000000))));
            Position leaderPosition = positionRepository.findByTitleIgnoreCase("Trưởng nhóm").orElseGet(() -> positionRepository.save(new Position("Trưởng nhóm", BigDecimal.valueOf(1500000))));
            Position operationsAssistant = positionRepository.findByTitleIgnoreCase("Trợ lý vận hành").orElseGet(() -> positionRepository.save(new Position("Trợ lý vận hành", BigDecimal.valueOf(700000))));
            Employee hrEmployee = employee(employeeRepository, "BA-HR-001", "Lê Thu Hà", Gender.FEMALE, "0901000001", "hr.manager@binhan.local", operations, hr, "Cao học");
            Employee leader = employee(employeeRepository, "BA-TL-001", "Trần Quốc Bảo", Gender.MALE, "0901000002", "leader01@binhan.local", academic, leaderPosition, "Đại học");
            Employee staff = employee(employeeRepository, "BA-EMP-001", "Nguyễn Minh Anh", Gender.FEMALE, "0901000003", "employee01@binhan.local", academic, teacher, "Đại học");
            Employee operationsStaff = employee(employeeRepository, "BA-EMP-002", "Phạm Ngọc Lan", Gender.FEMALE, "0901000004", "lan.operations@binhan.local", operations, operationsAssistant, "Cao đẳng");
            operationsStaff.setJoinDate(LocalDate.now().minusYears(4).minusMonths(2)); employeeRepository.save(operationsStaff);
            Employee formerStaff = employee(employeeRepository, "BA-EMP-003", "Võ Hoàng Nam", Gender.MALE, "0901000005", "nam.former@binhan.local", academic, teacher, "Đại học");
            formerStaff.setJoinDate(LocalDate.now().minusYears(5)); formerStaff.setStatus(EmployeeStatus.TERMINATED); formerStaff.setEndDate(LocalDate.now().minusMonths(2)); employeeRepository.save(formerStaff);
            staff.setManager(leader); employeeRepository.save(staff);
            contract(contractRepository, hrEmployee, "HD-BA-001", BigDecimal.valueOf(18000000), BigDecimal.valueOf(1000000));
            contract(contractRepository, leader, "HD-BA-002", BigDecimal.valueOf(22000000), BigDecimal.valueOf(1500000));
            contract(contractRepository, staff, "HD-BA-003", BigDecimal.valueOf(14000000), BigDecimal.valueOf(500000));
            contract(contractRepository, operationsStaff, "HD-BA-004", BigDecimal.valueOf(11000000), BigDecimal.valueOf(300000));
            contract(contractRepository, formerStaff, "HD-BA-005", BigDecimal.valueOf(16000000), BigDecimal.valueOf(700000));
            seedUser(userRepository, roleRepository, passwordEncoder, "admin", "Quản trị hệ thống", RoleCode.ADMIN, null);
            seedUser(userRepository, roleRepository, passwordEncoder, "hr.manager", "Quản lý nhân sự", RoleCode.HR_MANAGER, hrEmployee);
            seedUser(userRepository, roleRepository, passwordEncoder, "leader01", "Trưởng nhóm Anh ngữ", RoleCode.TEAM_LEADER, leader);
            seedUser(userRepository, roleRepository, passwordEncoder, "employee01", "Nguyễn Minh Anh", RoleCode.EMPLOYEE, staff);
            Team team = teamRepository.findAll().stream().findFirst().orElseGet(() -> teamRepository.save(new Team("Nhóm Anh ngữ giao tiếp", leader)));
            if (!teamMemberRepository.existsByTeamIdAndEmployeeId(team.getId(), leader.getId())) teamMemberRepository.save(new TeamMember(team, leader));
            if (!teamMemberRepository.existsByTeamIdAndEmployeeId(team.getId(), staff.getId())) teamMemberRepository.save(new TeamMember(team, staff));
            for (LeaveTypeCode code : LeaveTypeCode.values()) leaveTypeRepository.findByCode(code).orElseGet(() -> leaveTypeRepository.save(new LeaveType(code, leaveName(code), code == LeaveTypeCode.ANNUAL ? 12 : 0)));
            WorkShift shift = shiftRepository.findAll().stream().findFirst().orElseGet(() -> shiftRepository.save(new WorkShift("Ca hành chính", LocalTime.of(8, 0), LocalTime.of(17, 0), BigDecimal.valueOf(1.5))));
            LocalDate today = LocalDate.now();
            for (Employee demoEmployee : new Employee[]{staff, leader, hrEmployee, operationsStaff}) {
                for (int day = 1; day <= 3; day++) {
                    LocalDate workDate = today.withDayOfMonth(Math.min(day, today.lengthOfMonth()));
                    if (!scheduleRepository.existsByEmployeeIdAndWorkDate(demoEmployee.getId(), workDate)) scheduleRepository.save(new WorkSchedule(demoEmployee, shift, workDate));
                    if (!attendanceRepository.existsByEmployeeIdAndAttendanceDate(demoEmployee.getId(), workDate)) {
                        AttendanceRecord record = new AttendanceRecord(demoEmployee, workDate, AttendanceStatus.PRESENT);
                        record.setCheckIn(LocalTime.of(8, 0)); record.setCheckOut(LocalTime.of(17, 30)); record.setWorkedHours(BigDecimal.valueOf(8)); record.setOvertimeHours(BigDecimal.valueOf(0.5)); attendanceRepository.save(record);
                    }
                }
            }
            if (settingsRepository.findTopByOrderByEffectiveFromDesc().isEmpty()) settingsRepository.save(new SalarySettings(26, BigDecimal.valueOf(1.5), today.withDayOfMonth(1)));
            LeaveType annualLeave = leaveTypeRepository.findByCode(LeaveTypeCode.ANNUAL).orElseThrow();
            LocalDate leaveFrom = today.withDayOfMonth(Math.max(1, today.getDayOfMonth() - 2));
            LocalDate leaveTo = today.withDayOfMonth(today.lengthOfMonth());
            boolean hasApprovedLeave = leaveRequestRepository.findAll().stream().anyMatch(request -> request.getEmployee().getId().equals(staff.getId()) && request.getStatus() == LeaveStatus.APPROVED);
            if (!hasApprovedLeave) {
                LeaveRequest leave = new LeaveRequest(staff, annualLeave, leaveFrom, leaveTo, "Nghỉ phép cá nhân - dữ liệu demo");
                leave.setStatus(LeaveStatus.APPROVED); leave.setReviewer(hrEmployee); leave.setReviewedAt(java.time.LocalDateTime.now()); leaveRequestRepository.save(leave);
            }
            var ym = java.time.YearMonth.from(today);
            PayrollPeriod period = periodRepository.findByMonthAndYear(ym.getMonthValue(), ym.getYear()).orElseGet(() -> periodRepository.save(new PayrollPeriod(ym.getMonthValue(), ym.getYear(), ym.atDay(1), ym.atEndOfMonth())));
            if (period.getStatus() == PayrollStatus.DRAFT) payrollService.generate(period.getId());
            var previousYm = ym.minusMonths(1);
            PayrollPeriod previousPeriod = periodRepository.findByMonthAndYear(previousYm.getMonthValue(), previousYm.getYear()).orElseGet(() -> periodRepository.save(new PayrollPeriod(previousYm.getMonthValue(), previousYm.getYear(), previousYm.atDay(1), previousYm.atEndOfMonth())));
            if (previousPeriod.getStatus() == PayrollStatus.DRAFT) payrollService.generate(previousPeriod.getId());
        };
    }
    private Employee employee(EmployeeRepository repository, String code, String name, Gender gender, String phone, String email, Department department, Position position, String education) {
        return repository.findByEmployeeCode(code).orElseGet(() -> { Employee employee = new Employee(code, name, gender, phone, email, LocalDate.now().minusMonths(6), department, position); employee.setEducationLevel(education); return repository.save(employee); });
    }
    private void contract(EmploymentContractRepository repository, Employee employee, String number, BigDecimal salary, BigDecimal allowance) {
        if (repository.existsByContractNumber(number)) return;
        EmploymentContract contract = new EmploymentContract(employee, number, "Không xác định thời hạn", employee.getJoinDate(), salary, allowance);
        // A seeded former employee gets a closed contract, matching what "Cho nghỉ việc" does at runtime.
        if (employee.getStatus() == EmployeeStatus.TERMINATED) { contract.setStatus(vn.binhannhrm.domain.ContractStatus.TERMINATED); contract.setEndDate(employee.getEndDate()); }
        repository.save(contract);
    }
    private void seedUser(AppUserRepository users, RoleRepository roles, PasswordEncoder encoder, String username, String displayName, RoleCode roleCode, Employee employee) {
        AppUser user = users.findByUsername(username).orElseGet(() -> new AppUser(username, encoder.encode("password"), displayName)); user.addRole(roles.findByCode(roleCode).orElseThrow()); if (employee != null) user.setEmployee(employee); users.save(user);
    }
    private String roleName(RoleCode code) { return switch (code) { case ADMIN -> "Quản trị hệ thống"; case HR_MANAGER -> "Quản lý nhân sự"; case TEAM_LEADER -> "Trưởng nhóm"; case EMPLOYEE -> "Nhân viên"; }; }
    private String leaveName(LeaveTypeCode code) { return switch (code) { case ANNUAL -> "Nghỉ phép năm"; case SICK -> "Nghỉ ốm"; case MATERNITY -> "Nghỉ thai sản"; case RESIGNATION -> "Nghỉ việc"; }; }
}
