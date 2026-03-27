import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import axios from 'axios'
import apiClient, { setAccessToken } from '../api/client'
import type { User } from '../types/user'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, username: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const hasAttemptedRestore = useRef(false)

  useEffect(() => {
    if (hasAttemptedRestore.current) return
    hasAttemptedRestore.current = true

    const restoreSession = async () => {
      try {
        // Use raw axios (not apiClient) to avoid the 401 interceptor loop
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        setAccessToken(data.access_token)
        const { data: userData } = await apiClient.get('/users/me')
        setUser(userData)
      } catch {
        // No valid session — that's fine, user is not logged in
        setUser(null)
        setAccessToken(null)
      } finally {
        setIsLoading(false)
      }
    }
    restoreSession()
  }, [])

  const login = async (email: string, password: string) => {
    const { data } = await apiClient.post('/auth/login', { email, password })
    setAccessToken(data.access_token)
    setUser(data.user)
  }

  const register = async (email: string, password: string, username: string) => {
    const { data } = await apiClient.post('/auth/register', { email, password, username })
    setAccessToken(data.access_token)
    setUser(data.user)
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
