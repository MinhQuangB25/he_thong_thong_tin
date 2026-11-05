import { useState, type FormEvent } from 'react'
import { api } from '../../api/client'
import type { AccountStatus, AdminAccount, Role } from '../../api/types'

const roleOptions: { code: Role; label: string }[] = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'HR_MANAGER', label: 'Quản lý nhân sự' },
  { code: 'TEAM_LEADER', label: 'Trưởng nhóm' },
  { code: 'EMPLOYEE', label: 'Nhân viên' },
]

export function AdminAccountForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({ username: '', password: '', displayName: '', employeeId: '', status: 'ACTIVE' as AccountStatus })
  const [roles, setRoles] = useState<Role[]>(['EMPLOYEE'])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function update(field: keyof typeof form, value: string) { setForm(current => ({ ...current, [field]: value })) }
  function toggleRole(role: Role) { setRoles(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role]) }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!roles.length) { setError('Tài khoản phải có ít nhất một vai trò.'); return }
    setSaving(true); setError('')
    try {
      await api<AdminAccount>('/users', { method: 'POST', body: JSON.stringify({ ...form, roles, employeeId: form.employeeId ? Number(form.employeeId) : null }) })
      onSaved()
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tạo tài khoản') } finally { setSaving(false) }
  }

  return <form className="panel inline-form admin-account-form" onSubmit={submit}>
    <div className="panel-heading"><div><span className="eyebrow">TÀI KHOẢN MỚI</span><h2>Thêm tài khoản</h2></div><button type="button" className="text-button" onClick={onCancel}>Đóng</button></div>
    <div className="form-grid">
      <label>Tên tài khoản<input name="username" required maxLength={60} autoComplete="off" value={form.username} onChange={event => update('username', event.target.value)} /></label>
      <label>Mật khẩu<input name="password" required minLength={8} type="password" autoComplete="new-password" value={form.password} onChange={event => update('password', event.target.value)} /></label>
      <label>Tên hiển thị<input name="displayName" required maxLength={120} value={form.displayName} onChange={event => update('displayName', event.target.value)} /></label>
      <label>Mã nhân sự liên kết <span className="field-hint">không bắt buộc</span><input name="employeeId" inputMode="numeric" value={form.employeeId} onChange={event => update('employeeId', event.target.value)} placeholder="Ví dụ: 3" /></label>
      <label>Trạng thái<select name="status" value={form.status} onChange={event => update('status', event.target.value)}><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đang khóa</option><option value="DISABLED">Vô hiệu hóa</option></select></label>
    </div>
    <fieldset className="role-fieldset"><legend>Vai trò và quyền truy cập</legend><div className="checkbox-grid">{roleOptions.map(role => <label key={role.code}><input name="roles" value={role.code} type="checkbox" checked={roles.includes(role.code)} onChange={() => toggleRole(role.code)} />{role.label}</label>)}</div></fieldset>
    {error && <div className="form-error" role="alert">{error}</div>}
    <div className="form-actions"><button type="button" className="outline-button" onClick={onCancel}>Hủy</button><button className="primary-button" disabled={saving}>{saving ? 'Đang tạo…' : 'Tạo tài khoản'}</button></div>
  </form>
}
