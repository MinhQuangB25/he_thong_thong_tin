import { AssistantChat } from '../components/AssistantChat'

export function AssistantPage() {
  return <div className="assistant-page">
    <div className="page-heading compact"><div><span className="eyebrow">TRỢ LÝ THEO VAI TRÒ</span><h1>Trợ lý AI</h1><p>Hỏi về dữ liệu HRM trong phạm vi quyền của bạn. Mọi thay đổi đều cần bạn xác nhận.</p></div></div>
    <div className="panel assistant-page-chat"><AssistantChat variant="page" /></div>
  </div>
}
