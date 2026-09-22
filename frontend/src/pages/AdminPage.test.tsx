import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminPage } from './AdminPage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', displayName: 'Quản trị hệ thống', roles: ['ADMIN'] },
    logout: vi.fn(),
  }),
}))

describe('AdminPage', () => {
  it('renders account management and filters accounts by search text', async () => {
    apiMock.mockImplementation((path: string) => {
      if (path === '/users') return Promise.resolve([
        { id: 1, username: 'admin', displayName: 'Quản trị hệ thống', status: 'ACTIVE', roles: ['ADMIN'], employeeId: null },
        { id: 2, username: 'employee01', displayName: 'Nguyễn Minh Anh', status: 'ACTIVE', roles: ['EMPLOYEE'], employeeId: 3 },
      ])
      if (path === '/audit-logs') return Promise.resolve([])
      return Promise.resolve([])
    })

    render(<AdminPage />)

    expect(await screen.findByRole('heading', { name: 'Quản trị hệ thống' })).toBeInTheDocument()
    expect(screen.getByText('employee01')).toBeInTheDocument()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Tìm tài khoản' }), { target: { value: 'employee01' } })

    await waitFor(() => expect(screen.queryByText('admin')).not.toBeInTheDocument())
    expect(screen.getByText('employee01')).toBeInTheDocument()
  })
})
