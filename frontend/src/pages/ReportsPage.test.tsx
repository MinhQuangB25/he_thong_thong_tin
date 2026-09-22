import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReportsPage } from './ReportsPage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'hr.manager', displayName: 'Quản lý nhân sự', roles: ['HR_MANAGER'] }, logout: vi.fn() }),
}))

describe('ReportsPage', () => {
  it('renders month-end status and workforce statistics', async () => {
    apiMock.mockResolvedValue({
      month: 9,
      year: 2026,
      asOf: '2026-09-30',
      totalEmployees: 3,
      active: 1,
      onLeave: 1,
      terminated: 1,
      statuses: [{ employeeId: 1, employeeCode: 'BA-001', fullName: 'Nguyễn Minh Anh', status: 'ACTIVE', educationLevel: 'Đại học', departmentName: 'Đào tạo', positionTitle: 'Giáo viên', joinDate: '2025-01-01', endDate: null, tenureMonths: 20, baseSalary: 14000000, allowance: 500000 }],
      education: [{ label: 'Đại học', count: 1 }],
      salary: { minBaseSalary: 14000000, maxBaseSalary: 14000000, averageBaseSalary: 14000000, totalAllowances: 500000, employeeCount: 1 },
      tenure: [{ label: 'Từ 1 đến dưới 3 năm', count: 1 }],
    })

    render(<ReportsPage />)

    expect(await screen.findByRole('heading', { name: 'Báo cáo nhân sự' })).toBeInTheDocument()
    expect(screen.getAllByText('Đang làm').length).toBeGreaterThan(0)
    expect(screen.getByText('Trình độ học vấn')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'In báo cáo' })).toBeInTheDocument()
  })
})
