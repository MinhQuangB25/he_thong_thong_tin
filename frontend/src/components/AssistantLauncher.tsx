import { useEffect, useId, useRef, useState } from 'react'
import { useOptionalAssistantConversation } from '../context/AssistantConversationContext'
import { AssistantChat } from './AssistantChat'
import { Icon } from './Icon'

/** Floating chat bubble available on every screen except the full assistant page. */
export function AssistantLauncher({ onOpenPage }: { onOpenPage: () => void }) {
  const conversation = useOptionalAssistantConversation()
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const launcher = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef(false)

  // Focus goes back to the launcher only after the panel is gone (on phones the launcher is hidden while open).
  useEffect(() => {
    if (!open && returnFocus.current) { returnFocus.current = false; launcher.current?.focus() }
  }, [open])
  function close() { returnFocus.current = true; setOpen(false) }

  useEffect(() => {
    if (!open) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!conversation) return null
  const unread = conversation.messages.length > 0

  return <div className="assistant-launcher">
    {open && <div id={panelId} className="assistant-widget" role="dialog" aria-modal="false" aria-label="Trợ lý AI">
      <header className="assistant-widget-header">
        <span className="assistant-avatar" aria-hidden="true"><Icon name="assistant" /></span>
        <div><strong>Trợ lý AI</strong><small>Theo dữ liệu và quyền của bạn</small></div>
        <button type="button" className="icon-button" aria-label="Mở trợ lý toàn trang" title="Mở toàn trang" onClick={() => { setOpen(false); onOpenPage() }}>⤢</button>
        <button type="button" className="icon-button" aria-label="Đóng trợ lý" title="Đóng (Esc)" onClick={close}>×</button>
      </header>
      <AssistantChat variant="widget" autoFocus />
    </div>}
    <button ref={launcher} type="button" className={`assistant-fab ${open ? 'open' : ''}`} aria-expanded={open} aria-controls={open ? panelId : undefined}
      aria-label={open ? 'Thu nhỏ trợ lý AI' : 'Mở trợ lý AI'} onClick={() => setOpen(value => !value)}>
      {open ? <span aria-hidden="true">×</span> : <Icon name="assistant" />}
      {!open && unread && <span className="assistant-fab-dot" aria-hidden="true" />}
    </button>
  </div>
}
