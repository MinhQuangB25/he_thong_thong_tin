import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AppShell } from './AppShell'
import { AssistantConversationProvider } from '../context/AssistantConversationContext'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] }, logout: vi.fn() }),
}))

vi.setConfig({ testTimeout: 15000 })
beforeEach(() => { apiMock.mockReset() })
afterEach(cleanup)

function renderShell(screenName: 'dashboard' | 'assistant', onNavigate = vi.fn()) {
  render(<AssistantConversationProvider>
    <AppShell screen={screenName} onNavigate={onNavigate}><p>Nội dung trang</p></AppShell>
  </AssistantConversationProvider>)
  return onNavigate
}

it('opens the floating chat, answers in it and closes with Escape returning focus', async () => {
  apiMock.mockResolvedValue({ kind: 'ANSWER', answer: 'Bảng lương tháng này: 14.000.000 ₫', facts: [], sources: [] })
  const user = userEvent.setup({ delay: null })
  renderShell('dashboard')

  const launcher = screen.getByRole('button', { name: 'Mở trợ lý AI' })
  expect(launcher).toHaveAttribute('aria-expanded', 'false')
  await user.click(launcher)
  expect(screen.getByRole('dialog', { name: 'Trợ lý AI' })).toBeInTheDocument()
  const input = screen.getByRole('textbox', { name: 'Câu hỏi hoặc yêu cầu' })
  expect(input).toHaveFocus()
  await user.type(input, 'Lương tháng này?{Enter}')
  expect(await screen.findByText('Bảng lương tháng này: 14.000.000 ₫')).toBeInTheDocument()

  await user.keyboard('{Escape}')
  expect(screen.queryByRole('dialog', { name: 'Trợ lý AI' })).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Mở trợ lý AI' })).toHaveFocus()

  await user.click(screen.getByRole('button', { name: 'Mở trợ lý AI' }))
  expect(screen.getByText('Bảng lương tháng này: 14.000.000 ₫')).toBeInTheDocument()
})

it('can expand to the full assistant page and is hidden there', async () => {
  const user = userEvent.setup({ delay: null })
  const onNavigate = renderShell('dashboard')
  await user.click(screen.getByRole('button', { name: 'Mở trợ lý AI' }))
  await user.click(screen.getByRole('button', { name: 'Mở trợ lý toàn trang' }))
  expect(onNavigate).toHaveBeenCalledWith('assistant')
  cleanup()

  renderShell('assistant')
  expect(screen.queryByRole('button', { name: 'Mở trợ lý AI' })).not.toBeInTheDocument()
})
