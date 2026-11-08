import { expect, it } from 'vitest'
import { formatFactValue } from './labels'

it('formats assistant facts for Vietnamese readers', () => {
  expect(formatFactValue('14000000.00')).toBe('14.000.000')
  expect(formatFactValue('151442.31')).toBe('151.442,31')
  expect(formatFactValue('3.00')).toBe('3')
  expect(formatFactValue('DRAFT')).toBe('Bản nháp')
  expect(formatFactValue('PENDING')).toBe('Chờ duyệt')
  expect(formatFactValue('Giáo viên tiếng Anh')).toBe('Giáo viên tiếng Anh')
  expect(formatFactValue('2026-11-01')).toBe('2026-11-01')
})
