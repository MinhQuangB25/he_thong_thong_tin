import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
  { id: 2, employeeCode: 'BA-002', fullName: 'Nguyễn Minh Anh', gender: 'FEMALE', phone: '0902', email: 'anh@example.com', joinDate: '2025-01-01', status: 'ACTIVE', departmentId: 2, departmentName: 'Đào tạo', positionId: 1, positionTitle: 'Giáo viên' },
  { id: 3, employeeCode: 'BA-003', fullName: 'Trần Quốc Bảo', gender: 'MALE', phone: '0903', email: 'bao@example.com', joinDate: '2023-01-01', status: 'ACTIVE', departmentName: 'Đào tạo', positionTitle: 'Trưởng nhóm' },
]

function mockDirectory() {
  apiMock.mockImplementation(async (path: string, options?: RequestInit) => {
    const url = new URL(path, 'http://localhost')
    if (options?.method === 'PUT') return { ...employees[1], ...JSON.parse(String(options.body)) }
    if (url.pathname === '/departments') return [{ id: 1, name: 'Vận hành' }, { id: 2, name: 'Đào tạo' }]
    if (url.pathname === '/positions') return [{ id: 1, title: 'Giáo viên' }]
    const status = url.searchParams.get('status')
    const [field, direction] = (url.searchParams.get('sort') || 'fullName,asc').split(',')
    const content = employees.filter(employee => !status || employee.status === status)
      .sort((a, b) => String(a[field as keyof typeof a]).localeCompare(String(b[field as keyof typeof b]), 'vi') * (direction === 'desc' ? -1 : 1))
    return { content, page: 0, size: 20, totalElements: content.length, totalPages: 1 }
  })
}

describe('EmployeesPage', () => {
  it('opens filter controls and filters employees by status', async () => {
    mockDirectory()

    render(<EmployeesPage />)

    expect(await screen.findByText('Lê Thu Hà')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Lọc & sắp xếp/i }))

    const statusFilter = await screen.findByRole('combobox', { name: 'Lọc theo trạng thái nhân sự' })
    fireEvent.change(statusFilter, { target: { value: 'TERMINATED' } })

    await waitFor(() => expect(screen.queryByText('Nguyễn Minh Anh')).not.toBeInTheDocument())
    expect(screen.getByText('Lê Thu Hà')).toBeInTheDocument()
    await waitFor(() => expect(apiMock.mock.calls.some(([path]) => new URL(path, 'http://localhost').searchParams.get('status') === 'TERMINATED')).toBe(true))
  })

  it('sorts the visible employees by selected field and direction', async () => {
    mockDirectory()

    render(<EmployeesPage />)
    await screen.findByText('Lê Thu Hà')
    fireEvent.click(screen.getByRole('button', { name: /Lọc & sắp xếp/i }))
    fireEvent.change(await screen.findByRole('combobox', { name: 'Sắp xếp nhân sự theo' }), { target: { value: 'employeeCode' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đổi thứ tự sắp xếp nhân sự' }))

    await waitFor(() => {
      const rows = screen.getAllByRole('row').slice(1)
      expect(rows[0]).toHaveTextContent('BA-003')
      expect(rows[2]).toHaveTextContent('BA-001')
      expect(apiMock.mock.calls.some(([path]) => new URL(path, 'http://localhost').searchParams.get('sort') === 'employeeCode,desc')).toBe(true)
    })
  })

  it('opens the add-employee form immediately when requested from the dashboard', async () => {
    mockDirectory()

    render(<EmployeesPage openForm />)

    expect(screen.getByRole('heading', { name: 'Thêm nhân sự' })).toBeVisible()
    expect(await screen.findByText('Lê Thu Hà')).toBeInTheDocument()
    expect(screen.getAllByText('Đã nghỉ việc').length).toBeGreaterThan(0)
  })

  it('edits an active employee with PUT and shows a confirmation', async () => {
    mockDirectory()

    render(<EmployeesPage />)
    fireEvent.click(await screen.findByRole('button', { name: 'Sửa hồ sơ Nguyễn Minh Anh' }))

    const form = await screen.findByRole('form', { name: 'Sửa hồ sơ Nguyễn Minh Anh' })
    expect(within(form).getByLabelText('Mã nhân viên')).toHaveAttribute('readonly')
    await waitFor(() => expect(within(form).getByLabelText('Phòng ban')).toHaveValue('2'))
    fireEvent.change(within(form).getByLabelText('Họ và tên'), { target: { value: 'Nguyễn Minh Anh B' } })
    fireEvent.change(within(form).getByLabelText('Phòng ban'), { target: { value: '1' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/employees/2', expect.objectContaining({ method: 'PUT' })))
    const [, options] = apiMock.mock.calls.find(([path, opts]) => path === '/employees/2' && opts?.method === 'PUT')!
    expect(JSON.parse(options.body)).toEqual({ fullName: 'Nguyễn Minh Anh B', gender: 'FEMALE', nationalId: null, phone: '0902', email: 'anh@example.com', address: null, educationLevel: null, joinDate: '2025-01-01', departmentId: 1, positionId: 1 })
    expect(await screen.findByText('Đã cập nhật hồ sơ Nguyễn Minh Anh B.')).toBeVisible()
    expect(screen.queryByRole('form', { name: 'Sửa hồ sơ Nguyễn Minh Anh' })).not.toBeInTheDocument()
  })

  it('does not offer editing for terminated employees', async () => {
    mockDirectory()

    render(<EmployeesPage />)

    expect(await screen.findByText('Lê Thu Hà')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sửa hồ sơ Lê Thu Hà' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sửa hồ sơ Trần Quốc Bảo' })).toBeVisible()
  })

  it('warns that terminating also ends open contracts before calling the API', async () => {
    mockDirectory()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false)

    render(<EmployeesPage />)
    const row = (await screen.findByText('Trần Quốc Bảo')).closest('tr')!
    fireEvent.click(within(row).getByRole('button', { name: 'Cho nghỉ việc' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('Hợp đồng đang hiệu lực sẽ chấm dứt cùng ngày'))
    expect(apiMock.mock.calls.some(([, options]) => options?.method === 'DELETE')).toBe(false)
    confirm.mockRestore()
  })
})
