import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { EmployeesPage } from './EmployeesPage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'hr.manager', displayName: 'Quản lý nhân sự', roles: ['HR_MANAGER'] },
    logout: vi.fn(),
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

const employees = [
  { id: 1, employeeCode: 'BA-001', fullName: 'Lê Thu Hà', gender: 'FEMALE', phone: '0901', email: 'ha@example.com', joinDate: '2024-01-01', status: 'TERMINATED', departmentName: 'Vận hành', positionTitle: 'Nhân sự' },
  { id: 2, employeeCode: 'BA-002', fullName: 'Nguyễn Minh Anh', gender: 'FEMALE', phone: '0902', email: 'anh@example.com', joinDate: '2025-01-01', status: 'ACTIVE', departmentName: 'Đào tạo', positionTitle: 'Giáo viên' },
  { id: 3, employeeCode: 'BA-003', fullName: 'Trần Quốc Bảo', gender: 'MALE', phone: '0903', email: 'bao@example.com', joinDate: '2023-01-01', status: 'ACTIVE', departmentName: 'Đào tạo', positionTitle: 'Trưởng nhóm' },
]

describe('EmployeesPage', () => {
  it('opens filter controls and filters employees by status', async () => {
    apiMock.mockResolvedValue({ content: employees, page: 0, size: 20, totalElements: employees.length, totalPages: 1 })

    render(<EmployeesPage />)

    expect(await screen.findByText('Lê Thu Hà')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Lọc & sắp xếp/i }))

    const statusFilter = await screen.findByRole('combobox', { name: 'Lọc theo trạng thái nhân sự' })
    fireEvent.change(statusFilter, { target: { value: 'TERMINATED' } })

    await waitFor(() => expect(screen.queryByText('Nguyễn Minh Anh')).not.toBeInTheDocument())
    expect(screen.getByText('Lê Thu Hà')).toBeInTheDocument()
  })

  it('sorts the visible employees by selected field and direction', async () => {
    apiMock.mockResolvedValue({ content: employees, page: 0, size: 20, totalElements: employees.length, totalPages: 1 })

    render(<EmployeesPage />)
    await screen.findByText('Lê Thu Hà')
    fireEvent.click(screen.getByRole('button', { name: /Lọc & sắp xếp/i }))
    fireEvent.change(await screen.findByRole('combobox', { name: 'Sắp xếp nhân sự theo' }), { target: { value: 'employeeCode' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đổi thứ tự sắp xếp nhân sự' }))

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('BA-003')
    expect(rows[2]).toHaveTextContent('BA-001')
  })
})
