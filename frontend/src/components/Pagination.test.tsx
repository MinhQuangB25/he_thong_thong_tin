import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'
afterEach(cleanup)
it('navigates pages and prevents stepping past the first and last page', () => {
  const change = vi.fn()
  const { rerender } = render(<Pagination page={0} totalPages={2} onChange={change} />)
  expect(screen.getByRole('button', { name: 'Trang trước' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Trang sau' }))
  expect(change).toHaveBeenCalledWith(1)
  rerender(<Pagination page={1} totalPages={2} onChange={change} />)
  expect(screen.getByRole('button', { name: 'Trang sau' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Trang trước' }))
  expect(change).toHaveBeenLastCalledWith(0)
})
