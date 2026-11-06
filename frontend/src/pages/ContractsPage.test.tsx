import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ContractsPage } from './ContractsPage'
import { localDate } from '../utils/dates'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('../api/client', () => ({ api: apiMock }))

afterEach(() => { cleanup(); vi.restoreAllMocks(); apiMock.mockReset() })

const employees = [
  { id: 3, employeeCode: 'BA-EMP-001', fullName: 'Nguyễn Minh Anh', gender: 'FEMALE', phone: '0901', email: 'anh@example.com', joinDate: '2025-01-01', status: 'ACTIVE', departmentName: 'Đào tạo', positionTitle: 'Giáo viên' },
  { id: 4, employeeCode: 'BA-EMP-002', fullName: 'Phạm Ngọc Lan', gender: 'FEMALE', phone: '0902', email: 'lan@example.com', joinDate: '2024-01-01', status: 'ACTIVE', departmentName: 'Vận hành', positionTitle: 'Trợ lý' },
]
const contracts = [
  { id: 1, employeeId: 3, employeeName: 'Nguyễn Minh Anh', employeeCode: 'BA-EMP-001', contractNumber: 'HD-BA-003', contractType: 'Không xác định thời hạn', startDate: '2025-01-01', endDate: null, baseSalary: 14000000, allowance: 500000, status: 'ACTIVE', effectiveStatus: 'ACTIVE' },
  { id: 3, employeeId: 5, employeeName: 'Võ Hoàng Nam', employeeCode: 'BA-EMP-003', contractNumber: 'HD-BA-005', contractType: 'Không xác định thời hạn', startDate: '2021-09-22', endDate: null, baseSalary: 16000000, allowance: 700000, status: 'ACTIVE', effectiveStatus: 'ACTIVE' },
  { id: 4, employeeId: 5, employeeName: 'Võ Hoàng Nam', employeeCode: 'BA-EMP-003', contractNumber: 'HD-CANCELLED', contractType: 'Không xác định thời hạn', startDate: '2026-12-01', endDate: '2026-11-05', baseSalary: 17000000, allowance: 0, status: 'TERMINATED', effectiveStatus: 'TERMINATED' },
  { id: 2, employeeId: 4, employeeName: 'Phạm Ngọc Lan', employeeCode: 'BA-EMP-002', contractNumber: 'HD-OLD', contractType: 'Thử việc', startDate: '2024-01-01', endDate: '2024-03-01', baseSalary: 8000000, allowance: 0, status: 'ACTIVE', effectiveStatus: 'EXPIRED' },
]

function mockApi() {
  apiMock.mockImplementation(async (path: string, options?: RequestInit) => {
    if (path.startsWith('/employees')) return { content: [...employees, { ...employees[0], id: 5, fullName: 'Võ Hoàng Nam', employeeCode: 'BA-EMP-003', status: 'TERMINATED' }], page: 0, size: 100, totalElements: employees.length + 1, totalPages: 1 }
    if (path === '/contracts' && options?.method === 'POST') {
      const body = JSON.parse(String(options.body))
      return { ...contracts[0], ...body, id: 9, employeeName: 'Nguyễn Minh Anh', effectiveStatus: 'UPCOMING' }
    }
    if (path === '/contracts') return contracts
    if (path.endsWith('/terminate')) return { ...contracts[0], status: 'TERMINATED', effectiveStatus: 'TERMINATED' }
    return {}
  })
}

function nextMonthStart() {
  const today = new Date()
  return localDate(new Date(today.getFullYear(), today.getMonth() + 1, 1))
}

describe('ContractsPage', () => {
  it('lists contracts with Vietnamese status, dates and money, and offers actions only on active contracts', async () => {
    mockApi()
    render(<ContractsPage />)

    const row = (await screen.findByText('HD-BA-003')).closest('tr')!
    expect(row).toHaveTextContent('01/01/2025 → Không thời hạn')
    expect(row).toHaveTextContent('14.000.000')
    expect(within(row).getByText('Đang hiệu lực')).toBeVisible()
    expect(within(row).getByRole('button', { name: 'Điều chỉnh lương Nguyễn Minh Anh' })).toBeVisible()
    const expired = screen.getByText('HD-OLD').closest('tr')!
    expect(expired).toHaveTextContent('Hết hạn')
    expect(within(expired).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('CHƯA CÓ HỢP ĐỒNG').closest('div')).toHaveTextContent('1')
    expect(screen.getByText('ĐANG HIỆU LỰC').closest('div')).toHaveTextContent('1')
    const former = screen.getByText('HD-BA-005').closest('tr')!
    expect(former).toHaveTextContent('Nhân sự đã nghỉ việc')
    expect(within(former).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('option', { name: /Võ Hoàng Nam/ })).not.toBeInTheDocument()
    const cancelled = screen.getByText('HD-CANCELLED').closest('tr')!
    expect(cancelled).toHaveTextContent('Từ 01/12/2026')
    expect(cancelled).toHaveTextContent('Hủy ngày 05/11/2026, chưa từng áp dụng')
    expect(within(cancelled).getByText('Đã hủy')).toBeVisible()
    expect(cancelled).not.toHaveTextContent('→')
  })

  it('prefills a salary adjustment from the current contract and posts a new contract', async () => {
    mockApi()
    render(<ContractsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Điều chỉnh lương Nguyễn Minh Anh' }))
    const form = await screen.findByRole('form', { name: 'Điều chỉnh lương' })
    const start = nextMonthStart()
    expect(within(form).getByLabelText('Ngày bắt đầu')).toHaveValue(start)
    expect(within(form).getByLabelText('Số hợp đồng')).toHaveValue(`HD-BA-EMP-001-${start.split('-').join('')}`)
    expect(within(form).getByLabelText('Lương cơ bản (₫)')).toHaveValue(14000000)

    fireEvent.change(within(form).getByLabelText('Lương cơ bản (₫)'), { target: { value: '15400000' } })
    expect(form).toHaveTextContent('Thay thế HD-BA-003')
    expect(form).toHaveTextContent('+10%')
    fireEvent.click(within(form).getByRole('button', { name: 'Lưu hợp đồng' }))

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/contracts', expect.objectContaining({ method: 'POST' })))
    const [, options] = apiMock.mock.calls.find(([path, opts]) => path === '/contracts' && opts?.method === 'POST')!
    expect(JSON.parse(options.body)).toEqual({ employeeId: 3, contractNumber: `HD-BA-EMP-001-${start.split('-').join('')}`, contractType: 'Không xác định thời hạn', startDate: start, endDate: null, baseSalary: 15400000, allowance: 500000 })
    expect(await screen.findByText(/Đã lưu hợp đồng HD-BA-EMP-001-/)).toBeVisible()
  })

  it('blocks a new contract that starts before the current one or ends before it starts', async () => {
    mockApi()
    render(<ContractsPage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Điều chỉnh lương Nguyễn Minh Anh' }))
    const form = await screen.findByRole('form', { name: 'Điều chỉnh lương' })
    fireEvent.change(within(form).getByLabelText('Ngày bắt đầu'), { target: { value: '2024-12-01' } })
    expect(within(form).getByRole('alert')).toHaveTextContent('Hợp đồng mới phải bắt đầu sau 01/01/2025.')
    expect(within(form).getByRole('button', { name: 'Lưu hợp đồng' })).toBeDisabled()

    fireEvent.change(within(form).getByLabelText('Ngày bắt đầu'), { target: { value: '2030-02-01' } })
    fireEvent.change(within(form).getByLabelText('Ngày kết thúc (nếu có)'), { target: { value: '2030-01-01' } })
    expect(within(form).getByRole('button', { name: 'Lưu hợp đồng' })).toBeDisabled()
    expect(apiMock.mock.calls.some(([, opts]) => opts?.method === 'POST')).toBe(false)
  })

  it('terminates an active contract only after confirmation', async () => {
    mockApi()
    const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true)
    render(<ContractsPage />)

    const button = await screen.findByRole('button', { name: 'Chấm dứt hợp đồng HD-BA-003' })
    fireEvent.click(button)
    expect(apiMock.mock.calls.some(([path]) => String(path).endsWith('/terminate'))).toBe(false)

    fireEvent.click(button)
    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/contracts/1/terminate', { method: 'PATCH', body: JSON.stringify({ endDate: localDate(new Date()) }) }))
    expect(confirm).toHaveBeenCalledTimes(2)
    expect(await screen.findByText('Đã chấm dứt hợp đồng HD-BA-003.')).toBeVisible()
  })
})
