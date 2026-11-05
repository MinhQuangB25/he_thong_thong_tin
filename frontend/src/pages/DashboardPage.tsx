import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Employee, Leave, Page, Payroll } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'
import { Icon, type IconName } from '../components/Icon'
import { payrollStatusLabel } from '../utils/labels'

export function DashboardPage({ onNavigate, onAddEmployee }: { onNavigate: (screen: 'employees' | 'leave' | 'payroll' | 'assistant') => void; onAddEmployee?: () => void }) {
  const { user } = useAuth()
  const roles = user?.roles ?? []
  const canManage = roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER')
  const canViewDirectory = canManage || roles.includes('TEAM_LEADER')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [activeCount, setActiveCount] = useState(0)
  const [pending, setPending] = useState(0)
  const [payrolls, setPayrolls] = useState<Payroll[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const today = new Date()
  const month = today.getMonth() + 1
  const year = today.getFullYear()
  useEffect(() => {
    let cancelled = false
    setLoading(true); setError('')
    const people = canViewDirectory
      ? api<Page<Employee>>('/employees?size=5&status=ACTIVE&sort=joinDate,desc')
      : api<Employee>('/employees/me').then(employee => ({ content: [employee], totalElements: employee.status === 'ACTIVE' ? 1 : 0 }))
    Promise.all([people, api<Page<Leave>>('/leave-requests?size=1&status=PENDING'), api<Payroll[]>(`/payrolls?month=${month}&year=${year}`)])
      .then(([e, l, p]) => { if (!cancelled) { setEmployees(e.content); setActiveCount(e.totalElements); setPending(l.totalElements); setPayrolls(p) } })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Không thể tải tổng quan') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [canViewDirectory, user?.username, month, year])
  if (error) return <StatusMessage type="error">{error}</StatusMessage>
  if (loading) return <StatusMessage type="info">Đang tải tổng quan…</StatusMessage>
  const totalPayroll = payrolls.reduce((sum, item) => sum + item.netSalary, 0)
  const statuses = [...new Set(payrolls.map(item => item.status))]
  const periodStatus = statuses.length === 1 ? payrollStatusLabel(statuses[0]) : statuses.length ? 'Nhiều trạng thái' : 'Chưa có dữ liệu'
  return <div className="dashboard">
    <div className="page-heading"><div><span className="eyebrow">{today.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span><h1>Xin chào, {user?.displayName}</h1><p>{canViewDirectory ? 'Thông tin nhân sự và công việc, rõ ràng mỗi ngày.' : 'Thông tin công việc và thu nhập của bạn.'}</p></div>{canManage && <button className="primary-button" onClick={() => onAddEmployee ? onAddEmployee() : onNavigate('employees')}><Icon name="plus" /> Thêm nhân sự</button>}</div>
    <div className="metrics-grid"><Metric label={canViewDirectory ? 'Nhân sự đang làm' : 'Hồ sơ đang hoạt động'} value={activeCount} trend="Hồ sơ đang hoạt động" tone="green" icon="people" /><Metric label="Đơn chờ duyệt" value={pending} trend="Theo dõi và xử lý đơn từ" tone="orange" icon="leave" /><Metric label={`Thực lĩnh tháng ${month}/${year}`} value={`${totalPayroll.toLocaleString('vi-VN')} ₫`} trend="Từ bảng lương đã lập" tone="purple" icon="payroll" /></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-heading"><div><span className="eyebrow">{canViewDirectory ? 'ĐỘI NGŨ' : 'HỒ SƠ CỦA TÔI'}</span><h2>{canViewDirectory ? 'Nhân sự đang làm gần đây' : 'Hồ sơ của bạn'}</h2></div>{canViewDirectory && <button className="text-button" onClick={() => onNavigate('employees')}>Xem tất cả →</button>}</div><div className="person-list">{employees.length ? employees.map(employee => <div className="person-row" key={employee.id}><span className="avatar soft">{employee.fullName[0]}</span><div><strong>{employee.fullName}</strong><small>{employee.positionTitle} · {employee.departmentName}</small></div><span className={`status-dot ${employee.status === 'ACTIVE' ? 'active' : 'muted'}`} /></div>) : <StatusMessage type="empty">Chưa có dữ liệu nhân sự.</StatusMessage>}</div></section>
    <section className="panel accent-panel"><div className="panel-heading"><div><span className="eyebrow">THU NHẬP & BẢNG LƯƠNG</span><h2>Bảng lương tháng {month}/{year}</h2></div><button className="text-button" onClick={() => onNavigate('payroll')}>Chi tiết <Icon name="arrow" /></button></div><div className="payroll-summary"><span className="summary-icon"><Icon name="payroll" /></span><div><small>TỔNG THỰC LĨNH</small><strong>{totalPayroll.toLocaleString('vi-VN')} ₫</strong></div></div><div className="mini-line"><span>Trạng thái kỳ lương</span><strong className={`badge ${statuses.length === 1 && statuses[0] === 'LOCKED' ? 'success' : statuses.length ? 'warning' : 'muted'}`}>{periodStatus}</strong></div><div className="mini-line"><span>Người nhận</span><strong>{new Set(payrolls.map(item => item.employeeId)).size} nhân viên</strong></div></section></div>
    <section className="panel dashboard-assistant"><span className="assistant-banner-icon"><Icon name="assistant" /></span><div><h2>Một trợ lý cho công việc mỗi ngày</h2><p>Hỏi về hồ sơ, đơn nghỉ và bảng lương trong phạm vi của bạn.</p></div><button className="outline-button" onClick={() => onNavigate('assistant')}>Mở trợ lý AI <Icon name="arrow" /></button></section>
  </div>
}
function Metric({ label, value, trend, tone, icon }: { label: string; value: string | number; trend: string; tone: string; icon: IconName }) { return <div className="metric-card"><div className="metric-top"><span className="metric-label">{label}</span><span className={`metric-icon ${tone}`}><Icon name={icon} /></span></div><strong className="metric-value">{value}</strong><span className="metric-trend">{trend}</span></div> }
