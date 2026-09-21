import { createContext, useContext, useState, type ReactNode } from 'react'
import { api, setAccessToken } from '../api/client'
import type { User } from '../api/types'

type AuthContextValue = { user: User | null; loading: boolean; login: (username: string, password: string) => Promise<void>; logout: () => void }
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  async function login(username: string, password: string) {
    setLoading(true)
    try {
      const result = await api<{ accessToken: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) })
      setAccessToken(result.accessToken); setUser(result.user)
    } finally { setLoading(false) }
  }
  function logout() { setAccessToken(null); setUser(null) }
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('AuthProvider is missing'); return value }
