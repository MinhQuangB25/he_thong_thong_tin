import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Employee } from '../api/types'
import { DashboardPage } from './DashboardPage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] } }),
}))

const employee: Employee = {
  id: 3, employeeCode: 'BA-003', fullName: 'Nguyễn Minh Anh', gender: 'FEMALE',
  phone: '0900000003', email: 'employee@example.test', joinDate: '2026-03-22',
  status: 'ACTIVE', departmentName: 'Đào tạo', positionTitle: 'Giáo viên',
}
const forbidden = 'Bạn không có quyền truy cập chức năng này'

beforeEach(() => {
  apiMock.mockReset()
  apiMock.mockImplementation(async (path: string) => {
    const { pathname } = new URL(path, 'http://localhost')
    // Reproduce the server RBAC boundary instead of granting employees directory access.
    if (pathname === '/employees') throw Object.assign(new Error(forbidden), { status: 403 })
    if (pathname === '/employees/me') return employee
    if (pathname === '/leave-requests') return { content: [], page: 0, size: 5, totalElements: 0, totalPages: 0 }
    if (pathname === '/payrolls') return []
    throw new Error(`Unexpected employee dashboard request: ${path}`)
  })
})
afterEach(cleanup)

describe('F03: employee dashboard access', () => {
  it('loads the employee profile without requesting the forbidden employee directory', async () => {
    render(<DashboardPage onNavigate={vi.fn()} />)

    await waitFor(() => {
      const paths = apiMock.mock.calls.map(([path]) => new URL(path, 'http://localhost').pathname)
      expect(paths).not.toContain('/employees')
      expect(paths).toContain('/employees/me')
    })
  })

  it('renders personal dashboard data instead of replacing the dashboard with a 403 error', async () => {
    render(<DashboardPage onNavigate={vi.fn()} />)

    expect(await screen.findByText(employee.fullName)).toBeVisible()
    expect(screen.getByRole('heading', { name: /Xin chào/ })).toBeVisible()
    expect(screen.queryByText(forbidden)).not.toBeInTheDocument()
  })
})
