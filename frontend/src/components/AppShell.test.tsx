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
  it('shows only the separated admin navigation for an admin account', () => {
    render(<AppShell screen="admin" onNavigate={vi.fn()}><div>Admin content</div></AppShell>)

    expect(screen.getByRole('button', { name: 'Quản trị hệ thống' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nhân sự' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Đơn từ' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Chấm công' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Bảng lương' })).not.toBeInTheDocument()
  })
})
