import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { api } from '../api/client'
import type { AssistantResult } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { useAssistantConversation, type AssistantProposal, type ChatMessage } from '../context/AssistantConversationContext'
import { Icon } from './Icon'
import { formatFactValue } from '../utils/labels'

type Draft = Record<string, string | number>
type LeaveType = { id: number; name: string }

export function AssistantChat({ variant, autoFocus = false }: { variant: 'page' | 'widget'; autoFocus?: boolean }) {
  const { user } = useAuth()
  const { history, messages, record, resolveProposal, clear } = useAssistantConversation()
  const pendingRequest = useRef<AbortController | null>(null)
  const threadEnd = useRef<HTMLDivElement>(null)
  const input = useRef<HTMLTextAreaElement>(null)
  const [question, setQuestion] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState('')
  const [error, setError] = useState('')
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})
  const [savingId, setSavingId] = useState<number | null>(null)
  const [proposalErrors, setProposalErrors] = useState<Record<number, string>>({})
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const loading = !!pendingQuestion

  const isHr = user?.roles.some(role => role === 'ADMIN' || role === 'HR_MANAGER') ?? false
  const isAdmin = user?.roles.includes('ADMIN') ?? false
  const personalSuggestions = isAdmin ? [] : ['Tôi muốn đổi email', 'Tôi muốn gửi đơn nghỉ phép']
  const suggestions = isHr
    ? ['Tổng số nhân sự tháng này?', 'Tổng thực lĩnh tháng này?', 'Công thức tính lương là gì?', ...personalSuggestions]
    : ['Bảng lương tháng này của tôi?', 'Đơn nghỉ của tôi đang ở trạng thái nào?',
      ...(user?.roles.includes('TEAM_LEADER') ? ['Chấm công nhóm tháng này?'] : []), ...personalSuggestions]

  // Leaving the page or closing the widget cancels the request; a late answer must not appear.
  useEffect(() => () => pendingRequest.current?.abort(), [])
  useEffect(() => { if (autoFocus) input.current?.focus() }, [autoFocus])
  useEffect(() => { threadEnd.current?.scrollIntoView?.({ block: 'end' }) }, [messages.length, pendingQuestion])

  const needsLeaveTypes = messages.some(message => message.role === 'assistant' && message.kind === 'proposal'
    && message.status === 'pending' && message.proposal.action === 'CREATE_OWN_LEAVE')
  useEffect(() => {
    if (!needsLeaveTypes || leaveTypes.length) return
    api<LeaveType[]>('/leave-types').then(setLeaveTypes).catch(() => setLeaveTypes([]))
  }, [needsLeaveTypes, leaveTypes.length])

  async function send(text: string) {
    const submitted = text.trim()
    if (!submitted || loading || savingId !== null) return
    // A new question replaces an unanswered draft; it is never saved implicitly.
    const open = [...messages].reverse().find(message => message.role === 'assistant' && message.kind === 'proposal' && message.status === 'pending')
    const dismissedNote = 'Người dùng đã bỏ bản nháp; chưa ghi dữ liệu.'
    if (open) resolveProposal(open.id, 'dismissed', dismissedNote)
    // State updates land after this render, so build the context that matches what the user now sees.
    const requestHistory = open && history.length
      ? history.map((turn, index) => index === history.length - 1 ? { ...turn, answer: dismissedNote } : turn)
      : history
    const controller = new AbortController()
    pendingRequest.current = controller
    setPendingQuestion(submitted); setError(''); setQuestion('')
    try {
      const answer = await api<AssistantResult>('/assistant/answers', {
        method: 'POST', body: JSON.stringify({ question: submitted, history: requestHistory }), signal: controller.signal,
      })
      if (controller.signal.aborted) return
      // Load leave types before showing a leave draft so its required select is usable at once.
      if (answer.kind === 'PROPOSAL' && answer.proposal.action === 'CREATE_OWN_LEAVE' && !leaveTypes.length) {
        setLeaveTypes(await api<LeaveType[]>('/leave-types', { signal: controller.signal }))
        if (controller.signal.aborted) return
      }
      record(submitted, answer)
    } catch (cause) {
      if (controller.signal.aborted) return
      setQuestion(submitted)
      setError(cause instanceof Error ? cause.message : 'Không thể liên hệ trợ lý AI')
    } finally {
      if (!controller.signal.aborted) setPendingQuestion('')
    }
  }

  function submit(event: FormEvent) { event.preventDefault(); void send(question) }
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); void send(question) }
  }

  function draftFor(message: Extract<ChatMessage, { kind: 'proposal' }>) { return drafts[message.id] ?? message.proposal.payload }
  function setField(id: number, payload: Draft, name: string, value: string) {
    setDrafts(current => ({ ...current, [id]: { ...(current[id] ?? payload), [name]: value } }))
  }

  async function confirm(event: FormEvent, message: Extract<ChatMessage, { kind: 'proposal' }>) {
    event.preventDefault()
    if (savingId !== null) return
    const draft = draftFor(message)
    const proposal: AssistantProposal = message.proposal
    setSavingId(message.id); setProposalErrors(current => ({ ...current, [message.id]: '' }))
    try {
      if (proposal.action === 'UPDATE_OWN_PROFILE') {
        await api('/employees/me', { method: 'PATCH', body: JSON.stringify({
          email: String(draft.email ?? ''), phone: String(draft.phone ?? ''),
          expectedEmail: String(proposal.payload.expectedEmail ?? ''),
          expectedPhone: String(proposal.payload.expectedPhone ?? ''),
        }) })
      } else if (proposal.action === 'CREATE_OWN_LEAVE') {
        await api('/leave-requests', { method: 'POST', body: JSON.stringify({
          leaveTypeId: Number(draft.leaveTypeId), fromDate: String(draft.fromDate ?? ''),
          toDate: String(draft.toDate ?? ''), reason: String(draft.reason ?? ''),
        }) })
      } else if (proposal.action === 'CANCEL_OWN_LEAVE') {
        await api(`/leave-requests/${Number(draft.leaveRequestId)}/cancel`, { method: 'PATCH' })
      }
      resolveProposal(message.id, 'confirmed', `Người dùng đã xác nhận thành công: ${proposal.summary}`,
        'Đã thực hiện yêu cầu. Dữ liệu đã được kiểm tra lại tại thời điểm xác nhận.')
    } catch (cause) {
      setProposalErrors(current => ({ ...current, [message.id]: cause instanceof Error ? cause.message : 'Không thể thực hiện. Hãy kiểm tra dữ liệu rồi thử lại.' }))
    } finally {
      setSavingId(null)
    }
  }

  function newConversation() {
    pendingRequest.current?.abort()
    setPendingQuestion(''); setQuestion(''); setError(''); setDrafts({}); setProposalErrors({})
    clear()
    input.current?.focus()
  }

  return <section className={`assistant-chat ${variant}`} aria-label="Hội thoại với trợ lý">
    <div className="assistant-chat-toolbar">
      <p>Nhớ 4 lượt gần nhất trong phiên đăng nhập. Mọi thay đổi đều cần bạn xác nhận.</p>
      <button type="button" className="text-button" disabled={savingId !== null || (!messages.length && !loading)} onClick={newConversation}>Hội thoại mới</button>
    </div>
    <div className="assistant-thread" role="log" aria-live="polite" aria-label="Tin nhắn">
      {!messages.length && !loading && <div className="assistant-welcome">
        <span className="assistant-avatar" aria-hidden="true"><Icon name="assistant" /></span>
        <div><strong>Xin chào{user?.displayName ? `, ${user.displayName}` : ''}!</strong><p>Tôi trả lời dựa trên dữ liệu HRM trong phạm vi quyền của bạn. Bạn có thể hỏi:</p></div>
        <div className="assistant-chips">{suggestions.map(suggestion => <button type="button" key={suggestion} onClick={() => void send(suggestion)}>{suggestion}</button>)}</div>
      </div>}
      {messages.map(message => message.role === 'user'
        ? <div key={message.id} className="chat-row user"><div className="chat-bubble user">{message.text}</div></div>
        : <div key={message.id} className="chat-row assistant">
          <span className="assistant-avatar" aria-hidden="true"><Icon name="assistant" /></span>
          {message.kind === 'answer' && <div className={`chat-bubble assistant${message.facts.length ? ' has-facts' : ''}`}>
            <p>{message.text}</p>
            {message.facts.length > 0 && <dl className="chat-facts">{message.facts.map((fact, index) => <div key={`${fact.label}-${index}`}><dt>{fact.label}</dt><dd>{formatFactValue(fact.value)}</dd></div>)}</dl>}
            {message.sources.length > 0 && <p className="chat-sources">Nguồn: <span>{message.sources.join(', ')}</span></p>}
          </div>}
          {message.kind === 'notice' && <div className="chat-bubble assistant notice" role="status">{message.text}</div>}
          {message.kind === 'proposal' && (message.status === 'pending'
            ? <ProposalCard message={message} draft={draftFor(message)} leaveTypes={leaveTypes} saving={savingId === message.id}
              error={proposalErrors[message.id] ?? ''} onField={(name, value) => setField(message.id, message.proposal.payload, name, value)}
              onConfirm={event => void confirm(event, message)}
              onDismiss={() => resolveProposal(message.id, 'dismissed', 'Người dùng đã bỏ bản nháp; chưa ghi dữ liệu.', 'Đã bỏ bản nháp, chưa ghi dữ liệu.')} />
            : <div className="chat-bubble assistant muted">Bản nháp “{message.proposal.summary}” {message.status === 'confirmed' ? 'đã được xác nhận.' : 'đã bỏ, không ghi dữ liệu.'}</div>)}
        </div>)}
      {loading && <>
        <div className="chat-row user"><div className="chat-bubble user">{pendingQuestion}</div></div>
        <div className="chat-row assistant"><span className="assistant-avatar" aria-hidden="true"><Icon name="assistant" /></span>
          <div className="chat-bubble assistant typing" role="status"><span className="typing-dots" aria-hidden="true"><i /><i /><i /></span><span>Trợ lý đang soạn câu trả lời… lần đầu khởi động model có thể mất ít phút.</span></div></div>
      </>}
      <div ref={threadEnd} />
    </div>
    {error && <div className="chat-error" role="alert">{error}</div>}
    <form className="assistant-composer" onSubmit={submit}>
      <textarea ref={input} name="question" aria-label="Câu hỏi hoặc yêu cầu" rows={1} maxLength={500} value={question}
        placeholder="Nhập câu hỏi… (Enter để gửi, Shift+Enter xuống dòng)" onChange={event => setQuestion(event.target.value)} onKeyDown={onKeyDown} />
      <button className="primary-button chat-send" aria-label="Gửi câu hỏi" disabled={loading || savingId !== null || !question.trim()}>
        <Icon name="arrow" />
      </button>
    </form>
    <p className="assistant-chat-meta"><span>{question.length}/500</span><span>Trợ lý chỉ dùng dữ liệu hệ thống, không suy đoán.</span></p>
  </section>
}

function ProposalCard({ message, draft, leaveTypes, saving, error, onField, onConfirm, onDismiss }: {
  message: Extract<ChatMessage, { kind: 'proposal' }>; draft: Draft; leaveTypes: LeaveType[]; saving: boolean; error: string
  onField: (name: string, value: string) => void; onConfirm: (event: FormEvent) => void; onDismiss: () => void
}) {
  const { proposal } = message
  const id = `chat-${message.id}`
  return <form className="chat-bubble assistant proposal" onSubmit={onConfirm} aria-label="Bản nháp chờ xác nhận">
    <span className="eyebrow">BẢN NHÁP — CHƯA LƯU</span>
    <strong className="proposal-title">{proposal.summary}</strong>
    {proposal.action === 'UPDATE_OWN_PROFILE' && <div className="chat-fields">
      <label htmlFor={`${id}-email`}>Email<input id={`${id}-email`} name="email" type="email" required value={String(draft.email ?? '')} onChange={event => onField('email', event.target.value)} /></label>
      <label htmlFor={`${id}-phone`}>Số điện thoại<input id={`${id}-phone`} name="phone" required value={String(draft.phone ?? '')} onChange={event => onField('phone', event.target.value)} /></label>
    </div>}
    {proposal.action === 'CREATE_OWN_LEAVE' && <div className="chat-fields">
      <label htmlFor={`${id}-type`}>Loại nghỉ<select id={`${id}-type`} name="leaveTypeId" required value={String(draft.leaveTypeId ?? '')} onChange={event => onField('leaveTypeId', event.target.value)}><option value="">Chọn loại nghỉ</option>{leaveTypes.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}</select></label>
      <label htmlFor={`${id}-from`}>Từ ngày<input id={`${id}-from`} name="fromDate" type="date" required value={String(draft.fromDate ?? '')} onChange={event => onField('fromDate', event.target.value)} /></label>
      <label htmlFor={`${id}-to`}>Đến ngày<input id={`${id}-to`} name="toDate" type="date" required value={String(draft.toDate ?? '')} onChange={event => onField('toDate', event.target.value)} /></label>
      <label htmlFor={`${id}-reason`} className="wide">Lý do<textarea id={`${id}-reason`} name="reason" rows={2} required value={String(draft.reason ?? '')} onChange={event => onField('reason', event.target.value)} /></label>
    </div>}
    {proposal.action === 'CANCEL_OWN_LEAVE' && <p>Đơn #{String(draft.leaveRequestId)} sẽ được hủy nếu vẫn đang chờ duyệt. Nếu không đúng đơn, hãy hỏi lại.</p>}
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="proposal-actions">
      <button type="button" className="outline-button small-button" disabled={saving} onClick={onDismiss}>Bỏ bản nháp</button>
      <button className="primary-button small-button" disabled={saving}>{saving ? 'Đang xác nhận…' : 'Xác nhận thực hiện'}</button>
    </div>
  </form>
}
