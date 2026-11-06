import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { Contract, ContractEffectiveStatus, Employee, Page } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'
import { formatDate, localDate } from '../utils/dates'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })
const contractTypes = ['Không xác định thời hạn', 'Xác định thời hạn 12 tháng', 'Xác định thời hạn 24 tháng', 'Thử việc', 'Cộng tác viên']
const statusLabel: Record<ContractEffectiveStatus, string> = { ACTIVE: 'Đang hiệu lực', UPCOMING: 'Chờ hiệu lực', EXPIRED: 'Hết hạn', TERMINATED: 'Đã chấm dứt' }
const statusTone: Record<ContractEffectiveStatus, string> = { ACTIVE: 'success', UPCOMING: 'warning', EXPIRED: 'muted', TERMINATED: 'muted' }

type FormPreset = { employeeId?: number; contractType?: string; baseSalary?: number; allowance?: number }

/** A contract terminated before its start date never applied (e.g. cancelled when the employee left). */
function isCancelled(contract: Contract) {
  return contract.effectiveStatus === 'TERMINATED' && !!contract.endDate && contract.endDate < contract.startDate
}

function dayBefore(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  return localDate(new Date(year, month - 1, day - 1))
}

function firstDayOfNextMonth() {
  const today = new Date()
  return localDate(new Date(today.getFullYear(), today.getMonth() + 1, 1))
}

/** Contract in force today, or the one about to start; used as the baseline for a salary change. */
function currentContract(contracts: Contract[], employeeId: number) {
  const own = contracts.filter(item => item.employeeId === employeeId && (item.effectiveStatus === 'ACTIVE' || item.effectiveStatus === 'UPCOMING'))
  return own.sort((a, b) => b.startDate.localeCompare(a.startDate))[0]
}

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeFilter, setEmployeeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | ContractEffectiveStatus>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [preset, setPreset] = useState<FormPreset | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  async function load() {
    setLoading(true); setError('')
    try { setContracts(await api<Contract[]>('/contracts')) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải hợp đồng') }
    finally { setLoading(false) }
  }

  useEffect(() => {
    void load()
    // Everyone still employed (ACTIVE or ON_LEAVE) can sign or change a contract; terminated staff stay read-only.
    api<Page<Employee>>('/employees?size=100&sort=fullName,asc')
      .then(page => setEmployees(page.content.filter(employee => employee.status !== 'TERMINATED')))
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải danh sách nhân sự'))
  }, [])

  const visible = useMemo(() => contracts.filter(item =>
    (employeeFilter === 'ALL' || String(item.employeeId) === employeeFilter)
    && (statusFilter === 'ALL' || item.effectiveStatus === statusFilter)), [contracts, employeeFilter, statusFilter])
  const employedIds = new Set(employees.map(employee => employee.id))
  const activeCount = contracts.filter(item => item.effectiveStatus === 'ACTIVE' && employedIds.has(item.employeeId)).length
  const upcomingCount = contracts.filter(item => item.effectiveStatus === 'UPCOMING').length
  const withoutContract = employees.filter(employee => !currentContract(contracts, employee.id)).length

  function openForm(next: FormPreset) { setSuccess(''); setPreset(next) }

  async function terminate(contract: Contract) {
    const today = localDate(new Date())
    if (!window.confirm(`Chấm dứt hợp đồng ${contract.contractNumber} của ${contract.employeeName} từ hôm nay (${formatDate(today)})? Lịch sử lương vẫn được giữ lại.`)) return
    setBusyId(contract.id); setError(''); setSuccess('')
    try {
      await api<Contract>(`/contracts/${contract.id}/terminate`, { method: 'PATCH', body: JSON.stringify({ endDate: today }) })
      setSuccess(`Đã chấm dứt hợp đồng ${contract.contractNumber}.`)
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể chấm dứt hợp đồng') } finally { setBusyId(null) }
  }

  return <div className="contracts-page">
    <div className="page-heading compact">
      <div><span className="eyebrow">HỢP ĐỒNG</span><h1>Hợp đồng & mức lương</h1><p>Mỗi lần điều chỉnh lương là một hợp đồng mới; hợp đồng cũ tự kết thúc và được giữ làm lịch sử.</p></div>
      <button className="primary-button" onClick={() => openForm({})}>＋ Ký hợp đồng mới</button>
    </div>
    {preset && <ContractForm key={JSON.stringify(preset)} preset={preset} employees={employees} contracts={contracts} onCancel={() => setPreset(null)} onSaved={saved => { setPreset(null); setSuccess(`Đã lưu hợp đồng ${saved.contractNumber} cho ${saved.employeeName}.`); void load() }} />}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {success && <StatusMessage type="success">{success}</StatusMessage>}
    {!loading && <section className="admin-stats contract-stats">
      <div><span>ĐANG HIỆU LỰC</span><strong>{activeCount}</strong><small>Hợp đồng áp dụng hôm nay</small></div>
      <div><span>CHỜ HIỆU LỰC</span><strong>{upcomingCount}</strong><small>Điều chỉnh đã ký, chưa áp dụng</small></div>
      <div><span>CHƯA CÓ HỢP ĐỒNG</span><strong>{withoutContract}</strong><small>Nhân sự đang làm sẽ không được tính lương</small></div>
    </section>}
    <section className="panel table-panel">
      <div className="panel-heading"><div><span className="eyebrow">DANH SÁCH</span><h2>Hợp đồng lao động</h2></div><span className="count-pill">{visible.length} hợp đồng</span></div>
      <div className="table-toolbar">
        <label className="toolbar-field">Nhân sự<select name="employeeFilter" value={employeeFilter} onChange={event => setEmployeeFilter(event.target.value)}><option value="ALL">Tất cả nhân sự</option>{employees.map(employee => <option key={employee.id} value={employee.id}>{employee.fullName} · {employee.employeeCode}</option>)}</select></label>
        <label className="toolbar-field">Trạng thái<select name="statusFilter" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'ALL' | ContractEffectiveStatus)}><option value="ALL">Tất cả</option><option value="ACTIVE">Đang hiệu lực</option><option value="UPCOMING">Chờ hiệu lực</option><option value="EXPIRED">Hết hạn</option><option value="TERMINATED">Đã chấm dứt</option></select></label>
      </div>
      {loading ? <StatusMessage type="info">Đang tải hợp đồng…</StatusMessage> : !visible.length ? <StatusMessage type="empty">Không có hợp đồng phù hợp.</StatusMessage> : <div className="responsive-table stack-table"><table><caption className="sr-only">Danh sách hợp đồng lao động</caption><thead><tr><th>NHÂN SỰ</th><th>SỐ HỢP ĐỒNG</th><th>THỜI HẠN</th><th>LƯƠNG CƠ BẢN</th><th>PHỤ CẤP</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{visible.map(contract => <tr key={contract.id}>
        <td data-label="Nhân sự"><strong>{contract.employeeName}</strong><small className="cell-note">{contract.employeeCode}</small></td>
        <td data-label="Số hợp đồng"><code>{contract.contractNumber}</code><small className="cell-note">{contract.contractType}</small></td>
        <td data-label="Thời hạn">{isCancelled(contract) ? <>Từ {formatDate(contract.startDate)}<small className="cell-note">Hủy ngày {formatDate(contract.endDate)}, chưa từng áp dụng</small></> : <>{formatDate(contract.startDate)} → {contract.endDate ? formatDate(contract.endDate) : 'Không thời hạn'}</>}</td>
        <td data-label="Lương cơ bản" className="money">{money.format(contract.baseSalary)}</td>
        <td data-label="Phụ cấp">{money.format(contract.allowance)}</td>
        <td data-label="Trạng thái"><span className={`badge ${statusTone[contract.effectiveStatus]}`}>{isCancelled(contract) ? 'Đã hủy' : statusLabel[contract.effectiveStatus]}</span></td>
        <td data-label="Thao tác"><div className="row-actions employee-actions">{contract.effectiveStatus === 'ACTIVE' && employees.some(employee => employee.id === contract.employeeId) ? <>
          <button className="outline-button small-button" type="button" aria-label={`Điều chỉnh lương ${contract.employeeName}`} onClick={() => openForm({ employeeId: contract.employeeId, contractType: contract.contractType, baseSalary: contract.baseSalary, allowance: contract.allowance })}>Điều chỉnh lương</button>
          <button className="danger-text-button" type="button" disabled={busyId === contract.id} aria-label={`Chấm dứt hợp đồng ${contract.contractNumber}`} onClick={() => void terminate(contract)}>Chấm dứt</button>
        </> : <span className="muted-text">{contract.effectiveStatus === 'ACTIVE' ? 'Nhân sự đã nghỉ việc' : '—'}</span>}</div></td>
      </tr>)}</tbody></table></div>}
    </section>
  </div>
}

function ContractForm({ preset, employees, contracts, onSaved, onCancel }: { preset: FormPreset; employees: Employee[]; contracts: Contract[]; onSaved: (saved: Contract) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    employeeId: preset.employeeId ? String(preset.employeeId) : '',
    contractNumber: '',
    contractType: preset.contractType ?? contractTypes[0],
    startDate: preset.employeeId ? firstDayOfNextMonth() : localDate(new Date()),
    endDate: '',
    baseSalary: preset.baseSalary !== undefined ? String(preset.baseSalary) : '',
    allowance: preset.allowance !== undefined ? String(preset.allowance) : '0',
  })
  const [numberTouched, setNumberTouched] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    formRef.current?.scrollIntoView?.({ block: 'start', behavior: 'smooth' })
    formRef.current?.querySelector<HTMLElement>(preset.employeeId ? 'input[name="baseSalary"]' : 'select[name="employeeId"]')?.focus()
  }, [preset.employeeId])

  const employee = employees.find(item => String(item.id) === form.employeeId)
  const previous = employee ? currentContract(contracts, employee.id) : undefined
  const suggestedNumber = employee && form.startDate ? `HD-${employee.employeeCode}-${form.startDate.split('-').join('')}` : ''
  const contractNumber = numberTouched ? form.contractNumber : suggestedNumber
  const reversed = !!form.endDate && !!form.startDate && form.endDate < form.startDate
  const salary = Number(form.baseSalary)
  const change = previous && form.baseSalary !== '' && previous.baseSalary > 0 ? (salary - previous.baseSalary) / previous.baseSalary : null
  const startsTooEarly = !!previous && !!form.startDate && form.startDate <= previous.startDate

  function update(key: keyof typeof form, value: string) { setForm(current => ({ ...current, [key]: value })) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (reversed) { setError('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.'); return }
    if (startsTooEarly) { setError(`Hợp đồng mới phải bắt đầu sau ${formatDate(previous!.startDate)}.`); return }
    setSaving(true); setError('')
    try {
      const saved = await api<Contract>('/contracts', { method: 'POST', body: JSON.stringify({
        employeeId: Number(form.employeeId), contractNumber, contractType: form.contractType, startDate: form.startDate,
        endDate: form.endDate || null, baseSalary: Number(form.baseSalary), allowance: Number(form.allowance || 0),
      }) })
      onSaved(saved)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể lưu hợp đồng') } finally { setSaving(false) }
  }

  return <form ref={formRef} className="panel inline-form" onSubmit={submit} aria-label={preset.employeeId ? 'Điều chỉnh lương' : 'Ký hợp đồng mới'}>
    <div className="panel-heading"><div><span className="eyebrow">{preset.employeeId ? 'ĐIỀU CHỈNH LƯƠNG' : 'HỢP ĐỒNG MỚI'}</span><h2>{preset.employeeId && employee ? `Điều chỉnh lương: ${employee.fullName}` : 'Ký hợp đồng mới'}</h2></div></div>
    <div className="form-grid">
      <label>Nhân sự<select name="employeeId" required value={form.employeeId} onChange={event => update('employeeId', event.target.value)}><option value="">Chọn nhân sự</option>{employees.map(item => <option key={item.id} value={item.id}>{item.fullName} · {item.employeeCode}</option>)}</select></label>
      <label>Số hợp đồng<input name="contractNumber" required maxLength={50} value={contractNumber} onChange={event => { setNumberTouched(true); update('contractNumber', event.target.value) }} /></label>
      <label>Loại hợp đồng<input name="contractType" required maxLength={80} list="contract-type-options" value={form.contractType} onChange={event => update('contractType', event.target.value)} /><datalist id="contract-type-options">{contractTypes.map(type => <option key={type} value={type} />)}</datalist></label>
      <label>Ngày bắt đầu<input name="startDate" required type="date" min={employee?.joinDate} value={form.startDate} onChange={event => update('startDate', event.target.value)} /></label>
      <label>Ngày kết thúc (nếu có)<input name="endDate" type="date" min={form.startDate || undefined} aria-invalid={reversed} value={form.endDate} onChange={event => update('endDate', event.target.value)} /></label>
      <label>Lương cơ bản (₫)<input name="baseSalary" required type="number" min="0" step="100000" inputMode="numeric" value={form.baseSalary} onChange={event => update('baseSalary', event.target.value)} /></label>
      <label>Phụ cấp (₫)<input name="allowance" required type="number" min="0" step="100000" inputMode="numeric" value={form.allowance} onChange={event => update('allowance', event.target.value)} /></label>
    </div>
    <p className="form-hint" aria-live="polite">{previous
      ? <>Thay thế <strong>{previous.contractNumber}</strong> (lương {money.format(previous.baseSalary)}, phụ cấp {money.format(previous.allowance)}). {form.baseSalary !== '' && <>Lương mới <strong>{money.format(salary)}</strong>{change !== null && <> ({change >= 0 ? '+' : ''}{(change * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%)</>}. </>}{form.startDate && !startsTooEarly && <>Hợp đồng cũ sẽ kết thúc ngày <strong>{formatDate(dayBefore(form.startDate))}</strong>; kỳ lương từ tháng bắt đầu mới áp dụng mức mới.</>}</>
      : employee ? 'Nhân sự này chưa có hợp đồng đang hiệu lực.' : 'Chọn nhân sự để xem hợp đồng hiện hành.'}</p>
    {startsTooEarly && <div className="form-error" role="alert">Hợp đồng mới phải bắt đầu sau {formatDate(previous!.startDate)}.</div>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="form-actions"><button type="button" className="outline-button" onClick={onCancel}>Hủy</button><button className="primary-button" disabled={saving || reversed || startsTooEarly}>{saving ? 'Đang lưu…' : 'Lưu hợp đồng'}</button></div>
  </form>
}
