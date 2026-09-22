import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ProfilePage } from './ProfilePage'

const { apiMock } = vi.hoisted(() => ({ apiMock: vi.fn() }))

vi.mock('../api/client', () => ({ api: apiMock }))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: { username: 'employee01', displayName: 'Nguyễn Minh Anh', roles: ['EMPLOYEE'] }, logout: vi.fn() }),
}))

describe('ProfilePage', () => {
  it('loads a profile and updates only phone and email', async () => {
    const profile = { id: 3, fullName: 'Nguyễn Minh Anh', employeeCode: 'BA-EMP-001', gender: 'FEMALE', phone: '0901000003', email: 'employee01@binhan.local', address: 'Hà Nội', educationLevel: 'Đại học', joinDate: '2025-01-01', status: 'ACTIVE', departmentName: 'Đào tạo', positionTitle: 'Giáo viên' }
    apiMock.mockImplementation((path: string, options?: RequestInit) => {
      if (path === '/employees/me' && options?.method === 'PATCH') return Promise.resolve(profile)
      if (path === '/employees/me') return Promise.resolve(profile)
      return Promise.resolve({})
    })

    render(<ProfilePage />)

    expect(await screen.findByDisplayValue('employee01@binhan.local')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Số điện thoại'), { target: { value: '0987654321' } })
    fireEvent.click(screen.getByRole('button', { name: 'Lưu thay đổi' }))

    await waitFor(() => expect(apiMock).toHaveBeenCalledWith('/employees/me', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ phone: '0987654321', email: 'employee01@binhan.local' }) })))
  })
})
