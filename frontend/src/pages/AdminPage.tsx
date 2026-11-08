import { useEffect, useMemo, useState } from 'react'
import { api } from '../api/client'
import type { AccountStatus, AdminAccount, AuditLog, Role } from '../api/types'
import { StatusMessage } from '../components/StatusMessage'
import { AdminAccountForm } from './admin/AdminAccountForm'
import { ReportsPage } from './ReportsPage'

const roleOptions: { code: Role; label: string }[] = [
  { code: 'ADMIN', label: 'Admin' },
  { code: 'HR_MANAGER', label: 'Quản lý nhân sự' },
  { code: 'TEAM_LEADER', label: 'Trưởng nhóm' },
  { code: 'EMPLOYEE', label: 'Nhân viên' },
]
const statusLabels: Record<AccountStatus, string> = { ACTIVE: 'Đang hoạt động', LOCKED: 'Đang khóa', DISABLED: 'Vô hiệu hóa' }
const roleLabels = Object.fromEntries(roleOptions.map(role => [role.code, role.label])) as Record<Role, string>
type SortKey = 'username' | 'displayName' | 'status'

export function AdminPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | AccountStatus>('ALL')
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL')
  const [sortBy, setSortBy] = useState<SortKey>('username')
  const [sortDescending, setSortDescending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showReports, setShowReports] = useState(false)
  const [editingRoles, setEditingRoles] = useState<number | null>(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [userData, logData] = await Promise.all([api<AdminAccount[]>('/users'), api<AuditLog[]>('/audit-logs')])
      setAccounts(userData); setLogs(logData)
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể tải dữ liệu quản trị') } finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [])

  const visibleAccounts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi-VN')
    return accounts.filter(account => {
      const matchesSearch = !query || `${account.username} ${account.displayName}`.toLocaleLowerCase('vi-VN').includes(query)
      const matchesStatus = statusFilter === 'ALL' || account.status === statusFilter
      const matchesRole = roleFilter === 'ALL' || account.roles.includes(roleFilter)
      return matchesSearch && matchesStatus && matchesRole
    }).sort((left, right) => {
      const a = left[sortBy].toLocaleLowerCase('vi-VN')
      const b = right[sortBy].toLocaleLowerCase('vi-VN')
      return (a.localeCompare(b, 'vi') || left.id - right.id) * (sortDescending ? -1 : 1)
    })
  }, [accounts, roleFilter, search, sortBy, sortDescending, statusFilter])

  if (showReports) return <div className="admin-page"><button className="text-button admin-back-button" onClick={() => setShowReports(false)}>← Quay lại quản trị tài khoản</button><ReportsPage /></div>

  async function updateRoles(id: number, roles: Role[]) {
    try { await api<AdminAccount>(`/users/${id}/roles`, { method: 'PUT', body: JSON.stringify({ roles }) }); setEditingRoles(null); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật vai trò') }
  }
  async function updateStatus(account: AdminAccount) {
    const nextStatus: AccountStatus = account.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    try { await api<AdminAccount>(`/users/${account.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể cập nhật trạng thái') }
  }
  async function deleteAccount(account: AdminAccount) {
    if (!window.confirm(`Xóa tài khoản ${account.username}? Hành động này không thể hoàn tác.`)) return
    try { await api<void>(`/users/${account.id}`, { method: 'DELETE' }); await load() } catch (cause) { setError(cause instanceof Error ? cause.message : 'Không thể xóa tài khoản') }
  }

  return <div className="admin-page">
    <div className="page-heading compact"><div><span className="eyebrow">QUẢN TRỊ</span><h1>Quản trị hệ thống</h1><p>Khu vực riêng để quản lý tài khoản, vai trò và nhật ký truy cập.</p></div><div className="admin-heading-actions"><button className="outline-button" onClick={() => setShowReports(true)}>Báo cáo hệ thống</button><button className="primary-button" onClick={() => setShowForm(current => !current)}>＋ Thêm tài khoản</button></div></div>
    {showForm && <AdminAccountForm onCancel={() => setShowForm(false)} onSaved={() => { setShowForm(false); void load() }} />}
    <section className="admin-stats"><div><span>TỔNG TÀI KHOẢN</span><strong>{accounts.length}</strong><small>Tài khoản trong hệ thống</small></div><div><span>ĐANG HOẠT ĐỘNG</span><strong>{accounts.filter(account => account.status === 'ACTIVE').length}</strong><small>Sẵn sàng truy cập</small></div><div><span>QUẢN TRỊ VIÊN</span><strong>{accounts.filter(account => account.roles.includes('ADMIN')).length}</strong><small>Quyền quản trị hệ thống</small></div></section>
    {error && <StatusMessage type="error">{error}</StatusMessage>}
    <section className="panel table-panel admin-accounts-panel"><div className="panel-heading"><div><span className="eyebrow">TÀI KHOẢN</span><h2>Tài khoản và phân quyền</h2></div><span className="count-pill">{visibleAccounts.length} kết quả</span></div>
      <div className="table-toolbar admin-toolbar"><div className="search-box"><span>⌕</span><input name="search" aria-label="Tìm tài khoản" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Tìm theo tài khoản hoặc tên hiển thị…" /></div><select name="sortBy" aria-label="Sắp xếp tài khoản" value={sortBy} onChange={event => setSortBy(event.target.value as SortKey)}><option value="username">Sắp xếp: tài khoản</option><option value="displayName">Sắp xếp: tên hiển thị</option><option value="status">Sắp xếp: trạng thái</option></select><button className="filter-button" onClick={() => setSortDescending(current => !current)} aria-label="Đổi thứ tự sắp xếp">{sortDescending ? '↓ Z–A' : '↑ A–Z'}</button></div>
      <details className="advanced-filter"><summary>Bộ lọc nâng cao</summary><div className="advanced-filter-grid"><label>Trạng thái<select name="statusFilter" aria-label="Lọc theo trạng thái" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'ALL' | AccountStatus)}><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đang khóa</option><option value="DISABLED">Vô hiệu hóa</option></select></label><label>Vai trò<select name="roleFilter" aria-label="Lọc theo vai trò" value={roleFilter} onChange={event => setRoleFilter(event.target.value as 'ALL' | Role)}><option value="ALL">Tất cả vai trò</option>{roleOptions.map(role => <option key={role.code} value={role.code}>{role.label}</option>)}</select></label></div></details>
      {loading ? <StatusMessage type="info">Đang tải danh sách tài khoản…</StatusMessage> : !visibleAccounts.length ? <StatusMessage type="empty">Không tìm thấy tài khoản phù hợp.</StatusMessage> : <div className="responsive-table"><table><caption className="sr-only">Danh sách tài khoản hệ thống</caption><thead><tr><th>TÀI KHOẢN</th><th>VAI TRÒ</th><th>TRẠNG THÁI</th><th>LIÊN KẾT NHÂN SỰ</th><th>THAO TÁC</th></tr></thead><tbody>{visibleAccounts.map(account => <tr key={account.id}><td><div className="table-person"><span className="avatar soft">{account.displayName.slice(0, 1)}</span><div><strong>{account.displayName}</strong><small>{account.username}</small></div></div></td><td><div className="role-list">{account.roles.map(role => <span className="role-chip" key={role}>{roleLabels[role]}</span>)}</div>{editingRoles === account.id && <RoleEditor account={account} onSave={roles => void updateRoles(account.id, roles)} onCancel={() => setEditingRoles(null)} />}</td><td><span className={`badge ${account.status === 'ACTIVE' ? 'success' : account.status === 'LOCKED' ? 'warning' : 'muted'}`}>{statusLabels[account.status]}</span></td><td>{account.employeeId ? `Nhân sự #${account.employeeId}` : <span className="muted-text">Chưa liên kết</span>}</td><td><div className="row-actions admin-actions"><button className="outline-button small-button" onClick={() => setEditingRoles(editingRoles === account.id ? null : account.id)}>Phân quyền</button><button className="text-button" onClick={() => void updateStatus(account)}>{account.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}</button><button className="danger-button" onClick={() => void deleteAccount(account)} aria-label={`Xóa ${account.username}`}>Xóa</button></div></td></tr>)}</tbody></table></div>}
      <div className="table-footer"><span>Hiển thị {visibleAccounts.length} / {accounts.length} tài khoản</span><span className="admin-security-note">Chỉ ADMIN có quyền thao tác</span></div>
    </section>
    <section className="panel admin-audit"><div className="panel-heading"><div><span className="eyebrow">NHẬT KÝ</span><h2>Nhật ký thao tác gần đây</h2></div></div>{!logs.length ? <StatusMessage type="empty">Chưa có nhật ký quản trị.</StatusMessage> : <div className="audit-list">{logs.slice(0, 5).map(log => <div className="audit-row" key={log.id}><span className="audit-dot" /><div><strong>{actionLabel(log.action)}</strong><small>{log.actorUsername} · {log.detail || log.entityName}</small></div><time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time></div>)}</div>}</section>
  </div>
}

function RoleEditor({ account, onSave, onCancel }: { account: AdminAccount; onSave: (roles: Role[]) => void; onCancel: () => void }) {
  const [roles, setRoles] = useState<Role[]>(account.roles)
  function toggle(role: Role) { setRoles(current => current.includes(role) ? current.filter(item => item !== role) : [...current, role]) }
  return <div className="role-editor"><strong>Chọn quyền</strong><div className="checkbox-grid">{roleOptions.map(role => <label key={role.code}><input name="roles" value={role.code} type="checkbox" checked={roles.includes(role.code)} onChange={() => toggle(role.code)} />{role.label}</label>)}</div><div><button className="primary-button small-button" disabled={!roles.length} onClick={() => onSave(roles)}>Lưu quyền</button><button className="text-button" onClick={onCancel}>Hủy</button></div></div>
}

function actionLabel(action: string) { return ({ ACCOUNT_CREATED: 'Tạo tài khoản', ACCOUNT_DELETED: 'Xóa tài khoản', ROLE_CHANGED: 'Thay đổi vai trò', STATUS_CHANGED: 'Thay đổi trạng thái', EMPLOYEE_CREATED: 'Thêm nhân sự', EMPLOYEE_UPDATED: 'Sửa hồ sơ nhân sự', EMPLOYEE_PROFILE_UPDATED: 'Nhân viên cập nhật liên hệ', EMPLOYEE_TERMINATED: 'Cho nghỉ việc', LEAVE_REVIEWED: 'Duyệt đơn nghỉ', PAYROLL_LOCKED: 'Khóa kỳ lương', EMPLOYEE_RESTORED: 'Khôi phục hồ sơ nhân sự', CONTRACT_CREATED: 'Ký hợp đồng', CONTRACT_TERMINATED: 'Chấm dứt hợp đồng' } as Record<string, string>)[action] || action }
function formatDate(value: string) { return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) }
