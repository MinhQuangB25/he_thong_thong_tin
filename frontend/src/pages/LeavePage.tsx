import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Leave, Page } from '../api/types'
import { Pagination } from '../components/Pagination'
import { StatusMessage } from '../components/StatusMessage'
import { formatDate, inclusiveDays, localDate } from '../utils/dates'
import { leaveStatusLabel } from '../utils/labels'

type LeaveType = { id: number; name: string }

function leaveBadge(status: string) { return status === 'APPROVED' ? 'success' : status === 'PENDING' ? 'warning' : 'muted' }

export function LeavePage() {
  const { user } = useAuth()
  const canReview = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const [data, setData] = useState<Page<Leave> | null>(null)
  const [types, setTypes] = useState<LeaveType[]>([])
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [status, setStatus] = useState('')
  const requestId = useRef(0)

  const load = () => {
    const id = ++requestId.current
    setLoading(true); setError('')
    api<Page<Leave>>(`/leave-requests?size=20&page=${page}&sort=submittedAt,desc${status ? '&status=' + status : ''}`)
      .then(result => { if (id === requestId.current) setData(result) })
      .catch(e => { if (id === requestId.current) setError(e instanceof Error ? e.message : 'Không thể tải đơn nghỉ') })
      .finally(() => { if (id === requestId.current) setLoading(false) })
  }
  useEffect(() => { load(); return () => { requestId.current++ } }, [page, status])
  useEffect(() => { api<LeaveType[]>('/leave-types').then(setTypes).catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải loại nghỉ')) }, [])

  async function review(item: Leave, nextStatus: 'APPROVED' | 'REJECTED') {
    let rejectionReason: string | undefined
    if (nextStatus === 'REJECTED') {
      const reason = window.prompt(`Lý do từ chối đơn của ${item.employeeName}:`)
      if (reason === null) return
      rejectionReason = reason.trim() || undefined
    }
    setBusyId(item.id); setError(''); setSuccess('')
    try {
      await api(`/leave-requests/${item.id}/review`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, rejectionReason }) })
      setSuccess(nextStatus === 'APPROVED' ? `Đã duyệt đơn của ${item.employeeName}.` : `Đã từ chối đơn của ${item.employeeName}.`)
      load()
    } catch (e) { setError(e instanceof Error ? e.message : 'Không thể cập nhật') } finally { setBusyId(null) }
  }

  async function cancel(item: Leave) {
    if (!window.confirm('Hủy đơn nghỉ này? Đơn đã hủy không thể khôi phục.')) return
    setBusyId(item.id); setError(''); setSuccess('')
    try { await api(`/leave-requests/${item.id}/cancel`, { method: 'PATCH' }); setSuccess('Đã hủy đơn nghỉ.'); load() }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể hủy đơn') } finally { setBusyId(null) }
  }

  return <div>
    <div className="page-heading compact"><div><span className="eyebrow">ĐƠN TỪ</span><h1>Đơn từ & phê duyệt</h1><p>Theo dõi minh bạch mọi yêu cầu nghỉ của đội ngũ.</p></div>{!user?.roles.includes('ADMIN') && <button className="primary-button" onClick={() => setShowForm(!showForm)}>＋ Tạo đơn nghỉ</button>}</div>
    {showForm && <LeaveForm types={types} onCancel={() => setShowForm(false)} onDone={() => { setShowForm(false); setSuccess('Đã gửi đơn nghỉ, vui lòng chờ duyệt.'); load() }} />}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {success && <StatusMessage type="success">{success}</StatusMessage>}
    <section className="panel table-panel">
      <div className="panel-heading"><div><span className="eyebrow">HỘP ĐƠN</span><h2>Danh sách đơn nghỉ</h2></div><span className="count-pill">{data?.totalElements ?? 0} đơn</span></div>
      <div className="table-toolbar"><label className="toolbar-field">Trạng thái đơn<select name="leave-status-filter" value={status} onChange={event => { setPage(0); setStatus(event.target.value) }}><option value="">Tất cả</option><option value="PENDING">Chờ duyệt</option><option value="APPROVED">Đã duyệt</option><option value="REJECTED">Từ chối</option><option value="CANCELLED">Đã hủy</option></select></label></div>
      {loading ? <StatusMessage type="info">Đang tải…</StatusMessage> : !data?.content.length ? <StatusMessage type="empty">Chưa có đơn nghỉ.</StatusMessage> : <div className="responsive-table stack-table"><table><caption className="sr-only">Danh sách đơn nghỉ</caption><thead><tr><th>NHÂN SỰ</th><th>LOẠI NGHỈ</th><th>THỜI GIAN</th><th>LÝ DO</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{data.content.map(item => <tr key={item.id}>
        <td data-label="Nhân sự"><strong>{item.employeeName}</strong></td>
        <td data-label="Loại nghỉ">{item.leaveType}</td>
        <td data-label="Thời gian">{formatDate(item.fromDate)} → {formatDate(item.toDate)}<small className="cell-note">{inclusiveDays(item.fromDate, item.toDate)} ngày</small></td>
        <td data-label="Lý do" className="wrap-cell">{item.reason}</td>
        <td data-label="Trạng thái"><span className={`badge ${leaveBadge(item.status)}`}>{leaveStatusLabel(item.status)}</span>{item.status === 'REJECTED' && item.rejectionReason && <small className="cell-note">Lý do: {item.rejectionReason}</small>}</td>
        <td data-label="Thao tác"><div className="row-actions">{canReview && item.status === 'PENDING' && <><button className="approve" disabled={busyId === item.id} onClick={() => void review(item, 'APPROVED')} aria-label={`Duyệt đơn của ${item.employeeName}`}>✓ Duyệt</button><button className="reject" disabled={busyId === item.id} onClick={() => void review(item, 'REJECTED')} aria-label={`Từ chối đơn của ${item.employeeName}`}>× Từ chối</button></>}{!canReview && item.status === 'PENDING' && <button className="text-button" disabled={busyId === item.id} onClick={() => void cancel(item)}>Hủy đơn</button>}{item.status !== 'PENDING' && <span className="muted-text">—</span>}</div></td>
      </tr>)}</tbody></table></div>}
      <div className="table-footer"><span>{data?.totalElements ?? 0} đơn</span><Pagination page={page} totalPages={data?.totalPages ?? 0} disabled={loading} onChange={setPage} /></div>
    </section>
  </div>
}

function LeaveForm({ types, onDone, onCancel }: { types: LeaveType[]; onDone: () => void; onCancel: () => void }) {
  const today = localDate(new Date())
  const [form, setForm] = useState({ leaveTypeId: '', fromDate: '', toDate: '', reason: '' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const days = inclusiveDays(form.fromDate, form.toDate)
  const reversed = !!form.fromDate && !!form.toDate && form.toDate < form.fromDate

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (reversed) { setError('Đến ngày phải bằng hoặc sau Từ ngày.'); return }
    setSaving(true); setError('')
    try { await api('/leave-requests', { method: 'POST', body: JSON.stringify({ ...form, leaveTypeId: Number(form.leaveTypeId) }) }); onDone() }
    catch (err) { setError(err instanceof Error ? err.message : 'Không thể tạo đơn') } finally { setSaving(false) }
  }

  return <form className="panel inline-form" onSubmit={submit}>
    <div className="panel-heading"><div><span className="eyebrow">ĐƠN MỚI</span><h2>Tạo đơn nghỉ</h2></div></div>
    <div className="form-grid">
      <label>Loại nghỉ<select name="leaveTypeId" required value={form.leaveTypeId} onChange={e => setForm({ ...form, leaveTypeId: e.target.value })}><option value="">Chọn loại nghỉ</option>{types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
      <label>Từ ngày<input name="fromDate" required type="date" min={today} value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} /></label>
      <label>Đến ngày<input name="toDate" required type="date" min={form.fromDate || today} aria-invalid={reversed} value={form.toDate} onChange={e => setForm({ ...form, toDate: e.target.value })} /></label>
      <label className="span-two">Lý do<textarea name="reason" required rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} /></label>
    </div>
    <p className="form-hint" aria-live="polite">{reversed ? 'Đến ngày phải bằng hoặc sau Từ ngày.' : days ? <>Tổng thời gian nghỉ: <strong>{days} ngày</strong></> : 'Chọn ngày bắt đầu và kết thúc để xem số ngày nghỉ.'}</p>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="form-actions"><button type="button" className="outline-button" onClick={onCancel}>Hủy</button><button className="primary-button" disabled={saving || reversed}>{saving ? 'Đang gửi…' : 'Gửi đơn'}</button></div>
  </form>
}
