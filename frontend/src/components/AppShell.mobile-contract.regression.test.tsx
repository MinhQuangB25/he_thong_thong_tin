import { useState } from 'react'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell, type Screen } from './AppShell'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] },
    logout: vi.fn(),
  }),
}))

function Workspace() {
  const [page, setPage] = useState<Screen>('dashboard')
  return <AppShell screen={page} onNavigate={setPage}>
    <h1>{page === 'payroll' ? 'Lương cá nhân' : 'Tổng quan cá nhân'}</h1>
  </AppShell>
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

// JSDOM checks interaction and ARIA; actual responsive visibility requires a browser.
describe.each([320, 768])('F07: mobile menu contract at %ipx', width => {
  beforeEach(() => { vi.stubGlobal('innerWidth', width) })

  it('opens and closes navigation using the accessible menu button', async () => {
    const user = userEvent.setup()
    render(<Workspace />)
    const toggle = screen.getByRole('button', { name: 'Mở menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const navigation = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(navigation).getByRole('button', { name: 'Bảng lương' })).toBeVisible()

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the selected destination and closes navigation after selection', async () => {
    const user = userEvent.setup()
    render(<Workspace />)
    const toggle = screen.getByRole('button', { name: 'Mở menu' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const navigation = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    await user.click(within(navigation).getByRole('button', { name: 'Bảng lương' }))

    expect(screen.getByRole('heading', { name: 'Lương cá nhân' })).toBeVisible()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
