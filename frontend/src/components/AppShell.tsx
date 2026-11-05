import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/types'
import { Icon, type IconName } from './Icon'

export type Screen = 'dashboard' | 'admin' | 'employees' | 'contracts' | 'leave' | 'attendance' | 'payroll' | 'reports' | 'profile' | 'assistant'
type NavItem = { id: Screen; label: string; icon: IconName; roles?: Role[] }
const hrNav: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: 'dashboard' },
  { id: 'employees', label: 'Nhân sự', icon: 'people', roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEADER'] },
  { id: 'contracts', label: 'Hợp đồng', icon: 'contract', roles: ['ADMIN', 'HR_MANAGER'] },
  { id: 'leave', label: 'Đơn từ', icon: 'leave' },
  { id: 'attendance', label: 'Chấm công', icon: 'attendance' },
  { id: 'payroll', label: 'Bảng lương', icon: 'payroll' },
  { id: 'reports', label: 'Báo cáo', icon: 'reports', roles: ['ADMIN', 'HR_MANAGER'] },
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: 'profile', roles: ['EMPLOYEE'] },
  { id: 'assistant', label: 'Trợ lý AI', icon: 'assistant' },
]
const adminNav: NavItem[] = [
  { id: 'admin', label: 'Quản trị hệ thống', icon: 'shield', roles: ['ADMIN'] },
  ...hrNav.filter(item => ['employees', 'contracts', 'leave', 'attendance', 'payroll', 'reports', 'assistant'].includes(item.id)),
]
export function AppShell({ screen, onNavigate, children }: { screen: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  const { user, logout } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const sidebarId = useId()
  const menuButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!menuOpen) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        menuButton.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [menuOpen])
  function navigate(destination: Screen) {
    setMenuOpen(false)
    if (menuOpen) menuButton.current?.focus()
    onNavigate(destination)
  }
  const roles = user?.roles ?? []
  const isAdmin = roles.includes('ADMIN')
  const nav = isAdmin ? adminNav : hrNav.filter(item => !item.roles || item.roles.some(role => roles.includes(role)))
  const roleLabels: Record<Role, string> = { ADMIN: 'Quản trị viên', HR_MANAGER: 'Quản lý nhân sự', TEAM_LEADER: 'Trưởng nhóm', EMPLOYEE: 'Nhân viên' }
  return <div className={isAdmin ? 'app-shell admin-shell' : 'app-shell'}>
    <a className="skip-link" href="#workspace-content">Đến nội dung chính</a>
    <aside id={sidebarId} className={menuOpen ? 'sidebar mobile-open' : 'sidebar'}>
      <div className="brand"><span className="brand-mark">BA</span><span><strong>BÌNH AN</strong><small>{isAdmin ? 'Quản trị hệ thống' : 'Trung tâm Ngoại ngữ'}</small></span></div>
      <div className="workspace-label">{isAdmin ? 'ADMIN SERVER' : 'KHÔNG GIAN LÀM VIỆC'}</div>
      <nav aria-label={isAdmin ? 'Điều hướng quản trị' : 'Điều hướng chính'}>{nav.map(item => <button type="button" aria-current={screen === item.id ? 'page' : undefined} className={screen === item.id ? 'nav-item active' : 'nav-item'} onClick={() => navigate(item.id)} key={item.id}><Icon name={item.icon} />{item.label}</button>)}</nav>
      <div className="sidebar-foot"><div className="secure-note"><Icon name="shield" /> <span>{isAdmin ? 'Khu vực Admin riêng' : 'Bình An HRM'}<small>{isAdmin ? 'Quản lý quyền truy cập' : 'Đồng hành cùng đội ngũ'}</small></span></div><button type="button" className="logout-button" onClick={logout}>Đăng xuất <Icon name="logout" /></button></div>
    </aside>
    <main className="main-content"><header className="topbar"><button type="button" ref={menuButton} className="mobile-menu" aria-label="Mở menu" aria-expanded={menuOpen} aria-controls={sidebarId} onClick={() => setMenuOpen(open => !open)}><Icon name="menu" /></button><div className="breadcrumb">{isAdmin ? 'Quản trị' : 'Không gian làm việc'} <span>/</span> <strong>{nav.find(item => item.id === screen)?.label}</strong></div><div className="top-actions"><span className="workspace-tag">{isAdmin ? 'ADMIN' : 'HRM'}</span><div className="user-chip"><span className="avatar">{user?.displayName?.slice(0, 1)}</span><span><strong>{user?.displayName}</strong><small>{roles.map(role => roleLabels[role]).join(' · ')}</small></span></div></div></header><div className="page-content" id="workspace-content" tabIndex={-1}>{children}</div></main>
  </div>
}
