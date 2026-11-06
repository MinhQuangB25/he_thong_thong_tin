import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnnualPayrollSummary, CalculationRule, Payroll } from '../api/types'
import { PayrollPage } from './PayrollPage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] },
    logout: vi.fn(),
  }),
}))

const payroll: Payroll = {
  id: 21,
  periodId: 9,
  month: 9,
  year: 2026,
  employeeId: 3,
  employeeName: 'Nguyễn Minh Anh',
  baseSalary: 26_000_000,
  workedDays: 26,
  overtimeHours: 2,
  overtimePay: 375_000,
  allowances: 500_000,
  deductions: 125_000,
  netSalary: 26_750_000,
  status: 'LOCKED',
}

const annualSummary: AnnualPayrollSummary = {
  year: 2026,
  periodCount: 2,
  totalBaseSalary: 52_000_000,
  totalAllowances: 1_000_000,
  totalOvertimePay: 750_000,
  totalDeductions: 250_000,
  totalNetSalary: 53_500_000,
}

const calculationRule: CalculationRule = {
  standardWorkDays: 26,
  overtimeMultiplier: 1.5,
  formula: 'Thực lĩnh = lương theo ngày công + tăng ca + phụ cấp - khấu trừ.',
}

function mockPayrollApi(status = 'LOCKED') {
  apiMock.mockImplementation(async (path: string) => {
    const url = new URL(path, 'http://localhost')
    if (url.pathname === '/payrolls' && url.searchParams.get('month') === '9' && url.searchParams.get('year') === '2026') {
      return [{ ...payroll, status } satisfies Payroll]
    }
    if (url.pathname === '/payrolls/annual-summary' && url.searchParams.get('year') === '2026') return annualSummary
    if (url.pathname === '/employees/me') return { fullName: 'Nguyễn Minh Anh', employeeCode: 'BA-EMP-001' }
    if (url.pathname === '/payrolls/calculation-rule') return calculationRule
    throw new Error(`Unexpected employee API request: ${path}`)
  })
}

async function renderLoadedPayroll() {
  const result = render(<PayrollPage />)
  const table = await screen.findByRole('table', { name: 'Chi tiết bảng lương theo tháng' })
  expect(within(table).getByText(payroll.employeeName)).toBeInTheDocument()
  return result
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 22, 12))
  apiMock.mockReset()
  mockPayrollApi()
})

afterEach(() => {
  cleanup()
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('F14: employee payroll status', () => {
  it.each([['DRAFT', 'Bản nháp'], ['LOCKED', 'Đã khóa']])('shows the existing payroll status %s instead of CHƯA TẠO', async (status, label) => {
    mockPayrollApi(status)
    await renderLoadedPayroll()

    const statusCard = screen.getByText('TRẠNG THÁI KỲ').closest('div')
    expect(statusCard).toHaveTextContent(label)
    expect(statusCard).not.toHaveTextContent(status)
    expect(statusCard).not.toHaveTextContent('CHƯA TẠO')
  })
})

describe('payroll print scope regression', () => {
  it.each([
    { scope: 'month', button: 'In bảng lương tháng' },
    { scope: 'year', button: 'In bảng lương năm' },
  ])('selects the $scope scope before opening print', async ({ scope, button }) => {
    const user = userEvent.setup()
    const { container } = await renderLoadedPayroll()
    const page = container.querySelector('.payroll-page')
    const printedScopes: (string | null | undefined)[] = []
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      printedScopes.push(page?.getAttribute('data-print-scope'))
    })

    await user.click(screen.getByRole('button', { name: button }))

    await waitFor(() => expect(print).toHaveBeenCalledTimes(1))
    expect(printedScopes).toEqual([scope])

    // These section markers are the agreed contract for distinct print CSS.
    const monthlySection = page?.querySelector('[data-print-section="month"]')
    const annualSection = page?.querySelector('[data-print-section="year"]')
    const monthlyHeading = screen.getByRole('heading', { name: 'Bảng lương tháng 9/2026' })
    const annualHeading = screen.getByRole('heading', { name: 'Tổng hợp bảng lương năm 2026' })
    expect(monthlySection).toContainElement(monthlyHeading)
    expect(monthlySection).not.toContainElement(annualHeading)
    expect(annualSection).toContainElement(annualHeading)
    expect(annualSection).not.toContainElement(monthlyHeading)
  })

  it('switches month, year, and month again without printing a stale scope', async () => {
    const user = userEvent.setup()
    const { container } = await renderLoadedPayroll()
    const printedScopes: (string | null | undefined)[] = []
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      printedScopes.push(container.querySelector('.payroll-page')?.getAttribute('data-print-scope'))
    })

    await user.click(screen.getByRole('button', { name: 'In bảng lương tháng' }))
    await waitFor(() => expect(print).toHaveBeenCalledTimes(1))
    await user.click(screen.getByRole('button', { name: 'In bảng lương năm' }))
    await waitFor(() => expect(print).toHaveBeenCalledTimes(2))
    await user.click(screen.getByRole('button', { name: 'In bảng lương tháng' }))
    await waitFor(() => expect(print).toHaveBeenCalledTimes(3))

    expect(printedScopes).toEqual(['month', 'year', 'month'])
  })
})
