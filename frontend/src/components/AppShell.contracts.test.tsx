import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

const { auth } = vi.hoisted(() => ({ auth: { roles: ['HR_MANAGER'] as string[] } }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'user', displayName: 'Người dùng', roles: auth.roles }, logout: vi.fn() }),
}))

afterEach(() => { cleanup(); auth.roles = ['HR_MANAGER'] })

it.each([['HR_MANAGER', true], ['ADMIN', true], ['TEAM_LEADER', false], ['EMPLOYEE', false]])('contracts menu for %s visible=%s', (role, visible) => {
  auth.roles = [role]
  render(<AppShell screen="dashboard" onNavigate={vi.fn()}><p>Nội dung</p></AppShell>)
  const item = screen.queryByRole('button', { name: 'Hợp đồng' })
  if (visible) expect(item).toBeInTheDocument()
  else expect(item).not.toBeInTheDocument()
})
