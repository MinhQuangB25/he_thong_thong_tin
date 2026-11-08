import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Employee, Page } from '../api/types'
import { Pagination } from '../components/Pagination'
import { localDate } from '../utils/dates'
import { StatusMessage } from '../components/StatusMessage'
import { employeeStatusLabel } from '../utils/labels'

type Option = { id: number; name: string }
type PositionOption = { id: number; title: string }
type EmployeeStatusFilter = 'ALL' | 'ACTIVE' | 'TERMINATED'
type EmployeeSortKey = 'fullName' | 'employeeCode' | 'departmentName' | 'positionTitle' | 'status'

export function EmployeesPage({ openForm = false }: { openForm?: boolean }) {
  const { user } = useAuth()
  const canWrite = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const [data, setData] = useState<Page<Employee> | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(openForm && canWrite)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [success, setSuccess] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [statusFilter, setStatusFilter] = useState<EmployeeStatusFilter>('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [positionFilter, setPositionFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<EmployeeSortKey>('fullName')
  const [sortDescending, setSortDescending] = useState(false)

  const [page, setPage] = useState(0)
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([])
  const [positionOptions, setPositionOptions] = useState<string[]>([])
  const requestId = useRef(0)
  useEffect(() => {
    Promise.all([api<Option[]>('/departments'), api<PositionOption[]>('/positions')])
      .then(([departments, positions]) => { setDepartmentOptions(departments.map(item => item.name)); setPositionOptions(positions.map(item => item.title)) })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải bộ lọc'))
  }, [])

  function load() {
    const id = ++requestId.current
    const params = new URLSearchParams({ search, page: String(page), size: '20', sort: `${sortBy},${sortDescending ? 'desc' : 'asc'}` })
    if (statusFilter !== 'ALL') params.set('status', statusFilter)
    if (departmentFilter !== 'ALL') params.set('department', departmentFilter)
    if (positionFilter !== 'ALL') params.set('position', positionFilter)
    setLoading(true)
    setError('')
    api<Page<Employee>>(`/employees?${params}`)
      .then(result => { if (id === requestId.current) setData(result) })
      .catch(errorValue => { if (id === requestId.current) setError(errorValue instanceof Error ? errorValue.message : 'Không thể tải danh sách nhân sự') })
      .finally(() => { if (id === requestId.current) setLoading(false) })
  }

  useEffect(() => {
    const timer = window.setTimeout(load, 250)
    return () => { window.clearTimeout(timer); requestId.current++ }
  }, [search, page, statusFilter, departmentFilter, positionFilter, sortBy, sortDescending])

  const visibleEmployees = data?.content ?? []

  function resetFilters() {
    setPage(0)
    setStatusFilter('ALL')
    setDepartmentFilter('ALL')
    setPositionFilter('ALL')
    setSortBy('fullName')
    setSortDescending(false)
  }

  async function terminate(employee: Employee) {
    if (!window.confirm(`Chuyển ${employee.fullName} sang trạng thái nghỉ việc từ hôm nay? Hợp đồng đang hiệu lực sẽ chấm dứt cùng ngày, hợp đồng chưa hiệu lực sẽ bị hủy. Lịch sử nhân sự và lương vẫn được giữ lại.`)) return
    try {
      await api<Employee>(`/employees/${employee.id}`, { method: 'DELETE' })
      setSuccess(`Đã chuyển ${employee.fullName} sang trạng thái nghỉ việc và kết thúc hợp đồng đang mở.`)
      load()
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Không thể cập nhật trạng thái nhân sự')
    }
  }

  return <div>
    <div className="page-heading compact">
      <div><span className="eyebrow">NHÂN SỰ</span><h1>Đội ngũ của chúng ta</h1><p>Quản lý hồ sơ, chức vụ và hành trình phát triển của nhân sự.</p></div>
      {canWrite && <button className="primary-button" onClick={() => { setEditing(null); setSuccess(''); setShowForm(!showForm) }}>＋ Thêm nhân sự</button>}
    </div>
    {showForm && !editing && <EmployeeForm onCancel={() => setShowForm(false)} onSaved={saved => { setShowForm(false); setSuccess(`Đã thêm nhân sự ${saved.fullName}.`); load() }} />}
    {editing && <EmployeeForm key={editing.id} employee={editing} onCancel={() => setEditing(null)} onSaved={saved => { setEditing(null); setSuccess(`Đã cập nhật hồ sơ ${saved.fullName}.`); load() }} />}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {success && <StatusMessage type="success">{success}</StatusMessage>}
    <section className="panel table-panel">
      <div className="table-toolbar"><div className="search-box"><span>⌕</span><input id="employee-search" name="search" aria-label="Tìm nhân sự" value={search} onChange={event => { setPage(0); setSearch(event.target.value) }} placeholder="Tìm theo tên hoặc mã nhân viên…" /></div><button className="filter-button" type="button" aria-expanded={showFilters} aria-controls="employee-filters" onClick={() => setShowFilters(current => !current)}>Lọc & sắp xếp {showFilters ? '▴' : '▾'}</button></div>
      {showFilters && <div id="employee-filters" className="advanced-filter employees-filter"><div className="advanced-filter-grid"><label htmlFor="employee-status-filter">Trạng thái<select id="employee-status-filter" name="status" aria-label="Lọc theo trạng thái nhân sự" value={statusFilter} onChange={event => { setPage(0); setStatusFilter(event.target.value as EmployeeStatusFilter) }}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang làm</option><option value="TERMINATED">Đã nghỉ việc</option></select></label><label htmlFor="employee-department-filter">Phòng ban<select id="employee-department-filter" name="department" aria-label="Lọc theo phòng ban" value={departmentFilter} onChange={event => { setPage(0); setDepartmentFilter(event.target.value) }}><option value="ALL">Tất cả phòng ban</option>{departmentOptions.map(department => <option key={department} value={department}>{department}</option>)}</select></label><label htmlFor="employee-position-filter">Chức vụ<select id="employee-position-filter" name="position" aria-label="Lọc theo chức vụ" value={positionFilter} onChange={event => { setPage(0); setPositionFilter(event.target.value) }}><option value="ALL">Tất cả chức vụ</option>{positionOptions.map(position => <option key={position} value={position}>{position}</option>)}</select></label><label htmlFor="employee-sort">Sắp xếp theo<select id="employee-sort" name="sort" aria-label="Sắp xếp nhân sự theo" value={sortBy} onChange={event => { setPage(0); setSortBy(event.target.value as EmployeeSortKey) }}><option value="fullName">Họ và tên</option><option value="employeeCode">Mã nhân viên</option><option value="departmentName">Phòng ban</option><option value="positionTitle">Chức vụ</option><option value="status">Trạng thái</option></select></label><button className="filter-button filter-direction" type="button" aria-label="Đổi thứ tự sắp xếp nhân sự" onClick={() => { setPage(0); setSortDescending(current => !current) }}>{sortDescending ? '↓ Z–A' : '↑ A–Z'}</button><button className="text-button filter-reset" type="button" onClick={resetFilters}>Đặt lại</button></div></div>}
      {loading ? <StatusMessage type="info">Đang tải dữ liệu…</StatusMessage> : !visibleEmployees.length ? <StatusMessage type="empty">Không tìm thấy nhân sự phù hợp.</StatusMessage> : <div className="responsive-table stack-table"><table><caption className="sr-only">Danh sách nhân sự</caption><thead><tr><th>NHÂN SỰ</th><th>MÃ NV</th><th>PHÒNG BAN</th><th>CHỨC VỤ</th><th>TRẠNG THÁI</th>{canWrite && <th>THAO TÁC</th>}</tr></thead><tbody>{visibleEmployees.map(employee => <tr key={employee.id}><td data-label="Nhân sự"><div className="table-person"><span className="avatar soft">{employee.fullName[0]}</span><div><strong>{employee.fullName}</strong><small>{employee.email}</small></div></div></td><td data-label="Mã NV"><code>{employee.employeeCode}</code></td><td data-label="Phòng ban">{employee.departmentName}</td><td data-label="Chức vụ">{employee.positionTitle}</td><td data-label="Trạng thái"><span className={`badge ${employee.status === 'ACTIVE' ? 'success' : 'muted'}`}>{employeeStatusLabel(employee.status)}</span></td>{canWrite && <td data-label="Thao tác"><div className="row-actions employee-actions">{employee.status === 'ACTIVE' ? <><button className="outline-button small-button" type="button" aria-label={`Sửa hồ sơ ${employee.fullName}`} onClick={() => { setShowForm(false); setSuccess(''); setEditing(employee) }}>Sửa</button><button className="danger-text-button" type="button" onClick={() => void terminate(employee)}>Cho nghỉ việc</button></> : <span className="muted-text">Đã lưu lịch sử</span>}</div></td>}</tr>)}</tbody></table></div>}
      <div className="table-footer"><span>Hiển thị {visibleEmployees.length} / {data?.totalElements ?? 0} nhân sự</span><Pagination page={page} totalPages={data?.totalPages ?? 0} disabled={loading} onChange={setPage} /></div>
    </section>
  </div>
}

type EmployeeFormValues = { employeeCode: string; fullName: string; gender: string; nationalId: string; phone: string; email: string; address: string; educationLevel: string; joinDate: string; departmentId: string; positionId: string }

function initialValues(employee?: Employee): EmployeeFormValues {
  if (!employee) return { employeeCode: '', fullName: '', gender: 'FEMALE', nationalId: '', phone: '', email: '', address: '', educationLevel: '', joinDate: localDate(new Date()), departmentId: '', positionId: '' }
  return {
    employeeCode: employee.employeeCode, fullName: employee.fullName, gender: employee.gender, nationalId: employee.nationalId ?? '',
    phone: employee.phone, email: employee.email, address: employee.address ?? '', educationLevel: employee.educationLevel ?? '',
    joinDate: employee.joinDate, departmentId: String(employee.departmentId ?? ''), positionId: String(employee.positionId ?? ''),
  }
}

function EmployeeForm({ employee, onSaved, onCancel }: { employee?: Employee; onSaved: (saved: Employee) => void; onCancel: () => void }) {
  const [departments, setDepartments] = useState<Option[]>([])
  const [positions, setPositions] = useState<PositionOption[]>([])
  const [form, setForm] = useState<EmployeeFormValues>(() => initialValues(employee))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const today = localDate(new Date())

  useEffect(() => {
    Promise.all([api<Option[]>('/departments'), api<PositionOption[]>('/positions')])
      .then(([departmentData, positionData]) => { setDepartments(departmentData); setPositions(positionData) })
      .catch(errorValue => setError(errorValue instanceof Error ? errorValue.message : 'Không thể tải dữ liệu biểu mẫu'))
  }, [])

  useEffect(() => {
    if (!employee) return
    formRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    formRef.current?.querySelector<HTMLInputElement>('input[name="fullName"]')?.focus()
  }, [employee])

  function update(key: keyof EmployeeFormValues, value: string) { setForm(current => ({ ...current, [key]: value })) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (form.joinDate > today) { setError('Ngày vào làm không được ở tương lai.'); return }
    setSaving(true)
    setError('')
    const payload = {
      fullName: form.fullName, gender: form.gender, nationalId: form.nationalId || null, phone: form.phone, email: form.email,
      address: form.address || null, educationLevel: form.educationLevel || null, joinDate: form.joinDate,
      departmentId: Number(form.departmentId), positionId: Number(form.positionId),
    }
    try {
      const saved = employee
        ? await api<Employee>(`/employees/${employee.id}`, { method: 'PUT', body: JSON.stringify(payload) })
        : await api<Employee>('/employees', { method: 'POST', body: JSON.stringify({ ...payload, employeeCode: form.employeeCode }) })
      onSaved(saved)
    } catch (errorValue) {
      setError(errorValue instanceof Error ? errorValue.message : 'Không thể lưu nhân sự')
    } finally {
      setSaving(false)
    }
  }

  const isEdit = !!employee
  return <form ref={formRef} className="panel inline-form" onSubmit={submit} aria-label={employee ? `Sửa hồ sơ ${employee.fullName}` : 'Thêm nhân sự'}>
    <div className="panel-heading"><div><span className="eyebrow">{isEdit ? 'CẬP NHẬT HỒ SƠ' : 'HỒ SƠ MỚI'}</span><h2>{employee ? `Sửa hồ sơ: ${employee.fullName}` : 'Thêm nhân sự'}</h2></div></div>
    <div className="form-grid">
      <label>Mã nhân viên<input name="employeeCode" required={!isEdit} readOnly={isEdit} aria-readonly={isEdit} value={form.employeeCode} onChange={event => update('employeeCode', event.target.value)} /></label>
      <label>Họ và tên<input name="fullName" required maxLength={120} value={form.fullName} onChange={event => update('fullName', event.target.value)} /></label>
      <label>Email<input name="email" required type="email" maxLength={120} value={form.email} onChange={event => update('email', event.target.value)} /></label>
      <label>Số điện thoại<input name="phone" required type="tel" maxLength={20} value={form.phone} onChange={event => update('phone', event.target.value)} /></label>
      <label>Ngày vào làm<input name="joinDate" required type="date" max={today} value={form.joinDate} onChange={event => update('joinDate', event.target.value)} /></label>
      <label>Giới tính<select name="gender" value={form.gender} onChange={event => update('gender', event.target.value)}><option value="FEMALE">Nữ</option><option value="MALE">Nam</option><option value="OTHER">Khác</option></select></label>
      <label>Phòng ban<select name="departmentId" required value={form.departmentId} onChange={event => update('departmentId', event.target.value)}><option value="">Chọn phòng ban</option>{departments.map(department => <option key={department.id} value={department.id}>{department.name}</option>)}</select></label>
      <label>Chức vụ<select name="positionId" required value={form.positionId} onChange={event => update('positionId', event.target.value)}><option value="">Chọn chức vụ</option>{positions.map(position => <option key={position.id} value={position.id}>{position.title}</option>)}</select></label>
      <label>Số CCCD<input name="nationalId" maxLength={20} value={form.nationalId} onChange={event => update('nationalId', event.target.value)} /></label>
      <label>Trình độ<input name="educationLevel" maxLength={120} value={form.educationLevel} onChange={event => update('educationLevel', event.target.value)} /></label>
      <label className="span-two">Địa chỉ<input name="address" maxLength={255} value={form.address} onChange={event => update('address', event.target.value)} /></label>
    </div>
    {isEdit && <p className="form-hint">Mã nhân viên và trạng thái không sửa ở đây. Lương quản lý theo hợp đồng; nghỉ việc dùng nút “Cho nghỉ việc”. Mọi thay đổi đều được ghi nhật ký.</p>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="form-actions"><button type="button" className="outline-button" onClick={onCancel}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? 'Đang lưu…' : isEdit ? 'Lưu thay đổi' : 'Lưu nhân sự'}</button></div>
  </form>
}
