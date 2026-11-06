import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', displayName: 'Quản trị hệ thống', roles: ['ADMIN'] },
    logout: vi.fn(),
  }),
}))

describe('AppShell admin workspace', () => {
  it('keeps the admin workspace separate while exposing business navigation', () => {
    const { container } = render(<AppShell screen="admin" onNavigate={vi.fn()}><div>Admin content</div></AppShell>)

    expect(screen.getByRole('button', { name: 'Quản trị hệ thống' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nhân sự' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đơn từ' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chấm công' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bảng lương' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Báo cáo' })).toBeInTheDocument()
    expect(container.querySelector('.admin-shell')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tổng quan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Hồ sơ cá nhân' })).not.toBeInTheDocument()
  })
})
