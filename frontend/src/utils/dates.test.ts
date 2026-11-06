import { expect, it } from 'vitest'
import { formatDate, inclusiveDays, localDate, monthBounds } from './dates'

it('keeps local calendar dates and the complete month at UTC+7', () => {
  expect(localDate(new Date(2026, 8, 1, 0, 5))).toBe('2026-09-01')
  expect(monthBounds(new Date(2026, 8, 22))).toEqual({ from: '2026-09-01', to: '2026-09-30' })
  expect(monthBounds(new Date(2024, 1, 20))).toEqual({ from: '2024-02-01', to: '2024-02-29' })
})

it('formats ISO dates as Vietnamese DD/MM/YYYY', () => {
  expect(formatDate('2026-11-03')).toBe('03/11/2026')
  expect(formatDate('2026-11-03T08:00:00')).toBe('03/11/2026')
  expect(formatDate(null)).toBe('—')
  expect(formatDate('không rõ')).toBe('không rõ')
})

it('counts inclusive leave days and rejects reversed ranges', () => {
  expect(inclusiveDays('2026-11-03', '2026-11-03')).toBe(1)
  expect(inclusiveDays('2026-02-27', '2026-03-02')).toBe(4)
  expect(inclusiveDays('2026-11-05', '2026-11-03')).toBe(0)
  expect(inclusiveDays('', '2026-11-03')).toBe(0)
})
