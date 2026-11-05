import { afterEach, expect, it, vi } from 'vitest'
import { api } from './client'

afterEach(() => { vi.unstubAllGlobals() })

it('includes field validation messages in the thrown error', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
    status: 400, code: 'VALIDATION_ERROR', message: 'Dữ liệu gửi lên không hợp lệ',
    details: { dateRangeValid: 'Ngày kết thúc phải bằng hoặc sau ngày bắt đầu' },
  }), { status: 400 })))

  await expect(api('/contracts', { method: 'POST' })).rejects.toThrow('Dữ liệu gửi lên không hợp lệ: Ngày kết thúc phải bằng hoặc sau ngày bắt đầu')
})

it('keeps the plain message when there are no details', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ status: 409, code: 'CONFLICT', message: 'Số hợp đồng đã tồn tại', details: null }), { status: 409 })))

  await expect(api('/contracts', { method: 'POST' })).rejects.toThrow(/^Số hợp đồng đã tồn tại$/)
})
