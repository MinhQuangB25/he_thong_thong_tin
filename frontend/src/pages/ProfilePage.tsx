import { useEffect, useState } from 'react'
import { api } from '../api/client'
import type { Employee } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'

export function ProfilePage() {
  const [profile, setProfile] = useState<Employee | null>(null)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    api<Employee>('/employees/me')
      .then(result => { setProfile(result); setPhone(result.phone); setEmail(result.email) })
      .catch(cause => setError(cause instanceof Error ? cause.message : 'Không thể tải hồ sơ'))
      .finally(() => setLoading(false))
  }, [])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true); setError(''); setSuccess('')
    try {
      const result = await api<Employee>('/employees/me', { method: 'PATCH', body: JSON.stringify({ phone, email }) })
      setProfile(result); setPhone(result.phone); setEmail(result.email); setSuccess('Đã cập nhật thông tin liên hệ')
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật hồ sơ') } finally { setSaving(false) }
  }

  return <div className="profile-page">
    <div className="page-heading compact"><div><span className="eyebrow">MY PROFILE</span><h1>Hồ sơ cá nhân</h1><p>Kiểm tra thông tin và cập nhật kênh liên hệ của bạn.</p></div></div>
    {loading && <StatusMessage type="info">Đang tải hồ sơ…</StatusMessage>}
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    {success && <StatusMessage type="success">{success}</StatusMessage>}
    {profile && <div className="profile-grid">
      <section className="panel profile-summary"><div className="profile-avatar">{profile.fullName.slice(0, 1)}</div><h2>{profile.fullName}</h2><p>{profile.positionTitle} · {profile.departmentName}</p><span className="badge success">{profile.status}</span><dl><div><dt>Mã nhân viên</dt><dd>{profile.employeeCode}</dd></div><div><dt>Trình độ</dt><dd>{profile.educationLevel || 'Chưa cập nhật'}</dd></div><div><dt>Ngày vào làm</dt><dd>{profile.joinDate}</dd></div></dl></section>
      <form className="panel inline-form profile-form" onSubmit={submit}><div className="panel-heading"><div><span className="eyebrow">CONTACT DETAILS</span><h2>Thông tin liên hệ</h2></div></div><label>Số điện thoại<input required value={phone} onChange={event => setPhone(event.target.value)} /></label><label>Email<input required type="email" value={email} onChange={event => setEmail(event.target.value)} /></label><p className="form-hint">Bạn chỉ có thể thay đổi email và số điện thoại. Mã nhân viên, chức vụ, phòng ban, lương và trạng thái do quản lý kiểm soát.</p><div className="form-actions"><button className="primary-button" disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu thay đổi'}</button></div></form>
    </div>}
  </div>
}
