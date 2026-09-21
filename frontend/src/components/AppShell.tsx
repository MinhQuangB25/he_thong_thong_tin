import type { ReactNode } from 'react'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../api/types'

export type Screen = 'dashboard' | 'employees' | 'leave' | 'attendance' | 'payroll'
const nav: { id: Screen; label: string; icon: string; roles?: Role[] }[] = [
  { id: 'dashboard', label: 'Tổng quan', icon: '⌂' },
  { id: 'employees', label: 'Nhân sự', icon: '♙', roles: ['ADMIN', 'HR_MANAGER', 'TEAM_LEADER'] },
  { id: 'leave', label: 'Đơn từ', icon: '▤' },
  { id: 'attendance', label: 'Chấm công', icon: '◷' },
  { id: 'payroll', label: 'Bảng lương', icon: '₫' },
]
export function AppShell({ screen, onNavigate, children }: { screen: Screen; onNavigate: (screen: Screen) => void; children: ReactNode }) {
  const { user, logout } = useAuth()
  const roles = user?.roles ?? []
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark">BA</span><span><strong>BINH AN</strong><small>People operations</small></span></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav aria-label="Điều hướng chính">{nav.filter(item => !item.roles || item.roles.some(role => roles.includes(role))).map(item => <button className={screen === item.id ? 'nav-item active' : 'nav-item'} onClick={() => onNavigate(item.id)} key={item.id}><span>{item.icon}</span>{item.label}</button>)}</nav>
      <div className="sidebar-foot"><div className="secure-note">● Hệ thống an toàn<br /><span>JWT + RBAC enabled</span></div><button className="logout-button" onClick={logout}>Đăng xuất <span>↗</span></button></div>
    </aside>
    <main className="main-content"><header className="topbar"><button className="mobile-menu" aria-label="Mở menu">☰</button><div className="breadcrumb">BÌNH AN HRM <span>/</span> <strong>{nav.find(item => item.id === screen)?.label}</strong></div><div className="top-actions"><span className="live-pill"><i /> LIVE</span><button className="icon-button" aria-label="Thông báo">♧</button><div className="user-chip"><span className="avatar">{user?.displayName?.slice(0, 1)}</span><span><strong>{user?.displayName}</strong><small>{roles.join(' · ')}</small></span></div></div></header><div className="page-content">{children}</div></main>
  </div>
}
