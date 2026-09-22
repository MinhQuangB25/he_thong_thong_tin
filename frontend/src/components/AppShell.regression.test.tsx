import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] },
    logout: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

// JSDOM covers the interaction/ARIA contract; responsive CSS is verified by the browser owner.
describe.each([320, 768])('F07: mobile navigation at %ipx', width => {
  beforeEach(() => {
    vi.stubGlobal('innerWidth', width)
  })

  it('toggles accessible navigation and reports its expanded state', async () => {
    const user = userEvent.setup()
    render(<AppShell screen="dashboard" onNavigate={vi.fn()}><p>Tổng quan cá nhân</p></AppShell>)
    const toggle = screen.getByRole('button', { name: 'Mở menu' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const navigation = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    expect(within(navigation).getByRole('button', { name: 'Bảng lương' })).toBeVisible()
    expect(screen.getByRole('button', { name: /Đăng xuất/ })).toBeVisible()
    expect(toggle).toHaveAttribute('aria-controls')
    expect(document.getElementById(toggle.getAttribute('aria-controls') ?? '')).toContainElement(navigation)

    await user.click(toggle)

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes the open navigation on Escape', async () => {
    const user = userEvent.setup()
    render(<AppShell screen="dashboard" onNavigate={vi.fn()}><p>Tổng quan cá nhân</p></AppShell>)
    const toggle = screen.getByRole('button', { name: 'Mở menu' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    await user.keyboard('{Escape}')

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('navigates to the selected page and closes the menu', async () => {
    const user = userEvent.setup()
    const onNavigate = vi.fn()
    render(<AppShell screen="dashboard" onNavigate={onNavigate}><p>Tổng quan cá nhân</p></AppShell>)
    const toggle = screen.getByRole('button', { name: 'Mở menu' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const navigation = screen.getByRole('navigation', { name: 'Điều hướng chính' })
    await user.click(within(navigation).getByRole('button', { name: 'Bảng lương' }))

    expect(onNavigate).toHaveBeenCalledExactlyOnceWith('payroll')
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })
})
