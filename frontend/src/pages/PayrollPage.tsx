import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { AnnualPayrollSummary, CalculationRule, Payroll, PayrollPeriod } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'

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
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)

  async function load() {
    setLoading(true); setError('')
    try {
      const requests: Promise<unknown>[] = [
        api<Payroll[]>(`/payrolls?month=${month}&year=${year}`),
        api<AnnualPayrollSummary>(`/payrolls/annual-summary?year=${year}`),
        api<CalculationRule>('/payrolls/calculation-rule'),
      ]
      if (canManage) requests.push(api<PayrollPeriod[]>(`/payroll-periods?month=${month}&year=${year}`))
      const [payrollData, summaryData, ruleData, periods] = await Promise.all(requests) as [Payroll[], AnnualPayrollSummary, CalculationRule, PayrollPeriod[] | undefined]
      setItems(payrollData); setSummary(summaryData); setRule(ruleData); setPeriod(periods?.[0] ?? null)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải bảng lương') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [month, year, canManage])

  async function manage(action: 'generate' | 'lock') {
    setWorking(true); setError('')
    try {
      let current = period
      if (!current) current = await api<PayrollPeriod>('/payroll-periods', { method: 'POST', body: JSON.stringify({ month, year }) })
      if (action === 'generate') await api(`/payroll-periods/${current.id}/generate`, { method: 'POST' })
      else await api(`/payroll-periods/${current.id}/lock`, { method: 'PATCH' })
      await load()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật kỳ lương') } finally { setWorking(false) }
  }

  return <div className="payroll-page">
    <div className="page-heading compact"><div><span className="eyebrow">PAYROLL REPORTING</span><h1>Bảng lương</h1><p>Snapshot thu nhập được khóa theo từng kỳ, minh bạch và dễ kiểm tra.</p></div><button className="primary-button" onClick={() => window.print()}>In bảng lương tháng</button></div>
    <section className="panel payroll-filters"><label>Tháng<select value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Năm<input type="number" min="2020" max="2100" value={year} onChange={event => setYear(Number(event.target.value))} /></label>{canManage && <div className="payroll-actions"><button className="outline-button" disabled={working} onClick={() => void manage('generate')}>{working ? 'Đang xử lý…' : 'Tạo / tính kỳ lương'}</button><button className="text-button" disabled={working || !period} onClick={() => void manage('lock')}>Khóa kỳ lương</button></div>}</section>
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {loading ? <StatusMessage type="info">Đang tải bảng lương…</StatusMessage> : <>
      <section className="payroll-kpis"><div><span>THỰC LĨNH THÁNG {month}/{year}</span><strong>{money.format(items.reduce((sum, item) => sum + item.netSalary, 0))}</strong></div><div><span>TỔNG THỰC LĨNH NĂM {year}</span><strong>{money.format(summary?.totalNetSalary || 0)}</strong></div><div><span>TRẠNG THÁI KỲ</span><strong><span className={`badge ${period?.status === 'LOCKED' ? 'success' : 'warning'}`}>{period?.status || 'CHƯA TẠO'}</span></strong></div></section>
      {rule && <section className="panel payroll-rule"><div><span className="eyebrow">CALCULATION RULE</span><h2>Cách tính lương</h2></div><p>{rule.formula}</p><small>Ngày công chuẩn: <strong>{rule.standardWorkDays}</strong> · Hệ số tăng ca: <strong>{rule.overtimeMultiplier}</strong></small></section>}
      <section className="panel table-panel"><div className="panel-heading"><div><span className="eyebrow">PAYSLIP HISTORY</span><h2>Bảng lương tháng {month}/{year}</h2></div><span className="count-pill">{items.length} nhân sự</span></div>{!items.length ? <StatusMessage type="empty">Chưa có bảng lương trong kỳ đã chọn.</StatusMessage> : <div className="responsive-table"><table><caption className="sr-only">Chi tiết bảng lương theo tháng</caption><thead><tr><th>NHÂN SỰ</th><th>NGÀY CÔNG</th><th>LƯƠNG CƠ BẢN</th><th>TĂNG CA</th><th>PHỤ CẤP</th><th>KHẤU TRỪ</th><th>THỰC LĨNH</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><strong>{item.employeeName}</strong></td><td>{item.workedDays}</td><td>{money.format(item.baseSalary)}</td><td>{money.format(item.overtimePay)}</td><td>{money.format(item.allowances)}</td><td>{money.format(item.deductions)}</td><td className="money">{money.format(item.netSalary)}</td></tr>)}</tbody></table></div>}</section>
      <section className="panel annual-payroll"><div className="panel-heading"><div><span className="eyebrow">YEARLY SUMMARY</span><h2>Tổng hợp bảng lương năm {year}</h2></div><button className="outline-button" onClick={() => window.print()}>In bảng lương năm</button></div><div className="annual-grid"><AnnualValue label="Lương cơ bản" value={summary?.totalBaseSalary || 0} /><AnnualValue label="Phụ cấp" value={summary?.totalAllowances || 0} /><AnnualValue label="Tăng ca" value={summary?.totalOvertimePay || 0} /><AnnualValue label="Khấu trừ" value={summary?.totalDeductions || 0} /><AnnualValue label="Thực lĩnh" value={summary?.totalNetSalary || 0} /></div></section>
    </>}
  </div>
}

function AnnualValue({ label, value }: { label: string; value: number }) { return <div><span>{label}</span><strong>{money.format(value)}</strong></div> }
