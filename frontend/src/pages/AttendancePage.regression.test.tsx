import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AttendancePage } from './AttendancePage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { roles: ['HR_MANAGER'] } }) }))
beforeEach(() => {
  apiMock.mockReset()
  apiMock.mockImplementation(async (path: string) => {
    if (path.startsWith('/employees')) return { content: [{ id: 3, fullName: 'Test', employeeCode: 'TEST' }] }
    if (path === '/work-shifts') return [{ id: 1, name: 'Ca sáng', startTime: '08:00', endTime: '17:00' }]
    if (path.startsWith('/work-schedules?')) return [{ id: 9, shiftId: 1 }]
    if (path === '/work-schedules') throw new Error('Lịch làm đã tồn tại')
    return []
  })
})
afterEach(cleanup)

it('rejects reversed times before creating any schedule', async () => {
  render(<AttendancePage />)
  fireEvent.click(screen.getByRole('button', { name: /Nhập chấm công/ }))
  await screen.findByRole('option', { name: 'Test · TEST' })
  fireEvent.change(screen.getByLabelText('Giờ vào'), { target: { value: '18:00' } })
  fireEvent.change(screen.getByLabelText('Giờ ra'), { target: { value: '08:00' } })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm công' }))
  await waitFor(() => expect(screen.getByText('Giờ ra phải sau giờ vào')).toBeVisible())
  expect(apiMock.mock.calls.filter(([, options]) => options?.method === 'POST')).toHaveLength(0)
})

it('reuses an existing schedule when retrying attendance', async () => {
  render(<AttendancePage />)
  fireEvent.click(screen.getByRole('button', { name: /Nhập chấm công/ }))
  await screen.findByRole('option', { name: 'Test · TEST' })
  fireEvent.click(screen.getByRole('button', { name: 'Lưu chấm công' }))
  await screen.findByText('Đã ghi nhận lịch làm và chấm công')
  const writes = apiMock.mock.calls.filter(([, options]) => options?.method === 'POST')
  expect(writes).toHaveLength(1)
  expect(writes[0][0]).toBe('/attendance')
  expect(JSON.parse(writes[0][1].body).scheduleId).toBe(9)
})
