CREATE DATABASE IF NOT EXISTS binhan_hrm CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE binhan_hrm;

CREATE TABLE IF NOT EXISTS roles (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL
);
CREATE TABLE IF NOT EXISTS departments (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255),
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS positions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL UNIQUE,
  default_allowance DECIMAL(14,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS employees (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_code VARCHAR(30) NOT NULL UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  gender VARCHAR(20) NOT NULL,
  national_id VARCHAR(20) UNIQUE,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  address VARCHAR(255),
  education_level VARCHAR(120),
  join_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  department_id BIGINT NOT NULL,
  position_id BIGINT NOT NULL,
  manager_id BIGINT,
  CONSTRAINT fk_employee_department FOREIGN KEY (department_id) REFERENCES departments(id),
  CONSTRAINT fk_employee_position FOREIGN KEY (position_id) REFERENCES positions(id),
  CONSTRAINT fk_employee_manager FOREIGN KEY (manager_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  employee_id BIGINT UNIQUE,
  CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, user_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id)
);
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT NOT NULL,
  permission_id BIGINT NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);
CREATE TABLE IF NOT EXISTS permissions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL
);
CREATE TABLE IF NOT EXISTS employment_contracts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  contract_number VARCHAR(50) NOT NULL UNIQUE,
  contract_type VARCHAR(80) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  base_salary DECIMAL(14,2) NOT NULL,
  allowance DECIMAL(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS teams (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  leader_id BIGINT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (leader_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS team_members (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE KEY uk_team_member (team_id, employee_id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS work_shifts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  overtime_rate DECIMAL(5,2) NOT NULL DEFAULT 1.5,
  active BOOLEAN NOT NULL DEFAULT TRUE
);
CREATE TABLE IF NOT EXISTS work_schedules (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  shift_id BIGINT NOT NULL,
  work_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  note VARCHAR(255),
  UNIQUE KEY uk_schedule_date (employee_id, work_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (shift_id) REFERENCES work_shifts(id)
);
CREATE TABLE IF NOT EXISTS attendance_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  schedule_id BIGINT,
  attendance_date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  worked_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(6,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  UNIQUE KEY uk_attendance_date (employee_id, attendance_date),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (schedule_id) REFERENCES work_schedules(id)
);
CREATE TABLE IF NOT EXISTS leave_types (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(30) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  annual_days INT NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS leave_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id BIGINT NOT NULL,
  leave_type_id BIGINT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  reason VARCHAR(500) NOT NULL,
  submitted_at DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewer_id BIGINT,
  reviewed_at DATETIME,
  rejection_reason VARCHAR(255),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id),
  FOREIGN KEY (reviewer_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS payroll_periods (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payroll_month INT NOT NULL,
  payroll_year INT NOT NULL,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  UNIQUE KEY uk_payroll_period (payroll_month, payroll_year)
);
CREATE TABLE IF NOT EXISTS payrolls (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  period_id BIGINT NOT NULL,
  employee_id BIGINT NOT NULL,
  base_salary DECIMAL(14,2) NOT NULL,
  worked_days DECIMAL(8,2) NOT NULL DEFAULT 0,
  overtime_hours DECIMAL(8,2) NOT NULL DEFAULT 0,
  overtime_pay DECIMAL(14,2) NOT NULL DEFAULT 0,
  allowances DECIMAL(14,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(14,2) NOT NULL DEFAULT 0,
  net_salary DECIMAL(14,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  UNIQUE KEY uk_payroll_employee (period_id, employee_id),
  FOREIGN KEY (period_id) REFERENCES payroll_periods(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);
CREATE TABLE IF NOT EXISTS payroll_items (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  payroll_id BIGINT NOT NULL,
  item_name VARCHAR(100) NOT NULL,
  item_type VARCHAR(20) NOT NULL,
  amount DECIMAL(14,2) NOT NULL,
  note VARCHAR(255),
  FOREIGN KEY (payroll_id) REFERENCES payrolls(id)
);
CREATE TABLE IF NOT EXISTS salary_settings (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  standard_work_days INT NOT NULL,
  overtime_multiplier DECIMAL(5,2) NOT NULL,
  effective_from DATE NOT NULL
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_username VARCHAR(60) NOT NULL,
  action VARCHAR(80) NOT NULL,
  entity_name VARCHAR(80) NOT NULL,
  entity_id BIGINT,
  created_at DATETIME NOT NULL,
  detail VARCHAR(500)
);
