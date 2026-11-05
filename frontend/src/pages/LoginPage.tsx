import { useState, type FormEvent } from 'react'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/Icon'

export function LoginPage() {
  const { login, loading } = useAuth()
  const [username, setUsername] = useState('hr.manager')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    try { await login(username, password) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể đăng nhập') }
  }
  return <div className="login-page">
    <section className="login-visual" aria-label="Bình An HRM">
      <div className="brand"><span className="brand-mark">BA</span><span><strong>BÌNH AN</strong><small>Trung tâm Ngoại ngữ</small></span></div>
      <div className="login-copy"><span className="eyebrow">CON NGƯỜI LÀ TRỌNG TÂM</span><h1>Quản lý rõ ràng.<br /><em>Đội ngũ vững vàng.</em></h1>
        <p>Một không gian cho nhân sự, chấm công và thu nhập. Để mỗi người tại Bình An tập trung vào điều mình làm tốt nhất.</p>
        <div className="login-features"><span><Icon name="people" /> Hồ sơ nhân sự tập trung</span><span><Icon name="attendance" /> Chấm công và đơn từ rõ ràng</span><span><Icon name="payroll" /> Bảng lương dễ theo dõi</span></div>
      </div><span className="login-visual-footer">BÌNH AN HRM <span>Đồng hành cùng đội ngũ</span></span>
    </section>
    <div className="login-panel"><div className="login-form-wrap">
      <div className="brand login-brand"><span className="brand-mark">BA</span><span><strong>BÌNH AN</strong><small>Hệ thống quản lý nhân sự</small></span></div>
      <div className="login-heading"><span className="eyebrow">CHÀO MỪNG ĐẾN BÌNH AN</span><h2>Chào mừng trở lại</h2><p>Đăng nhập để bắt đầu ngày làm việc của bạn.</p></div>
      <form onSubmit={submit}>
        <label htmlFor="login-username">Tài khoản<input id="login-username" name="username" autoComplete="username" value={username} onChange={event => setUsername(event.target.value)} placeholder="Nhập tài khoản" required /></label>
        <label htmlFor="login-password">Mật khẩu<input id="login-password" name="password" autoComplete="current-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Nhập mật khẩu" required /></label>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary-button login-button" disabled={loading}>{loading ? 'Đang xác thực…' : 'Đăng nhập'}<Icon name="arrow" /></button>
      </form><div className="demo-hint"><strong>Tài khoản dùng thử</strong><span>hr.manager / password</span><span>employee01 / password</span></div>
    </div><footer>© 2026 Trung tâm Ngoại ngữ Bình An</footer></div>
  </div>
}
