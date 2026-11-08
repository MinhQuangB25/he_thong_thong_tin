import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { AnnualPayrollSummary, CalculationRule, Employee, Payroll, PayrollPeriod } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'
import { payrollStatusLabel } from '../utils/labels'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function PayrollPage() {
  const { user } = useAuth()
  const canManage = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const today = new Date()
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [year, setYear] = useState(today.getFullYear())
  const [items, setItems] = useState<Payroll[]>([])
  const [summary, setSummary] = useState<AnnualPayrollSummary | null>(null)
  const [rule, setRule] = useState<CalculationRule | null>(null)
  const [period, setPeriod] = useState<PayrollPeriod | null>(null)
  const [recipient, setRecipient] = useState<Employee | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  const pageRef = useRef<HTMLDivElement>(null)
  const requestVersion = useRef(0)
  const validYear = Number.isInteger(year) && year >= 2020 && year <= 2100
  const periodStatus = period?.status ?? items.find(item => item.month === month && item.year === year)?.status
  const managementDisabled = working || loading || !validYear || !!error || periodStatus === 'LOCKED'

  function print(mode: 'month' | 'year') {
    if (!pageRef.current || loading || !validYear || error) return
    // The print snapshot must see the selection synchronously.
    pageRef.current.dataset.printMode = mode
    pageRef.current.dataset.printScope = mode
    window.print()
  }

  async function load() {
    const version = ++requestVersion.current
    if (!validYear) {
      setItems([]); setSummary(null); setPeriod(null); setRule(null); setRecipient(null)
      setError('Năm phải là số nguyên từ 2020 đến 2100.'); setLoading(false)
      return
    }
    setLoading(true); setError('')
    try {
      const [payrollData, summaryData, ruleData, periods, employee] = await Promise.all([
        api<Payroll[]>(`/payrolls?month=${month}&year=${year}`),
        api<AnnualPayrollSummary>(`/payrolls/annual-summary?year=${year}`),
        api<CalculationRule>('/payrolls/calculation-rule'),
        canManage ? api<PayrollPeriod[]>(`/payroll-periods?month=${month}&year=${year}`) : Promise.resolve([]),
        canManage ? Promise.resolve(null) : api<Employee>('/employees/me'),
      ])
      if (version !== requestVersion.current) return
      setItems(payrollData); setSummary(summaryData); setRule(ruleData); setPeriod(periods[0] ?? null); setRecipient(employee)
    } catch (cause) {
      if (version === requestVersion.current) {
        setItems([]); setSummary(null); setPeriod(null); setRule(null); setRecipient(null)
        setError(cause instanceof Error ? cause.message : 'Không thể tải bảng lương')
      }
    } finally { if (version === requestVersion.current) setLoading(false) }
  }

  useEffect(() => { void load(); return () => { requestVersion.current++ } }, [month, year, canManage])

  async function manage(action: 'generate' | 'lock') {
    if (!canManage || managementDisabled || (action === 'lock' && !period)) return
    setWorking(true); setError('')
    try {
      let current = period
      if (!current) current = await api<PayrollPeriod>('/payroll-periods', { method: 'POST', body: JSON.stringify({ month, year }) })
      if (action === 'generate') await api(`/payroll-periods/${current.id}/generate`, { method: 'POST' })
      else await api(`/payroll-periods/${current.id}/lock`, { method: 'PATCH' })
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật kỳ lương') } finally { setWorking(false) }
  }

  return <div ref={pageRef} className="payroll-page">
    <div className="page-heading compact"><div><span className="eyebrow">TIỀN LƯƠNG</span><h1>Bảng lương</h1><p>Snapshot thu nhập được khóa theo từng kỳ, minh bạch và dễ kiểm tra.</p></div><button className="primary-button" disabled={loading || !validYear || !!error} onClick={() => print('month')}>In bảng lương tháng</button></div>
    <section className="panel payroll-filters"><label>Tháng<select id="payroll-month" name="month" disabled={working} value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Năm<input id="payroll-year" name="year" type="number" min="2020" max="2100" step="1" disabled={working} aria-invalid={!validYear} value={year || ''} onChange={event => setYear(Number(event.target.value))} /></label>{canManage && <div className="payroll-actions"><button className="outline-button" disabled={managementDisabled} onClick={() => void manage('generate')}>{working ? 'Đang xử lý…' : 'Tạo / tính kỳ lương'}</button><button className="text-button" disabled={managementDisabled || !period} onClick={() => void manage('lock')}>Khóa kỳ lương</button></div>}</section>
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {loading ? <StatusMessage type="info">Đang tải bảng lương…</StatusMessage> : <>
      <section className="payroll-kpis"><div><span>THỰC LĨNH THÁNG {month}/{year}</span><strong>{money.format(items.reduce((sum, item) => sum + item.netSalary, 0))}</strong></div><div><span>TỔNG THỰC LĨNH NĂM {year}</span><strong>{money.format(summary?.totalNetSalary || 0)}</strong></div><div><span>TRẠNG THÁI KỲ</span><strong><span className={`badge ${periodStatus === 'LOCKED' ? 'success' : 'warning'}`}>{periodStatus ? payrollStatusLabel(periodStatus) : 'CHƯA TẠO'}</span></strong></div></section>
      {rule && <section className="panel payroll-rule"><div><span className="eyebrow">QUY TẮC TÍNH</span><h2>Cách tính lương</h2></div><p>{rule.formula}</p><small>Ngày công chuẩn: <strong>{rule.standardWorkDays}</strong> · Hệ số tăng ca: <strong>{rule.overtimeMultiplier}</strong></small></section>}
      <section className="panel table-panel" data-print-section="month"><div className="panel-heading"><div><span className="eyebrow">CHI TIẾT THEO THÁNG</span><h2>Bảng lương tháng {month}/{year}</h2></div><span className="count-pill">{items.length} nhân sự</span></div>{!items.length ? <StatusMessage type="empty">Chưa có bảng lương trong kỳ đã chọn.</StatusMessage> : <div className="responsive-table"><table><caption className="sr-only">Chi tiết bảng lương theo tháng</caption><thead><tr><th>NHÂN SỰ</th><th>NGÀY CÔNG</th><th>LƯƠNG CƠ BẢN</th><th>TĂNG CA</th><th>PHỤ CẤP</th><th>KHẤU TRỪ</th><th>THỰC LĨNH</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.employeeName}</strong></td><td>{item.workedDays}</td><td>{money.format(item.baseSalary)}</td><td>{money.format(item.overtimePay)}</td><td>{money.format(item.allowances)}</td><td>{money.format(item.deductions)}</td><td className="money">{money.format(item.netSalary)}</td></tr>)}</tbody></table></div>}</section>
      <section className="panel annual-payroll" data-print-section="year"><div className="panel-heading"><div><span className="eyebrow">TỔNG HỢP NĂM</span><h2>Tổng hợp bảng lương năm {year}</h2></div><button className="outline-button" disabled={loading || !validYear || !!error} onClick={() => print('year')}>In bảng lương năm</button></div>{recipient && <p className="payroll-recipient">Nhân viên: <strong>{recipient.fullName}</strong> · Mã NV: <strong>{recipient.employeeCode}</strong></p>}<div className="annual-grid"><AnnualValue label="Lương cơ bản" value={summary?.totalBaseSalary || 0} /><AnnualValue label="Phụ cấp" value={summary?.totalAllowances || 0} /><AnnualValue label="Tăng ca" value={summary?.totalOvertimePay || 0} /><AnnualValue label="Khấu trừ" value={summary?.totalDeductions || 0} /><AnnualValue label="Thực lĩnh" value={summary?.totalNetSalary || 0} /></div></section>
    </>}
  </div>
}

function AnnualValue({ label, value }: { label: string; value: number }) { return <div><span>{label}</span><strong>{money.format(value)}</strong></div> }
