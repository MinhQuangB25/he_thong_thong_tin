import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnualPayrollSummary, Payroll } from '../api/types'
import { PayrollPage } from './PayrollPage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] } }),
}))

const payroll: Payroll = {
  id: 21, periodId: 9, month: 9, year: 2026, employeeId: 3, employeeName: 'Nguyễn Minh Anh',
  baseSalary: 4_000_000, workedDays: 26, overtimeHours: 0, overtimePay: 0,
  allowances: 500_000, deductions: 0, netSalary: 4_500_000, status: 'LOCKED',
}
const summary: AnnualPayrollSummary = {
  year: 2026, periodCount: 2, totalBaseSalary: 8_000_000, totalAllowances: 1_000_000,
  totalOvertimePay: 0, totalDeductions: 0, totalNetSalary: 9_000_000,
}

function mockPayroll(status = 'LOCKED') {
  apiMock.mockImplementation(async (path: string) => {
    const url = new URL(path, 'http://localhost')
    if (url.pathname === '/payrolls') {
      return url.searchParams.get('month') === '9' && url.searchParams.get('year') === '2026'
        ? [{ ...payroll, status }] : []
    }
    if (url.pathname === '/payrolls/annual-summary') return summary
    if (url.pathname === '/employees/me') return { fullName: 'Nguyễn Minh Anh', employeeCode: 'BA-EMP-001' }
    if (url.pathname === '/payrolls/calculation-rule') {
      return { standardWorkDays: 26, overtimeMultiplier: 1.5, formula: 'Lương theo ngày công + phụ cấp' }
    }
    // An employee must derive status from their payroll, without a manager-only request.
    throw new Error(`Unexpected employee payroll request: ${path}`)
  })
}

async function renderPayroll() {
  const result = render(<PayrollPage />)
  expect(await screen.findByRole('table', { name: 'Chi tiết bảng lương theo tháng' })).toBeVisible()
  return result
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 22, 12))
  apiMock.mockReset()
  mockPayroll()
})
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks() })

describe('F14: employee payroll period status', () => {
  it.each([['DRAFT', 'Bản nháp'], ['LOCKED', 'Đã khóa']])('shows %s from an existing employee payroll item', async (status, label) => {
    mockPayroll(status)
    await renderPayroll()

    const statusCard = screen.getByText('TRẠNG THÁI KỲ').closest('div')
    expect(statusCard).toHaveTextContent(label)
    expect(statusCard).not.toHaveTextContent(status)
    expect(statusCard).not.toHaveTextContent('CHƯA TẠO')
    expect(apiMock.mock.calls.map(([path]) => new URL(path, 'http://localhost').pathname))
      .not.toContain('/payroll-periods')
  })

  it('does not reuse the previous period status when the selected month has no payroll', async () => {
    const user = userEvent.setup()
    await renderPayroll()
    await user.selectOptions(screen.getByLabelText('Tháng'), '1')

    expect(await screen.findByText('Chưa có bảng lương trong kỳ đã chọn.')).toBeVisible()
    const statusCard = screen.getByText('TRẠNG THÁI KỲ').closest('div')
    expect(statusCard).toHaveTextContent('CHƯA TẠO')
    expect(statusCard).not.toHaveTextContent('LOCKED')
  })
})

describe('distinct monthly and annual print selection', () => {
  it('identifies the employee on the annual print even when the selected month has no payroll', async () => {
    const user = userEvent.setup()
    const { container } = await renderPayroll()
    await user.selectOptions(screen.getByLabelText('Tháng'), '1')
    expect(await screen.findByText('Chưa có bảng lương trong kỳ đã chọn.')).toBeVisible()

    const annualSection = container.querySelector('[data-print-section="year"]')
    expect(annualSection).toHaveTextContent('Nguyễn Minh Anh')
    expect(annualSection).toHaveTextContent('BA-EMP-001')
  })

  it.each([
    { mode: 'month', button: 'In bảng lương tháng' },
    { mode: 'year', button: 'In bảng lương năm' },
  ])('sets data-print-mode=$mode before window.print runs', async ({ mode, button }) => {
    const user = userEvent.setup()
    const { container } = await renderPayroll()
    const modesAtPrint: (string | null | undefined)[] = []
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      modesAtPrint.push(container.querySelector('.payroll-page')?.getAttribute('data-print-mode'))
    })

    await user.click(screen.getByRole('button', { name: button }))

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1))
    expect(modesAtPrint).toEqual([mode])
  })

  it('prints month, year, then month with the current selection each time', async () => {
    const user = userEvent.setup()
    const { container } = await renderPayroll()
    const modesAtPrint: (string | null | undefined)[] = []
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      modesAtPrint.push(container.querySelector('.payroll-page')?.getAttribute('data-print-mode'))
    })

    for (const [index, button] of ['In bảng lương tháng', 'In bảng lương năm', 'In bảng lương tháng'].entries()) {
      await user.click(screen.getByRole('button', { name: button }))
      await waitFor(() => expect(print).toHaveBeenCalledTimes(index + 1))
    }
    expect(modesAtPrint).toEqual(['month', 'year', 'month'])
  })
})
