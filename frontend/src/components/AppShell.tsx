import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/types'

export type Screen = 'dashboard' | 'admin' | 'employees' | 'leave' | 'attendance' | 'payroll' | 'reports' | 'profile'
type NavItem = { id: Screen; label: string; icon: string; roles?: Role[] }
const hrNav: NavItem[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: '⌂' },
  { id: 'employees', label: 'Nhân sự', icon: '♙', roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEADER'] },
  { id: 'leave', label: 'Đơn từ', icon: '▤' },
  { id: 'attendance', label: 'Chấm công', icon: '◷' },
  { id: 'payroll', label: 'Bảng lương', icon: '₫' },
  { id: 'reports', label: 'Báo cáo', icon: '▥', roles: ['ADMIN', 'HR_MANAGER'] },
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: '♙', roles: ['EMPLOYEE'] },
]
const adminNav: NavItem[] = [{ id: 'admin', label: 'Quản trị hệ thống', icon: '⚙', roles: ['ADMIN'] }]
export function AppShell({ screen, onNavigate, children }: { screen: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  const { user, logout } = useAuth()
  const roles = user?.roles ?? []
  const isAdmin = roles.includes('ADMIN')
  const nav = isAdmin ? adminNav : hrNav.filter(item => !item.roles || item.roles.some(role => roles.includes(role)))
  return <div className={isAdmin ? 'app-shell admin-shell' : 'app-shell'}>
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">BA</span><span><strong>BINH AN</strong><small>{isAdmin ? 'System administration' : 'People operations'}</small></span></div>
      <div className="workspace-label">{isAdmin ? 'ADMIN SERVER' : 'WORKSPACE'}</div>
      <nav aria-label={isAdmin ? 'Điều hướng quản trị' : 'Điều hướng chính'}>{nav.map(item => <button type="button" className={screen === item.id ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(item.id)} key={item.id}><span aria-hidden="true">{item.icon}</span>{item.label}</button>)}</nav>
      <div className="sidebar-foot"><div className="secure-note">● {isAdmin ? 'Khu vực Admin riêng' : 'Hệ thống an toàn'}<br /><span>{isAdmin ? 'Account + RBAC control' : 'JWT + RBAC enabled'}</span></div><button type="button" className="logout-button" onClick={logout}>Đăng xuất <span aria-hidden="true">↗</span></button></div>
    </aside>
    <main className="main-content"><header className="topbar"><button type="button" className="mobile-menu" aria-label="Mở menu">☰</button><div className="breadcrumb">BÌNH AN HRM <span>/</span> <strong>{nav.find(item => item.id === screen)?.label}</strong></div><div className="top-actions"><span className="live-pill"><i /> LIVE</span><button type="button" className="icon-button" aria-label="Thông báo">♧</button><div className="user-chip"><span className="avatar">{user?.displayName?.slice(0, 1)}</span><span><strong>{user?.displayName}</strong><small>{roles.join(' · ')}</small></span></div></div></header><div className="page-content">{children}</div></main>
  </div>
}
