import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LeavePage } from './LeavePage'

const { apiMock, auth } = vi.hoisted(() => ({ apiMock: vi.fn(), auth: { roles: ['HR_MANAGER'] as string[] } }))

vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'user', displayName: 'Người dùng', roles: auth.roles }, logout: vi.fn() }),
}))

afterEach(() => { cleanup(); vi.restoreAllMocks(); apiMock.mockReset(); auth.roles = ['HR_MANAGER'] })

const leaves = [
  { id: 7, employeeId: 3, employeeName: 'Nguyễn Minh Anh', leaveType: 'Nghỉ phép năm', fromDate: '2026-11-03', toDate: '2026-11-05', reason: 'Việc gia đình', status: 'PENDING' },
  { id: 8, employeeId: 4, employeeName: 'Trần Quốc Bảo', leaveType: 'Nghỉ ốm', fromDate: '2026-10-01', toDate: '2026-10-01', reason: 'Khám bệnh', status: 'REJECTED', rejectionReason: 'Thiếu giấy tờ' },
]

function mockLeaves() {
  apiMock.mockImplementation(async (path: string) => {
    if (path === '/leave-types') return [{ id: 1, name: 'Nghỉ phép năm' }]
    if (path.startsWith('/leave-requests?')) return { content: leaves, page: 0, size: 20, totalElements: leaves.length, totalPages: 1 }
    return {}
  })
}

describe('LeavePage', () => {
  it('shows Vietnamese statuses, DD/MM/YYYY dates, day counts and rejection reasons', async () => {
    mockLeaves()
    render(<LeavePage />)

    const row = (await screen.findByText('Nguyễn Minh Anh')).closest('tr')!
    expect(row).toHaveTextContent('03/11/2026 → 05/11/2026')
    expect(row).toHaveTextContent('3 ngày')
    expect(within(row).getByText('Chờ duyệt')).toBeVisible()
    expect(row).not.toHaveTextContent('PENDING')
    const rejected = screen.getByText('Trần Quốc Bảo').closest('tr')!
    expect(rejected).toHaveTextContent('Từ chối')
    expect(rejected).toHaveTextContent('Lý do: Thiếu giấy tờ')
  })

  it('asks for a rejection reason, sends it and confirms the result', async () => {
    mockLeaves()
    vi.spyOn(window, 'prompt').mockReturnValue('  Trùng lịch dạy  ')
    render(<LeavePage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối đơn của Nguyễn Minh Anh' }))

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/leave-requests/7/review', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'REJECTED', rejectionReason: 'Trùng lịch dạy' }) })))
    expect(await screen.findByText('Đã từ chối đơn của Nguyễn Minh Anh.')).toBeVisible()
  })

  it('does not reject when the reviewer cancels the reason prompt', async () => {
    mockLeaves()
    vi.spyOn(window, 'prompt').mockReturnValue(null)
    render(<LeavePage />)

    fireEvent.click(await screen.findByRole('button', { name: 'Từ chối đơn của Nguyễn Minh Anh' }))

    expect(apiMock.mock.calls.some(([path]) => String(path).includes('/review'))).toBe(false)
  })

  it('blocks a leave request whose end date is before its start date', async () => {
    auth.roles = ['EMPLOYEE']
    mockLeaves()
    render(<LeavePage />)

    fireEvent.click(await screen.findByRole('button', { name: '＋ Tạo đơn nghỉ' }))
    fireEvent.change(screen.getByLabelText('Từ ngày'), { target: { value: '2030-01-10' } })
    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2030-01-12' } })
    expect(screen.getByText('Tổng thời gian nghỉ:', { exact: false })).toHaveTextContent('Tổng thời gian nghỉ: 3 ngày')

    fireEvent.change(screen.getByLabelText('Đến ngày'), { target: { value: '2030-01-08' } })
    expect(screen.getByText('Đến ngày phải bằng hoặc sau Từ ngày.')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Gửi đơn' })).toBeDisabled()
  })
})
