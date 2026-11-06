SET NAMES utf8mb4;
USE binhan_hrm;

INSERT IGNORE INTO roles (id, code, name) VALUES
 (1, 'ADMIN', 'Quản trị hệ thống'),
 (2, 'HR_MANAGER', 'Quản lý nhân sự'),
 (3, 'TEAM_LEADER', 'Trưởng nhóm'),
 (4, 'EMPLOYEE', 'Nhân viên');
INSERT IGNORE INTO permissions (id, code, name) VALUES
 (1, 'EMPLOYEE_READ', 'Xem nhân viên'), (2, 'EMPLOYEE_WRITE', 'Quản lý nhân viên'),
 (3, 'LEAVE_REVIEW', 'Duyệt đơn nghỉ'), (4, 'PAYROLL_MANAGE', 'Quản lý bảng lương');
INSERT IGNORE INTO departments (id, name, description, active) VALUES
 (1, 'Đào tạo', 'Giảng dạy và quản lý chuyên môn', TRUE),
 (2, 'Vận hành', 'Hành chính và nhân sự', TRUE);
INSERT IGNORE INTO positions (id, title, default_allowance, active) VALUES
 (1, 'Giáo viên tiếng Anh', 500000, TRUE),
 (2, 'Chuyên viên nhân sự', 1000000, TRUE),
 (3, 'Trưởng nhóm', 1500000, TRUE);
INSERT IGNORE INTO employees (id, employee_code, full_name, gender, phone, email, education_level, join_date, status, department_id, position_id) VALUES
 (1, 'BA-HR-001', 'Lê Thu Hà', 'FEMALE', '0901000001', 'hr.manager@binhan.local', 'Cao học', DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 'ACTIVE', 2, 2),
 (2, 'BA-TL-001', 'Trần Quốc Bảo', 'MALE', '0901000002', 'leader01@binhan.local', 'Đại học', DATE_SUB(CURDATE(), INTERVAL 15 MONTH), 'ACTIVE', 1, 3),
 (3, 'BA-EMP-001', 'Nguyễn Minh Anh', 'FEMALE', '0901000003', 'employee01@binhan.local', 'Đại học', DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 'ACTIVE', 1, 1);
UPDATE employees SET manager_id = 2 WHERE id = 3;
INSERT IGNORE INTO users (id, username, password_hash, display_name, status, employee_id) VALUES
 (1, 'admin', '$2a$12$imBz2P6LVFfbTV2OWPXnJ.bXLL0z18/GqTX2iy9VIqUGKZOPiKJja', 'Quản trị hệ thống', 'ACTIVE', NULL),
 (2, 'hr.manager', '$2a$12$imBz2P6LVFfbTV2OWPXnJ.bXLL0z18/GqTX2iy9VIqUGKZOPiKJja', 'Quản lý nhân sự', 'ACTIVE', 1),
 (3, 'leader01', '$2a$12$imBz2P6LVFfbTV2OWPXnJ.bXLL0z18/GqTX2iy9VIqUGKZOPiKJja', 'Trưởng nhóm Anh ngữ', 'ACTIVE', 2),
 (4, 'employee01', '$2a$12$imBz2P6LVFfbTV2OWPXnJ.bXLL0z18/GqTX2iy9VIqUGKZOPiKJja', 'Nguyễn Minh Anh', 'ACTIVE', 3);
INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1), (2, 2), (3, 3), (4, 4);
INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1,1),(1,2),(1,3),(1,4),(2,1),(2,2),(2,3),(2,4),(3,1),(4,1);
INSERT IGNORE INTO employment_contracts (id, employee_id, contract_number, contract_type, start_date, base_salary, allowance, status) VALUES
 (1, 1, 'HD-BA-001', 'Không xác định thời hạn', DATE_SUB(CURDATE(), INTERVAL 18 MONTH), 18000000, 1000000, 'ACTIVE'),
 (2, 2, 'HD-BA-002', 'Không xác định thời hạn', DATE_SUB(CURDATE(), INTERVAL 15 MONTH), 22000000, 1500000, 'ACTIVE'),
 (3, 3, 'HD-BA-003', 'Không xác định thời hạn', DATE_SUB(CURDATE(), INTERVAL 6 MONTH), 14000000, 500000, 'ACTIVE');
INSERT IGNORE INTO teams (id, name, leader_id, active) VALUES (1, 'Nhóm Anh ngữ giao tiếp', 2, TRUE);
INSERT IGNORE INTO team_members (team_id, employee_id, active) VALUES (1,2,TRUE),(1,3,TRUE);
INSERT IGNORE INTO work_shifts (id, name, start_time, end_time, overtime_rate, active) VALUES (1, 'Ca hành chính', '08:00:00', '17:00:00', 1.5, TRUE);
INSERT IGNORE INTO work_schedules (id, employee_id, shift_id, work_date, status, note) VALUES
 (1, 3, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'COMPLETED', 'Demo'),
 (2, 3, 1, DATE_SUB(CURDATE(), INTERVAL 1 DAY), 'COMPLETED', 'Demo'),
 (3, 3, 1, CURDATE(), 'COMPLETED', 'Demo');
INSERT IGNORE INTO attendance_records (employee_id, schedule_id, attendance_date, check_in, check_out, worked_hours, overtime_hours, status) VALUES
 (3, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:00:00', '17:30:00', 8, .5, 'PRESENT'),
 (3, 2, DATE_SUB(CURDATE(), INTERVAL 1 DAY), '08:05:00', '17:30:00', 8, .5, 'PRESENT'),
 (3, 3, CURDATE(), '08:00:00', '17:30:00', 8, .5, 'PRESENT');
INSERT IGNORE INTO leave_types (id, code, name, annual_days) VALUES
 (1, 'ANNUAL', 'Nghỉ phép năm', 12), (2, 'SICK', 'Nghỉ ốm', 0),
 (3, 'MATERNITY', 'Nghỉ thai sản', 0), (4, 'RESIGNATION', 'Nghỉ việc', 0);
INSERT IGNORE INTO leave_requests (id, employee_id, leave_type_id, from_date, to_date, reason, submitted_at, status) VALUES
 (1, 3, 1, DATE_ADD(CURDATE(), INTERVAL 5 DAY), DATE_ADD(CURDATE(), INTERVAL 6 DAY), 'Việc gia đình', NOW(), 'PENDING');
INSERT INTO salary_settings (standard_work_days, overtime_multiplier, effective_from)
 SELECT 26, 1.5, DATE_FORMAT(CURDATE(), '%Y-%m-01')
 WHERE NOT EXISTS (SELECT 1 FROM salary_settings);
INSERT IGNORE INTO payroll_periods (id, payroll_month, payroll_year, from_date, to_date, status)
 VALUES (1, MONTH(CURDATE()), YEAR(CURDATE()), DATE_FORMAT(CURDATE(), '%Y-%m-01'), LAST_DAY(CURDATE()), 'DRAFT');
INSERT IGNORE INTO payrolls (period_id, employee_id, base_salary, worked_days, overtime_hours, overtime_pay, allowances, deductions, net_salary, status)
 SELECT 1, 3, 14000000, 3, 1.5, 100961.54, 500000, 0, 2212500.00, 'DRAFT'
 WHERE EXISTS (SELECT 1 FROM payroll_periods WHERE id = 1);

-- Additional demo data for reports, soft termination, team scope and annual payroll.
INSERT IGNORE INTO positions (id, title, default_allowance, active) VALUES
 (4, 'Trợ lý vận hành', 700000, TRUE);
INSERT IGNORE INTO employees (id, employee_code, full_name, gender, phone, email, education_level, join_date, status, end_date, department_id, position_id) VALUES
 (4, 'BA-EMP-002', 'Phạm Ngọc Lan', 'FEMALE', '0901000004', 'lan.operations@binhan.local', 'Cao đẳng', DATE_SUB(CURDATE(), INTERVAL 50 MONTH), 'ACTIVE', NULL, 2, 4),
 (5, 'BA-EMP-003', 'Võ Hoàng Nam', 'MALE', '0901000005', 'nam.former@binhan.local', 'Đại học', DATE_SUB(CURDATE(), INTERVAL 5 YEAR), 'TERMINATED', DATE_SUB(CURDATE(), INTERVAL 2 MONTH), 1, 1);
INSERT IGNORE INTO employment_contracts (id, employee_id, contract_number, contract_type, start_date, base_salary, allowance, status) VALUES
 (4, 4, 'HD-BA-004', 'Không xác định thời hạn', DATE_SUB(CURDATE(), INTERVAL 50 MONTH), 11000000, 300000, 'ACTIVE'),
 (5, 5, 'HD-BA-005', 'Không xác định thời hạn', DATE_SUB(CURDATE(), INTERVAL 5 YEAR), 16000000, 700000, 'TERMINATED');
UPDATE employment_contracts SET end_date = DATE_SUB(CURDATE(), INTERVAL 2 MONTH) WHERE id = 5 AND end_date IS NULL;
INSERT IGNORE INTO leave_requests (id, employee_id, leave_type_id, from_date, to_date, reason, submitted_at, status, reviewer_id, reviewed_at)
 VALUES (2, 3, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), LAST_DAY(CURDATE()), 'Nghỉ phép cá nhân - dữ liệu demo', NOW(), 'APPROVED', 1, NOW());
INSERT IGNORE INTO work_schedules (id, employee_id, shift_id, work_date, status, note) VALUES
 (4, 1, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'COMPLETED', 'Demo HR'),
 (5, 2, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'COMPLETED', 'Demo trưởng nhóm'),
 (6, 4, 1, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'COMPLETED', 'Demo vận hành');
INSERT IGNORE INTO attendance_records (employee_id, schedule_id, attendance_date, check_in, check_out, worked_hours, overtime_hours, status) VALUES
 (1, 4, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:00:00', '17:30:00', 8, .5, 'PRESENT'),
 (2, 5, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:00:00', '17:30:00', 8, .5, 'PRESENT'),
 (4, 6, DATE_SUB(CURDATE(), INTERVAL 2 DAY), '08:10:00', '18:00:00', 8, 1, 'LATE');
INSERT IGNORE INTO payroll_periods (id, payroll_month, payroll_year, from_date, to_date, status)
 VALUES (2, MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01'), LAST_DAY(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)), 'DRAFT');
INSERT IGNORE INTO payrolls (period_id, employee_id, base_salary, worked_days, overtime_hours, overtime_pay, allowances, deductions, net_salary, status) VALUES
 (1, 1, 18000000, 3, 1.5, 194711.54, 1000000, 0, 3277792.31, 'DRAFT'),
 (1, 2, 22000000, 3, 1.5, 237740.38, 1500000, 0, 4273125.00, 'DRAFT'),
 (1, 4, 11000000, 3, 1.5, 118990.38, 300000, 0, 1681682.69, 'DRAFT'),
 (2, 1, 18000000, 20, 0, 0, 1000000, 0, 14846153.85, 'DRAFT'),
 (2, 2, 22000000, 20, 0, 0, 1500000, 0, 18419230.77, 'DRAFT'),
 (2, 3, 14000000, 20, 0, 0, 500000, 0, 11230769.23, 'DRAFT'),
 (2, 4, 11000000, 20, 0, 0, 300000, 0, 8769230.77, 'DRAFT');
