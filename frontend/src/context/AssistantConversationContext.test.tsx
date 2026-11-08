import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider, useAuth } from './AuthContext'
import { useAssistantConversation } from './AssistantConversationContext'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))
vi.mock('../api/client', () => ({ api: apiMock, setAccessToken: vi.fn() }))
beforeEach(() => { apiMock.mockReset() })
afterEach(cleanup)

function Workspace() {
  const { user, login, logout } = useAuth()
  const { history, append } = useAssistantConversation()
  return <>
    <p>{user?.username ?? 'Chưa đăng nhập'}</p>
    <button onClick={() => login('employee01', 'password')}>Đăng nhập nhân viên</button>
    <button onClick={() => login('admin', 'password')}>Đăng nhập admin</button>
    <button onClick={logout}>Đăng xuất</button>
    <button onClick={() => append(`Câu hỏi ${history.length}`, { kind: 'ANSWER', answer: 'x'.repeat(700), facts: [], sources: [] })}>Thêm lượt</button>
    <output aria-label="Lịch sử">{JSON.stringify(history)}</output>
  </>
}

it('keeps only four bounded turns in memory', async () => {
  render(<AuthProvider><Workspace /></AuthProvider>)
  const user = userEvent.setup()
  for (let index = 0; index < 5; index++) await user.click(screen.getByRole('button', { name: 'Thêm lượt' }))
  const history = JSON.parse(screen.getByLabelText('Lịch sử').textContent ?? '[]')
  expect(history).toHaveLength(4)
  expect(history[0].question).toBe('Câu hỏi 1')
  expect(history.every((turn: { answer: string }) => turn.answer.length === 600)).toBe(true)
})

it('clears on logout, repeated login and switching accounts', async () => {
  apiMock.mockImplementation(async (_path: string, request: RequestInit) => ({
    accessToken: 'demo', user: { username: JSON.parse(String(request.body)).username, displayName: 'Test', roles: ['EMPLOYEE'] },
  }))
  render(<AuthProvider><Workspace /></AuthProvider>)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Đăng nhập nhân viên' }))
  await user.click(screen.getByRole('button', { name: 'Thêm lượt' }))
  await user.click(screen.getByRole('button', { name: 'Đăng xuất' }))
  expect(screen.getByLabelText('Lịch sử')).toHaveTextContent('[]')
  await user.click(screen.getByRole('button', { name: 'Đăng nhập nhân viên' }))
  expect(screen.getByLabelText('Lịch sử')).toHaveTextContent('[]')
  await user.click(screen.getByRole('button', { name: 'Thêm lượt' }))
  await user.click(screen.getByRole('button', { name: 'Đăng nhập nhân viên' }))
  expect(screen.getByLabelText('Lịch sử')).toHaveTextContent('[]')
  await user.click(screen.getByRole('button', { name: 'Thêm lượt' }))
  await user.click(screen.getByRole('button', { name: 'Đăng nhập admin' }))
  expect(screen.getByLabelText('Lịch sử')).toHaveTextContent('[]')
})
