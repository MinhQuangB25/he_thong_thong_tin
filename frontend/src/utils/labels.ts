const leaveStatus: Record<string, string> = { PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối', CANCELLED: 'Đã hủy' }
const employeeStatus: Record<string, string> = { ACTIVE: 'Đang làm', ON_LEAVE: 'Đang nghỉ', TERMINATED: 'Đã nghỉ việc' }
const payrollStatus: Record<string, string> = { DRAFT: 'Bản nháp', LOCKED: 'Đã khóa' }
const attendanceStatus: Record<string, string> = { PRESENT: 'Có mặt', LATE: 'Đi trễ', ABSENT: 'Vắng', LEAVE: 'Nghỉ phép' }

/** Unknown codes fall back to the raw value so new backend states stay visible. */
export const leaveStatusLabel = (status: string) => leaveStatus[status] ?? status
export const employeeStatusLabel = (status: string) => employeeStatus[status] ?? status
export const payrollStatusLabel = (status: string) => payrollStatus[status] ?? status
export const attendanceStatusLabel = (status: string) => attendanceStatus[status] ?? status
