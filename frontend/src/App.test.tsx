import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { AuthProvider } from './context/AuthContext'

describe('login screen', () => { it('renders accessible login fields', () => { render(<AuthProvider><App /></AuthProvider>); expect(screen.getByLabelText('Tài khoản')).toBeInTheDocument(); expect(screen.getByLabelText('Mật khẩu')).toBeInTheDocument(); expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument() }) })
