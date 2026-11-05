import { act, cleanup, render as renderComponent, screen, waitFor } from '@testing-library/react'
import { useState, type ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AssistantPage } from './AssistantPage'
import { AssistantConversationProvider } from '../context/AssistantConversationContext'

function render(component: ReactNode) {
  return renderComponent(<AssistantConversationProvider>{component}</AssistantConversationProvider>)
}

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ user: { username: 'employee01', roles: ['EMPLOYEE'] } }) }))

beforeEach(() => { apiMock.mockReset() })
afterEach(cleanup)

it('sends the preceding conversation with a follow-up question', async () => {
  apiMock.mockResolvedValue({ kind: 'ANSWER', answer: 'Bảng lương tháng 9/2026', facts: [], sources: [] })
  const user = userEvent.setup()
  render(<AssistantPage />)
  const input = screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' })
  await user.type(input, 'Lương tháng 9/2026 của tôi?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText('Bảng lương tháng 9/2026')
  await user.clear(input)
  await user.type(input, 'Còn tháng 8 thì sao?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await waitFor(() => expect(apiMock).toHaveBeenLastCalledWith('/assistant/answers', expect.objectContaining({
    body: JSON.stringify({ question: 'Còn tháng 8 thì sao?', history: [
      { question: 'Lương tháng 9/2026 của tôi?', answer: 'Bảng lương tháng 9/2026' },
    ] }),
  })))
})

it('keeps history across page navigation and clears it for a new conversation', async () => {
  apiMock.mockResolvedValue({ kind: 'ANSWER', answer: 'Lương tháng 9/2026', facts: [], sources: [] })
  function Workspace() {
    const [open, setOpen] = useState(true)
    return <><button onClick={() => setOpen(value => !value)}>Chuyển trang</button>{open && <AssistantPage />}</>
  }
  const user = userEvent.setup()
  render(<Workspace />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Lương tháng 9/2026?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText('Lương tháng 9/2026')
  await user.click(screen.getByRole('button', { name: 'Chuyển trang' }))
  await user.click(screen.getByRole('button', { name: 'Chuyển trang' }))
  expect(screen.getByText('Lịch sử trong phiên (1 lượt)')).toBeInTheDocument()
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Còn tháng 8?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  expect(JSON.parse(apiMock.mock.lastCall?.[1].body).history).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: 'Hội thoại mới' }))
  expect(screen.queryByText(/Lịch sử trong phiên/)).not.toBeInTheDocument()
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Lương của tôi?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  expect(JSON.parse(apiMock.mock.lastCall?.[1].body).history).toEqual([])
})

it('does not retain a failed question as context', async () => {
  apiMock.mockRejectedValueOnce(new Error('AI_UNAVAILABLE'))
    .mockResolvedValue({ kind: 'ANSWER', answer: 'Đã kết nối', facts: [], sources: [] })
  const user = userEvent.setup()
  render(<AssistantPage />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Lương tháng 9?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText('AI_UNAVAILABLE')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await screen.findByText('Đã kết nối')
  expect(JSON.parse(apiMock.mock.lastCall?.[1].body).history).toEqual([])
})

it('aborts a pending question on navigation and ignores its late response', async () => {
  let resolveAnswer!: (value: unknown) => void
  let requestSignal: AbortSignal | undefined
  apiMock.mockImplementationOnce((_path: string, options: RequestInit) => {
    requestSignal = options.signal ?? undefined
    return new Promise(resolve => { resolveAnswer = resolve })
  })
  function Workspace() {
    const [open, setOpen] = useState(true)
    return <><button onClick={() => setOpen(value => !value)}>Chuyển trang</button>{open && <AssistantPage />}</>
  }
  const user = userEvent.setup()
  render(<Workspace />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Lương của tôi?')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  await user.click(screen.getByRole('button', { name: 'Chuyển trang' }))
  expect(requestSignal?.aborted).toBe(true)
  await act(async () => { resolveAnswer({ kind: 'ANSWER', answer: 'Phản hồi đến muộn', facts: [], sources: [] }) })
  await user.click(screen.getByRole('button', { name: 'Chuyển trang' }))
  expect(screen.queryByText(/Lịch sử trong phiên/)).not.toBeInTheDocument()
  expect(screen.queryByText('Phản hồi đến muộn')).not.toBeInTheDocument()
})

it('does not change the profile until the user confirms the proposal', async () => {
  apiMock.mockImplementation(async (path: string) => {
    if (path === '/assistant/answers') return {
      kind: 'PROPOSAL', proposal: { action: 'UPDATE_OWN_PROFILE', summary: 'Đổi email',
        payload: { email: 'new@example.com', phone: '0900000000', expectedEmail: 'old@example.com', expectedPhone: '0900000000' } }, facts: [], sources: [], answer: null,
    }
    if (path === '/employees/me') return { email: 'new@example.com' }
    throw new Error(`Unexpected request: ${path}`)
  })
  const user = userEvent.setup()
  render(<AssistantPage />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Đổi email cho tôi')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  expect(await screen.findByText('Đổi email')).toBeInTheDocument()
  expect(apiMock).toHaveBeenCalledTimes(1)
  await user.click(screen.getByRole('button', { name: 'Xác nhận thực hiện' }))
  await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/employees/me',
    expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ email: 'new@example.com', phone: '0900000000', expectedEmail: 'old@example.com', expectedPhone: '0900000000' }) })))
})

it('shows source facts and never offers confirmation for an answer', async () => {
  apiMock.mockResolvedValue({ kind: 'ANSWER', answer: 'Lương tháng 9', facts: [{ label: 'Thực lĩnh', value: '14000000' }], sources: ['Bảng lương của tôi'] })
  const user = userEvent.setup()
  render(<AssistantPage />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Lương tháng 9 của tôi')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  expect(await screen.findByText('14000000')).toBeInTheDocument()
  expect(screen.getByText('Bảng lương của tôi')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'Xác nhận thực hiện' })).not.toBeInTheDocument()
})

it('creates a leave request only after confirmation', async () => {
  apiMock.mockImplementation(async (path: string) => {
    if (path === '/assistant/answers') return { kind: 'PROPOSAL', proposal: {
      action: 'CREATE_OWN_LEAVE', summary: 'Nghỉ phép', payload: {
        leaveTypeId: 1, fromDate: '2030-03-02', toDate: '2030-03-03', reason: 'Việc gia đình',
      },
    }, facts: [], sources: [] }
    if (path === '/leave-types') return [{ id: 1, name: 'Nghỉ phép năm' }]
    if (path === '/leave-requests') return { id: 9 }
    throw new Error(`Unexpected request: ${path}`)
  })
  const user = userEvent.setup()
  render(<AssistantPage />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Tôi muốn nghỉ phép')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  expect(await screen.findByRole('form', { name: 'Bản nháp chờ xác nhận' })).toBeInTheDocument()
  expect(apiMock).not.toHaveBeenCalledWith('/leave-requests', expect.anything())
  await user.click(screen.getByRole('button', { name: 'Xác nhận thực hiện' }))
  await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/leave-requests',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({
      leaveTypeId: 1, fromDate: '2030-03-02', toDate: '2030-03-03', reason: 'Việc gia đình',
    }) })))
})

it('keeps the proposal visible when confirmation fails', async () => {
  apiMock.mockImplementation(async (path: string) => {
    if (path === '/assistant/answers') return { kind: 'PROPOSAL', proposal: {
      action: 'CANCEL_OWN_LEAVE', summary: 'Hủy đơn', payload: { leaveRequestId: 9 },
    }, facts: [], sources: [] }
    if (path === '/leave-requests/9/cancel') throw new Error('Đơn không còn chờ duyệt')
    throw new Error(`Unexpected request: ${path}`)
  })
  const user = userEvent.setup()
  render(<AssistantPage />)
  await user.type(screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' }), 'Hủy đơn 9 của tôi')
  await user.click(screen.getByRole('button', { name: 'Gửi câu hỏi' }))
  expect(await screen.findByRole('form', { name: 'Bản nháp chờ xác nhận' })).toBeInTheDocument()
  await user.click(screen.getByRole('button', { name: 'Xác nhận thực hiện' }))
  expect(await screen.findByText('Đơn không còn chờ duyệt')).toBeInTheDocument()
  expect(screen.getByRole('form', { name: 'Bản nháp chờ xác nhận' })).toBeInTheDocument()
})
