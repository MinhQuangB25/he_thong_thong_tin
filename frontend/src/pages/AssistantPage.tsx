import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { AssistantResult } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'
import { useAuth } from '../context/AuthContext'
import { useAssistantConversation } from '../context/AssistantConversationContext'

type Draft = Record<string, string | number>
type LeaveType = { id: number; name: string }

export function AssistantPage() {
  const { user } = useAuth()
  const { history, append, clear, finishProposal } = useAssistantConversation()
  const pendingQuestion = useRef<AbortController | null>(null)
  useEffect(() => () => pendingQuestion.current?.abort(), [])
  const isHr = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const isAdmin = user?.roles.includes('ADMIN') ?? false
  const personalSuggestions = isAdmin ? [] : ['Tôi muốn đổi email', 'Tôi muốn gửi đơn nghỉ phép']
  const suggestions = isHr
    ? ['Tổng số nhân sự tháng này?', 'Tổng thực lĩnh tháng này?', 'Công thức tính lương là gì?', ...personalSuggestions]
    : ['Bảng lương tháng này của tôi?', 'Đơn nghỉ của tôi đang ở trạng thái nào?',
      ...(user?.roles.includes('TEAM_LEADER') ? ['Chấm công nhóm tháng này?'] : []), ...personalSuggestions]
  const [question, setQuestion] = useState('')
  const [result, setResult] = useState<AssistantResult | null>(null)
  const [draft, setDraft] = useState<Draft>({})
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function ask(event: FormEvent) {
    event.preventDefault()
    if (!question.trim() || loading || saving) return
    const submittedQuestion = question.trim()
    const controller = new AbortController()
    pendingQuestion.current = controller
    setLoading(true); setError(''); setSuccess(''); setResult(null); setDraft({})
    try {
      const answer = await api<AssistantResult>('/assistant/answers', {
        method: 'POST', body: JSON.stringify({ question: submittedQuestion, history }), signal: controller.signal,
      })
      if (controller.signal.aborted) return
      append(submittedQuestion, answer)
      setQuestion('')
      setResult(answer)
      if (answer.kind === 'PROPOSAL') {
        setDraft(answer.proposal.payload)
        if (answer.proposal.action === 'CREATE_OWN_LEAVE') {
          setLeaveTypes(await api<LeaveType[]>('/leave-types', { signal: controller.signal }))
        }
      }
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Không thể liên hệ trợ lý AI')
    } finally {
      setLoading(false)
    }
  }

  async function confirm(event: FormEvent) {
    event.preventDefault()
    if (result?.kind !== 'PROPOSAL' || saving) return
    setSaving(true); setError(''); setSuccess('')
    try {
      if (result.proposal.action === 'UPDATE_OWN_PROFILE') {
        await api('/employees/me', { method: 'PATCH', body: JSON.stringify({
          email: String(draft.email ?? ''), phone: String(draft.phone ?? ''),
          expectedEmail: String(result.proposal.payload.expectedEmail ?? ''),
          expectedPhone: String(result.proposal.payload.expectedPhone ?? ''),
        }) })
      } else if (result.proposal.action === 'CREATE_OWN_LEAVE') {
        await api('/leave-requests', { method: 'POST', body: JSON.stringify({
          leaveTypeId: Number(draft.leaveTypeId), fromDate: String(draft.fromDate ?? ''),
          toDate: String(draft.toDate ?? ''), reason: String(draft.reason ?? ''),
        }) })
      } else if (result.proposal.action === 'CANCEL_OWN_LEAVE') {
        await api(`/leave-requests/${Number(draft.leaveRequestId)}/cancel`, { method: 'PATCH' })
      }
      setSuccess('Đã thực hiện yêu cầu. Dữ liệu đã được kiểm tra lại tại thời điểm xác nhận.')
      finishProposal(`Người dùng đã xác nhận thành công: ${result.proposal.summary}`)
      setResult(null); setDraft({})
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể thực hiện. Hãy kiểm tra dữ liệu rồi thử lại.')
    } finally {
      setSaving(false)
    }
  }

  function setField(name: string, value: string) { setDraft(current => ({ ...current, [name]: value })) }

  return <div className="assistant-page">
    <div className="page-heading compact"><div><span className="eyebrow">TRỢ LÝ THEO VAI TRÒ</span><h1>Trợ lý AI</h1><p>Hỏi về dữ liệu HRM trong phạm vi quyền của bạn. Mọi thay đổi đều cần bạn xác nhận.</p></div></div>
    <div className="assistant-layout">
      <section className="panel assistant-main" aria-label="Hỏi trợ lý">
        <div className="assistant-memory-toolbar">
          <p>Nhớ tối đa 4 lượt gần nhất trong phiên. Đăng xuất hoặc tải lại trang sẽ xóa hội thoại.</p>
          <button type="button" className="outline-button" disabled={loading || saving || !history.length}
            onClick={() => { clear(); setQuestion(''); setResult(null); setDraft({}); setError(''); setSuccess('') }}>Hội thoại mới</button>
        </div>
        {history.length > 0 && <details className="assistant-history">
          <summary>Lịch sử trong phiên ({history.length} lượt)</summary>
          <ol>{history.map((turn, index) => <li key={index}>
            <strong>Bạn: {turn.question}</strong><p>{result && index === history.length - 1
              ? 'Câu trả lời mới nhất được hiển thị bên dưới.' : `Trợ lý: ${turn.answer}`}</p>
          </li>)}</ol>
        </details>}
        <form onSubmit={ask} className="assistant-question-form">
          <label htmlFor="assistant-question">Câu hỏi hoặc yêu cầu</label>
          <textarea id="assistant-question" name="question" rows={3} maxLength={500} value={question}
            onChange={event => setQuestion(event.target.value)} placeholder="Ví dụ: Lương tháng này của tôi được tính thế nào?" />
          <div className="assistant-form-actions"><span>{question.length}/500 ký tự</span><button className="primary-button" disabled={loading || saving || !question.trim()}>{loading ? 'Đang xử lý…' : 'Gửi câu hỏi'}</button></div>
        </form>
        {loading && <StatusMessage type="info">Trợ lý đang xử lý câu hỏi; model local có thể cần ít phút khi khởi động lần đầu.</StatusMessage>}
        {error && <StatusMessage type="error">{error}</StatusMessage>}
        {success && <StatusMessage type="success">{success}</StatusMessage>}
        {!loading && !result && !success && <StatusMessage type="empty">Chọn câu hỏi gợi ý hoặc nhập yêu cầu của bạn.</StatusMessage>}
        {result?.kind === 'ANSWER' && <article className="assistant-response" aria-live="polite">
          <span className="eyebrow">CÂU TRẢ LỜI</span><p>{result.answer}</p>
          {result.facts.length > 0 && <dl className="assistant-facts">{result.facts.map((fact, index) => <div key={`${fact.label}-${index}`}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>}
          {result.sources.length > 0 && <p className="assistant-sources">Nguồn: <span>{result.sources.join(', ')}</span></p>}
        </article>}
        {result?.kind === 'PROPOSAL' && <form className="assistant-proposal" onSubmit={confirm} aria-label="Bản nháp chờ xác nhận">
          <span className="eyebrow">BẢN NHÁP — CHƯA LƯU</span><h2>{result.proposal.summary}</h2>
          {result.proposal.action === 'UPDATE_OWN_PROFILE' && <div className="assistant-fields">
            <label htmlFor="assistant-email">Email<input id="assistant-email" name="email" type="email" required value={String(draft.email ?? '')} onChange={event => setField('email', event.target.value)} /></label>
            <label htmlFor="assistant-phone">Số điện thoại<input id="assistant-phone" name="phone" required value={String(draft.phone ?? '')} onChange={event => setField('phone', event.target.value)} /></label>
          </div>}
          {result.proposal.action === 'CREATE_OWN_LEAVE' && <div className="assistant-fields">
            <label htmlFor="assistant-leave-type">Loại nghỉ<select id="assistant-leave-type" name="leaveTypeId" required value={String(draft.leaveTypeId ?? '')} onChange={event => setField('leaveTypeId', event.target.value)}><option value="">Chọn loại nghỉ</option>{leaveTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
            <label htmlFor="assistant-from">Từ ngày<input id="assistant-from" name="fromDate" type="date" required value={String(draft.fromDate ?? '')} onChange={event => setField('fromDate', event.target.value)} /></label>
            <label htmlFor="assistant-to">Đến ngày<input id="assistant-to" name="toDate" type="date" required value={String(draft.toDate ?? '')} onChange={event => setField('toDate', event.target.value)} /></label>
            <label htmlFor="assistant-reason">Lý do<textarea id="assistant-reason" name="reason" rows={2} required value={String(draft.reason ?? '')} onChange={event => setField('reason', event.target.value)} /></label>
          </div>}
          {result.proposal.action === 'CANCEL_OWN_LEAVE' && <p>Đơn #{String(draft.leaveRequestId)} sẽ được hủy nếu vẫn đang chờ duyệt. Nếu không đúng đơn, hãy hỏi lại.</p>}
          <div className="assistant-form-actions"><button type="button" className="outline-button" disabled={saving} onClick={() => { finishProposal('Người dùng đã bỏ bản nháp; chưa ghi dữ liệu.'); setResult(null); setDraft({}) }}>Bỏ bản nháp</button><button className="primary-button" disabled={saving}>{saving ? 'Đang xác nhận…' : 'Xác nhận thực hiện'}</button></div>
        </form>}
      </section>
      <aside className="panel assistant-aside"><span className="eyebrow">GỢI Ý</span><h2>Bạn có thể hỏi</h2>
        <div className="assistant-suggestions">{suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)}>{suggestion} <span aria-hidden="true">↗</span></button>)}</div>
        <p className="assistant-note">Trợ lý chỉ dùng dữ liệu hệ thống. Không có chính sách hoặc số liệu phù hợp thì sẽ nói rõ, không suy đoán.</p>
      </aside>
    </div>
  </div>
}
