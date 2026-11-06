import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { EmployeeReport } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'
import { formatDate } from '../utils/dates'
import { employeeStatusLabel } from '../utils/labels'

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function ReportsPage() {
  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [report, setReport] = useState<EmployeeReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setReport(null)
    if (!Number.isInteger(year) || year < 2020 || year > 2100) { setLoading(false); setError('Năm phải từ 2020 đến 2100'); return }
    setLoading(true); setError('')
    api<EmployeeReport>(`/reports/employees?month=${month}&year=${year}`)
      .then(value => { if (!cancelled) setReport(value) })
      .catch(cause => { if (!cancelled) setError(cause instanceof Error ? cause.message : 'Không thể tải báo cáo') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [month, year])

  return <div className="reports-page">
    <div className="page-heading compact"><div><span className="eyebrow">BÁO CÁO</span><h1>Báo cáo nhân sự</h1><p>Thống kê trạng thái, trình độ, mức lương và thâm niên tại ngày cuối tháng.</p></div><button className="outline-button" disabled={loading || !!error || !report} onClick={() => window.print()}>In báo cáo</button></div>
    <section className="panel report-filters"><label>Tháng<select name="month" value={month} onChange={event => setMonth(Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}</option>)}</select></label><label>Năm<input name="year" type="number" min="2020" max="2100" value={year} onChange={event => setYear(Number(event.target.value))} /></label><span className="report-as-of">Báo cáo đến ngày {report?.asOf ? formatDate(report.asOf) : '—'}</span></section>
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {loading && <StatusMessage type="info">Đang tải báo cáo…</StatusMessage>}
    {!loading && report && <>
      <section className="report-kpis"><ReportMetric label="Tổng nhân sự" value={report.totalEmployees} /><ReportMetric label="Đang làm" value={report.active} tone="success" /><ReportMetric label="Đang nghỉ" value={report.onLeave} tone="warning" /><ReportMetric label="Đã nghỉ việc" value={report.terminated} tone="muted" /></section>
      <section className="report-grid"><ReportList title="Trình độ học vấn" items={report.education} /><ReportList title="Thâm niên" items={report.tenure} /><section className="panel report-salary"><span className="eyebrow">MỨC LƯƠNG</span><h2>Thống kê mức lương</h2><div className="salary-stat"><span>Thấp nhất</span><strong>{money.format(report.salary.minBaseSalary)}</strong></div><div className="salary-stat"><span>Cao nhất</span><strong>{money.format(report.salary.maxBaseSalary)}</strong></div><div className="salary-stat"><span>Trung bình</span><strong>{money.format(report.salary.averageBaseSalary)}</strong></div><div className="salary-stat"><span>Tổng phụ cấp</span><strong>{money.format(report.salary.totalAllowances)}</strong></div></section></section>
      <section className="panel table-panel report-status-table"><div className="panel-heading"><div><span className="eyebrow">CUỐI THÁNG</span><h2>Tình hình nhân sự</h2></div><span className="count-pill">{report.statuses.length} người</span></div><div className="responsive-table"><table><caption className="sr-only">Tình hình nhân sự cuối tháng</caption><thead><tr><th>NHÂN SỰ</th><th>PHÒNG BAN</th><th>TRÌNH ĐỘ</th><th>THÂM NIÊN</th><th>LƯƠNG CƠ BẢN</th><th>TRẠNG THÁI</th></tr></thead><tbody>{report.statuses.map(row => <tr key={row.employeeId}><td><strong>{row.fullName}</strong><small>{row.employeeCode}</small></td><td>{row.departmentName}</td><td>{row.educationLevel}</td><td>{row.tenureMonths} tháng</td><td>{money.format(row.baseSalary)}</td><td><span className={`badge ${row.status === 'ACTIVE' ? 'success' : row.status === 'ON_LEAVE' ? 'warning' : 'muted'}`}>{employeeStatusLabel(row.status)}</span></td></tr>)}</tbody></table></div></section>
    </>}
  </div>
}

function ReportMetric({ label, value, tone = '' }: { label: string; value: number; tone?: string }) { return <div className={`metric-card report-metric ${tone}`}><span className="metric-label">{label}</span><strong className="metric-value">{value}</strong></div> }
function ReportList({ title, items }: { title: string; items: { label: string; count: number }[] }) { return <section className="panel report-list-panel"><span className="eyebrow">CƠ CẤU NHÂN SỰ</span><h2>{title}</h2>{items.length ? items.map(item => <div className="report-list-row" key={item.label}><span>{item.label}</span><strong>{item.count}</strong></div>) : <StatusMessage type="empty">Chưa có dữ liệu.</StatusMessage>}</section> }
