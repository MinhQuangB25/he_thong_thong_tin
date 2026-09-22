SET NAMES utf8mb4;
USE binhan_hrm;

-- Remove only the duplicate department/position rows created by the bad seed.
-- They are deleted only when no employee references them.
DELETE d
FROM departments d
LEFT JOIN employees e ON e.department_id = d.id
WHERE d.id IN (3, 4) AND e.id IS NULL;

DELETE p
FROM positions p
LEFT JOIN employees e ON e.position_id = p.id
WHERE p.id IN (4, 5, 6) AND e.id IS NULL;

-- Repair data created by an earlier seed run without SET NAMES utf8mb4.
UPDATE roles
SET name = CASE code
    WHEN 'ADMIN' THEN 'Quản trị hệ thống'
    WHEN 'HR_MANAGER' THEN 'Quản lý nhân sự'
    WHEN 'TEAM_LEADER' THEN 'Trưởng nhóm'
    WHEN 'EMPLOYEE' THEN 'Nhân viên'
END
WHERE code IN ('ADMIN', 'HR_MANAGER', 'TEAM_LEADER', 'EMPLOYEE');

UPDATE permissions
SET name = CASE code
    WHEN 'EMPLOYEE_READ' THEN 'Xem nhân viên'
    WHEN 'EMPLOYEE_WRITE' THEN 'Quản lý nhân viên'
    WHEN 'LEAVE_REVIEW' THEN 'Duyệt đơn nghỉ'
    WHEN 'PAYROLL_MANAGE' THEN 'Quản lý bảng lương'
END
WHERE code IN ('EMPLOYEE_READ', 'EMPLOYEE_WRITE', 'LEAVE_REVIEW', 'PAYROLL_MANAGE');

UPDATE departments
SET name = 'Đào tạo', description = 'Giảng dạy và quản lý chuyên môn'
WHERE id = 1;
UPDATE departments
SET name = 'Vận hành', description = 'Hành chính và nhân sự'
WHERE id = 2;

UPDATE positions
SET title = 'Giáo viên tiếng Anh'
WHERE id = 1;
UPDATE positions
SET title = 'Chuyên viên nhân sự'
WHERE id = 2;
UPDATE positions
SET title = 'Trưởng nhóm'
WHERE id = 3;

UPDATE employees
SET full_name = 'Lê Thu Hà', education_level = 'Cao học'
WHERE employee_code = 'BA-HR-001';
UPDATE employees
SET full_name = 'Trần Quốc Bảo', education_level = 'Đại học'
WHERE employee_code = 'BA-TL-001';
UPDATE employees
SET full_name = 'Nguyễn Minh Anh', education_level = 'Đại học'
WHERE employee_code = 'BA-EMP-001';

UPDATE users
SET display_name = CASE username
    WHEN 'admin' THEN 'Quản trị hệ thống'
    WHEN 'hr.manager' THEN 'Quản lý nhân sự'
    WHEN 'leader01' THEN 'Trưởng nhóm Anh ngữ'
    WHEN 'employee01' THEN 'Nguyễn Minh Anh'
END
WHERE username IN ('admin', 'hr.manager', 'leader01', 'employee01');

UPDATE employment_contracts
SET contract_type = 'Không xác định thời hạn'
WHERE contract_number IN ('HD-BA-001', 'HD-BA-002', 'HD-BA-003');

UPDATE teams
SET name = 'Nhóm Anh ngữ giao tiếp'
WHERE id = 1;

UPDATE work_shifts
SET name = 'Ca hành chính'
WHERE id = 1;

UPDATE leave_types
SET name = CASE code
    WHEN 'ANNUAL' THEN 'Nghỉ phép năm'
    WHEN 'SICK' THEN 'Nghỉ ốm'
    WHEN 'MATERNITY' THEN 'Nghỉ thai sản'
    WHEN 'RESIGNATION' THEN 'Nghỉ việc'
END
WHERE code IN ('ANNUAL', 'SICK', 'MATERNITY', 'RESIGNATION');

UPDATE leave_requests
SET reason = 'Việc gia đình'
WHERE id = 1;
