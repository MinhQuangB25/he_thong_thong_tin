import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Attendance, Employee, Page, WorkShift } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'

const todayValue = () => new Date().toISOString().slice(0, 10)

export function AttendancePage() {
  const { user } = useAuth()
  const canManage = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const [items, setItems] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [shifts, setShifts] = useState<WorkShift[]>([])
  const [form, setForm] = useState({ employeeId: '', shiftId: '', workDate: todayValue(), checkIn: '08:00', checkOut: '17:00', status: 'PRESENT' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10)
  const to = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10)

  async function load() {
    setLoading(true); setError('')
    try { setItems(await api<Attendance[]>(`/attendance?from=${from}&to=${to}`)) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải chấm công') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    void load()
    if (canManage) {
      Promise.all([api<Page<Employee>>('/employees?size=100&sort=fullName,asc'), api<WorkShift[]>('/work-shifts')])
        .then(([employeePage, shiftData]) => { setEmployees(employeePage.content); setShifts(shiftData); setForm(current => ({ ...current, employeeId: current.employeeId || String(employeePage.content[0]?.id || ''), shiftId: current.shiftId || String(shiftData[0]?.id || '') })) })
        .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu nhập công'))
    }
  }, [canManage])

  const overtimePreview = useMemo(() => {
    if (!form.checkIn || !form.checkOut) return 0
    const start = new Date(`1970-01-01T${form.checkIn}:00`).getTime()
    const end = new Date(`1970-01-01T${form.checkOut}:00`).getTime()
    return Math.max(0, Math.round(((end - start) / 3600000 - 8) * 100) / 100)
  }, [form.checkIn, form.checkOut])

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    try {
      const schedule = await api<{ id: number }>('/work-schedules', { method: 'POST', body: JSON.stringify({ employeeId: Number(form.employeeId), shiftId: Number(form.shiftId), workDate: form.workDate, note: 'Nhập từ màn hình HR' }) })
      await api('/attendance', { method: 'POST', body: JSON.stringify({ employeeId: Number(form.employeeId), scheduleId: schedule.id, attendanceDate: form.workDate, checkIn: form.checkIn || null, checkOut: form.checkOut || null, status: form.status }) })
      setSuccess('Đã ghi nhận lịch làm và chấm công'); setShowForm(false); await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể lưu chấm công') } finally { setSaving(false) }
  }

  return <div className="attendance-page">
    <div className="page-heading compact"><div><span className="eyebrow">ATTENDANCE</span><h1>Chấm công & lịch làm</h1><p>{canManage ? 'Nhập lịch làm và kiểm tra dữ liệu chấm công của trung tâm.' : 'Theo dõi lịch làm và chấm công trong phạm vi được cấp quyền.'}</p></div>{canManage && <button className="primary-button" onClick={() => setShowForm(value => !value)}>＋ Nhập chấm công</button>}</div>
    {error && <StatusMessage type="error">{error}</StatusMessage>}{success && <StatusMessage type="success">{success}</StatusMessage>}
    {showForm && canManage && <form className="panel inline-form attendance-form" onSubmit={submit}><div className="panel-heading"><div><span className="eyebrow">ATTENDANCE ENTRY</span><h2>Nhập dữ liệu chấm công</h2></div></div><div className="form-grid"><label>Nhân sự<select required value={form.employeeId} onChange={event => setForm({ ...form, employeeId: event.target.value })}><option value="">Chọn nhân sự</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName} · {employee.employeeCode}</option>)}</select></label><label>Ca làm<select required value={form.shiftId} onChange={event => setForm({ ...form, shiftId: event.target.value })}><option value="">Chọn ca</option>{shifts.map(shift => <option key={shift.id} value={shift.id}>{shift.name} ({shift.startTime} - {shift.endTime})</option>)}</select></label><label>Ngày làm<input required type="date" value={form.workDate} onChange={event => setForm({ ...form, workDate: event.target.value })} /></label><label>Trạng thái<select value={form.status} onChange={event => setForm({ ...form, status: event.target.value })}><option value="PRESENT">Có mặt</option><option value="ABSENT">Vắng</option><option value="LEAVE">Nghỉ phép</option></select></label><label>Giờ vào<input type="time" value={form.checkIn} onChange={event => setForm({ ...form, checkIn: event.target.value })} /></label><label>Giờ ra<input type="time" value={form.checkOut} onChange={event => setForm({ ...form, checkOut: event.target.value })} /></label></div><p className="form-hint">Tăng ca dự kiến: <strong>{overtimePreview} giờ</strong>. Hệ thống tự tính lại theo giờ vào và giờ ra.</p><div className="form-actions"><button type="button" className="outline-button" onClick={() => setShowForm(false)}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu chấm công'}</button></div></form>}
    <section className="panel table-panel"><div className="panel-heading"><div><span className="eyebrow">THIS MONTH</span><h2>Bản ghi chấm công</h2></div><span className="count-pill">{items.length} ngày</span></div>{loading ? <StatusMessage type="info">Đang tải…</StatusMessage> : !items.length ? <StatusMessage type="empty">Chưa có dữ liệu chấm công trong phạm vi này.</StatusMessage> : <div className="responsive-table"><table><caption className="sr-only">Bản ghi chấm công</caption><thead><tr><th>NGÀY</th><th>NHÂN SỰ</th><th>VÀO</th><th>RA</th><th>GIỜ CÔNG</th><th>TĂNG CA</th><th>TRẠNG THÁI</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.attendanceDate}</strong></td><td>{item.employeeName}</td><td>{item.checkIn ?? '—'}</td><td>{item.checkOut ?? '—'}</td><td>{item.workedHours}h</td><td>{item.overtimeHours}h</td><td><span className={`badge ${item.status === 'PRESENT' ? 'success' : item.status === 'LATE' ? 'warning' : 'muted'}`}>{attendanceLabel(item.status)}</span></td></tr>)}</tbody></table></div>}</section>
  </div>
}

function attendanceLabel(status: string) { return ({ PRESENT: 'Có mặt', LATE: 'Đi trễ', ABSENT: 'Vắng', LEAVE: 'Nghỉ phép' } as Record<string, string>)[status] || status }
