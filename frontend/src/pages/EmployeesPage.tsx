import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Employee, Page } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'

type Option = { id: number; name: string }
type PositionOption = { id: number; title: string }
type EmployeeStatusFilter = 'ALL' | 'ACTIVE' | 'TERMINATED'
type EmployeeSortKey = 'fullName' | 'employeeCode' | 'departmentName' | 'positionTitle' | 'status'

export function EmployeesPage() {
  const { user } = useAuth()
  const canWrite = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const [data, setData] = useState<Page<Employee> | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [positionFilter, setPositionFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<EmployeeSortKey>('fullName')
  const [sortDescending, setSortDescending] = useState(false)

  function load() {
    setLoading(true)
    setError('')
    api<Page<Employee>>(`/employees?search=${encodeURIComponent(search)}&page=0&size=20&sort=fullName,asc`)
      .then(setData)
      .catch(errorValue => setError(errorValue instanceof Error ? errorValue.message : 'Không thể tải danh sách nhân sự'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 250)
    return () => window.clearTimeout(timer)
  }, [search])

  const employees = data?.content ?? []
  const departmentOptions = [...new Set(employees.map(employee => employee.departmentName))].sort((left, right) => left.localeCompare(right, 'vi'))
  const positionOptions = [...new Set(employees.map(employee => employee.positionTitle))].sort((left, right) => left.localeCompare(right, 'vi'))
  const visibleEmployees = [...employees]
    .filter(employee => statusFilter === 'ALL' || employee.status === statusFilter)
    .filter(employee => departmentFilter === 'ALL' || employee.departmentName === departmentFilter)
    .filter(employee => positionFilter === 'ALL' || employee.positionTitle === positionFilter)
    .sort((left, right) => {
      const leftValue = String(left[sortBy] ?? '')
      const rightValue = String(right[sortBy] ?? '')
      return (leftValue.localeCompare(rightValue, 'vi') || left.id - right.id) * (sortDescending ? -1 : 1)
    })

  function resetFilters() {
    setStatusFilter('ALL')
    setDepartmentFilter('ALL')
    setPositionFilter('ALL')
    setSortBy('fullName')
    setSortDescending(false)
  }

  async function terminate(employee: Employee) {
    if (!window.confirm(`Chuyển ${employee.fullName} sang trạng thái nghỉ việc? Lịch sử của nhân sự vẫn được giữ lại.`)) return
    try {
      await api<Employee>(`/employees/${employee.id}`, { method: 'DELETE' })
      load()
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Không thể cập nhật trạng thái nhân sự')
    }
  }

  return <div>
    <div className="page-heading compact">
      <div><span className="eyebrow">PEOPLE OPERATIONS</span><h1>Đội ngũ của chúng ta</h1><p>Quản lý hồ sơ, chức vụ và hành trình phát triển của nhân sự.</p></div>
      {canWrite && <button className="primary-button" onClick={() => setShowForm(!showForm)}>＋ Thêm nhân sự</button>}
    </div>
    {showForm && <EmployeeForm onDone={() => { setShowForm(false); load() }} />}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    <section className="panel table-panel">
      <div className="table-toolbar"><div className="search-box"><span>⌕</span><input id="employee-search" name="search" aria-label="Tìm nhân sự" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tên hoặc mã nhân viên…" /></div><button className="filter-button" type="button" aria-expanded={showFilters} aria-controls="employee-filters" onClick={() => setShowFilters(current => !current)}>Lọc & sắp xếp {showFilters ? '▴' : '▾'}</button></div>
      {showFilters && <div id="employee-filters" className="advanced-filter employees-filter"><div className="advanced-filter-grid"><label htmlFor="employee-status-filter">Trạng thái<select id="employee-status-filter" name="status" aria-label="Lọc theo trạng thái nhân sự" value={statusFilter} onChange={event => setStatusFilter(event.target.value as EmployeeStatusFilter)}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang làm</option><option value="TERMINATED">Đã nghỉ việc</option></select></label><label htmlFor="employee-department-filter">Phòng ban<select id="employee-department-filter" name="department" aria-label="Lọc theo phòng ban" value={departmentFilter} onChange={event => setDepartmentFilter(event.target.value)}><option value="ALL">Tất cả phòng ban</option>{departmentOptions.map(department => <option key={department} value={department}>{department}</option>)}</select></label><label htmlFor="employee-position-filter">Chức vụ<select id="employee-position-filter" name="position" aria-label="Lọc theo chức vụ" value={positionFilter} onChange={event => setPositionFilter(event.target.value)}><option value="ALL">Tất cả chức vụ</option>{positionOptions.map(position => <option key={position} value={position}>{position}</option>)}</select></label><label htmlFor="employee-sort">Sắp xếp theo<select id="employee-sort" name="sort" aria-label="Sắp xếp nhân sự theo" value={sortBy} onChange={event => setSortBy(event.target.value as EmployeeSortKey)}><option value="fullName">Họ và tên</option><option value="employeeCode">Mã nhân viên</option><option value="departmentName">Phòng ban</option><option value="positionTitle">Chức vụ</option><option value="status">Trạng thái</option></select></label><button className="filter-button filter-direction" type="button" aria-label="Đổi thứ tự sắp xếp nhân sự" onClick={() => setSortDescending(current => !current)}>{sortDescending ? '↓ Z–A' : '↑ A–Z'}</button><button className="text-button filter-reset" type="button" onClick={resetFilters}>Đặt lại</button></div></div>}
      {loading ? <StatusMessage type="info">Đang tải dữ liệu…</StatusMessage> : !visibleEmployees.length ? <StatusMessage type="empty">Không tìm thấy nhân sự phù hợp.</StatusMessage> : <div className="responsive-table"><table><thead><tr><th>NHÂN SỰ</th><th>MÃ NV</th><th>PHÒNG BAN</th><th>CHỨC VỤ</th><th>TRẠNG THÁI</th>{canWrite && <th>THAO TÁC</th>}</tr></thead><tbody>{visibleEmployees.map(employee => <tr key={employee.id}><td><div className="table-person"><span className="avatar soft">{employee.fullName[0]}</span><div><strong>{employee.fullName}</strong><small>{employee.email}</small></div></div></td><td><code>{employee.employeeCode}</code></td><td>{employee.departmentName}</td><td>{employee.positionTitle}</td><td><span className={`badge ${employee.status === 'ACTIVE' ? 'success' : 'muted'}`}>{employee.status === 'ACTIVE' ? 'Đang làm' : employee.status === 'TERMINATED' ? 'Đã nghỉ việc' : employee.status}</span></td>{canWrite && <td><div className="row-actions employee-actions">{employee.status === 'ACTIVE' ? <button className="danger-text-button" type="button" onClick={() => void terminate(employee)}>Cho nghỉ việc</button> : <span className="muted-text">Đã lưu lịch sử</span>}</div></td>}</tr>)}</tbody></table></div>}
      <div className="table-footer"><span>Hiển thị {visibleEmployees.length} / {data?.totalElements ?? 0} nhân sự</span><span className="pagination">‹　1　›</span></div>
    </section>
  </div>
}

function EmployeeForm({ onDone }: { onDone: () => void }) {
  const [departments, setDepartments] = useState<Option[]>([])
  const [positions, setPositions] = useState<PositionOption[]>([])
  const [form, setForm] = useState({ employeeCode: '', fullName: '', gender: 'FEMALE', phone: '', email: '', joinDate: new Date().toISOString().slice(0, 10), departmentId: '', positionId: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([api<Option[]>('/departments'), api<PositionOption[]>('/positions')])
      .then(([departmentData, positionData]) => { setDepartments(departmentData); setPositions(positionData) })
      .catch(errorValue => setError(errorValue instanceof Error ? errorValue.message : 'Không thể tải dữ liệu biểu mẫu'))
  }, [])

  function update(key: string, value: string) { setForm(current => ({ ...current, [key]: value })) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api('/employees', { method: 'POST', body: JSON.stringify({ ...form, departmentId: Number(form.departmentId), positionId: Number(form.positionId) }) })
      onDone()
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Không thể lưu nhân sự')
    } finally {
      setSaving(false)
    }
  }

  return <form className="panel inline-form" onSubmit={submit}><div className="panel-heading"><div><span className="eyebrow">NEW MEMBER</span><h2>Thêm nhân sự</h2></div></div><div className="form-grid"><label>Mã nhân viên<input required value={form.employeeCode} onChange={event => update('employeeCode', event.target.value)} /></label><label>Họ và tên<input required value={form.fullName} onChange={event => update('fullName', event.target.value)} /></label><label>Email<input required type="email" value={form.email} onChange={event => update('email', event.target.value)} /></label><label>Số điện thoại<input required value={form.phone} onChange={event => update('phone', event.target.value)} /></label><label>Ngày vào làm<input required type="date" value={form.joinDate} onChange={event => update('joinDate', event.target.value)} /></label><label>Giới tính<select value={form.gender} onChange={event => update('gender', event.target.value)}><option value="FEMALE">Nữ</option><option value="MALE">Nam</option><option value="OTHER">Khác</option></select></label><label>Phòng ban<select required value={form.departmentId} onChange={event => update('departmentId', event.target.value)}><option value="">Chọn phòng ban</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label><label>Chức vụ<select required value={form.positionId} onChange={event => update('positionId', event.target.value)}><option value="">Chọn chức vụ</option>{positions.map(position => <option key={position.id} value={position.id}>{position.title}</option>)}</select></label></div>{error && <div className="form-error">{error}</div>}<div className="form-actions"><button type="button" className="outline-button" onClick={onDone}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu nhân sự'}</button></div></form>
}
