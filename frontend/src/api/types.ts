export type Role = 'ADMIN' | 'HR_MANAGER' | 'TEAM_LEADER' | 'EMPLOYEE'
export type User = { username: string; displayName: string; roles: Role[] }
export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED'
export type AdminAccount = { id: number; username: string; displayName: string; status: AccountStatus; roles: Role[]; employeeId: number | null }
export type AuditLog = { id: number; actorUsername: string; action: string; entityName: string; entityId: number | null; createdAt: string; detail?: string }
export type Employee = { id: number; employeeCode: string; fullName: string; gender: string; nationalId?: string | null; phone: string; email: string; address?: string | null; educationLevel?: string | null; joinDate: string; endDate?: string | null; status: string; departmentId?: number; departmentName: string; positionId?: number; positionTitle: string }
export type Page<T> = { content: T[]; page: number; size: number; totalElements: number; totalPages: number }
export type Leave = { id: number; employeeId: number; employeeName: string; leaveType: string; fromDate: string; toDate: string; reason: string; status: string; rejectionReason?: string }
export type Attendance = { id: number; employeeId: number; employeeName: string; attendanceDate: string; checkIn?: string; checkOut?: string; workedHours: number; overtimeHours: number; status: string }
export type Payroll = { id: number; periodId: number; month: number; year: number; employeeId: number; employeeName: string; baseSalary: number; workedDays: number; overtimeHours: number; overtimePay: number; allowances: number; deductions: number; netSalary: number; status: string }
export type WorkShift = { id: number; name: string; startTime: string; endTime: string; overtimeRate: number }
export type EmployeeStatusRow = { employeeId: number; employeeCode: string; fullName: string; status: string; educationLevel: string; departmentName: string; positionTitle: string; joinDate: string; endDate?: string | null; tenureMonths: number; baseSalary: number; allowance: number }
export type EmployeeReport = { month: number; year: number; asOf: string; totalEmployees: number; active: number; onLeave: number; terminated: number; statuses: EmployeeStatusRow[]; education: { label: string; count: number }[]; salary: { minBaseSalary: number; maxBaseSalary: number; averageBaseSalary: number; totalAllowances: number; employeeCount: number }; tenure: { label: string; count: number }[] }
export type AnnualPayrollSummary = { year: number; periodCount: number; totalBaseSalary: number; totalAllowances: number; totalOvertimePay: number; totalDeductions: number; totalNetSalary: number }
export type CalculationRule = { standardWorkDays: number; overtimeMultiplier: number; formula: string }
export type PayrollPeriod = { id: number; month: number; year: number; fromDate: string; toDate: string; status: string }
export type AssistantFact = { label: string; value: string }
export type AssistantConversationTurn = { question: string; answer: string }
export type AssistantResult =
  | { kind: 'ANSWER'; answer: string; facts: AssistantFact[]; sources: string[]; proposal?: never }
  | { kind: 'PROPOSAL'; answer?: never; facts: AssistantFact[]; sources: string[]; proposal: {
      action: 'UPDATE_OWN_PROFILE' | 'CREATE_OWN_LEAVE' | 'CANCEL_OWN_LEAVE'
      summary: string
      payload: Record<string, string | number>
    } }
export type ContractEffectiveStatus = 'UPCOMING' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
export type Contract = { id: number; employeeId: number; employeeName: string; employeeCode: string; contractNumber: string; contractType: string; startDate: string; endDate?: string | null; baseSalary: number; allowance: number; status: string; effectiveStatus: ContractEffectiveStatus }
