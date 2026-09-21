export type Role = 'ADMIN' | 'HR_MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE'
export type User = { username: string; displayName: string; roles: Role[] }
export type Employee = { id: number; employeeCode: string; fullName: string; gender: string; phone: string; email: string; educationLevel?: string; joinDate: string; status: string; departmentName: string; positionTitle: string }
export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
export type Leave = { id: number; employeeId: number; employeeName: string; leaveType: string; fromDate: string; toDate: string; reason: string; status: string; rejectionReason?: string }
export type Attendance = { id: number; employeeId: number; employeeName: string; attendanceDate: string; checkIn?: string; checkOut?: string; workedHours: number; overtimeHours: number; status: string }
export type Payroll = { id: number; periodId: number; month: number; year: number; employeeId: number; employeeName: string; baseSalary: number; workedDays: number; overtimeHours: number; overtimePay: number; allowances: number; deductions: number; netSalary: number; status: string }
