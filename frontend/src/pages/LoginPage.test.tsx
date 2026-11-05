import { render, screen, cleanup } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { LoginPage } from './LoginPage'
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login: vi.fn(), loading: false }) }))
afterEach(cleanup)
it('names login fields for browser autofill and accessibility', () => {
  render(<LoginPage />)
  expect(screen.getByLabelText('Tài khoản')).toHaveAttribute('name', 'username')
  expect(screen.getByLabelText('Mật khẩu')).toHaveAttribute('name', 'password')
})
