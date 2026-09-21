const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api/v1'
let accessToken: string | null = null

export function setAccessToken(token: string | null) { accessToken = token }
export function getAccessToken() { return accessToken }

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)
  const response = await fetch(`${API_URL}${path}`, { ...options, headers })
  if (!response.ok) {
    let message = `Yêu cầu thất bại (${response.status})`
    try { const body = await response.json(); message = body.message ?? message } catch { /* empty response */ }
    throw new Error(message)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
