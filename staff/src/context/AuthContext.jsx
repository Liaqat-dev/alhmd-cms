import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import axios from 'axios'
import { setAccessToken, clearAccessToken } from '../services/tokenStore'

const AuthContext = createContext(null)

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const refreshTimerRef = useRef(null)

  // Schedule a proactive token refresh 60 s before expiry
  const scheduleRefresh = useCallback((expiresInSeconds) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    const delay = Math.max((expiresInSeconds - 60) * 1000, 5000)
    refreshTimerRef.current = setTimeout(() => silentRefresh(), delay)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Try to get a fresh access token using the httpOnly cookie
  const silentRefresh = useCallback(async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      const { accessToken, user: userData, expiresIn } = response.data
      setAccessToken(accessToken)
      setUser(userData)
      scheduleRefresh(expiresIn)
      return true
    } catch {
      clearAccessToken()
      setUser(null)
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      return false
    }
  }, [scheduleRefresh])

  // On mount: restore session via refresh-token cookie (no localStorage needed)
  useEffect(() => {
    silentRefresh().finally(() => setLoading(false))
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (credentials) => {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials, {
      withCredentials: true,
    })
    const { accessToken, user: userData, expiresIn } = response.data
    setAccessToken(accessToken)
    setUser(userData)
    scheduleRefresh(expiresIn)
    return userData
  }

  const logout = async () => {
    try {
      await axios.post(`${BASE_URL}/auth/logout`, {}, { withCredentials: true })
    } catch {
      // Best-effort revocation — always clear local state
    }
    clearAccessToken()
    setUser(null)
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }

  const logoutAll = async () => {
    try {
      const { default: api } = await import('../services/api')
      await api.post('/auth/logout-all')
    } catch {
      // Best-effort
    }
    clearAccessToken()
    setUser(null)
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
  }

  // Patch user state locally after a profile update (e.g. profile pic change)
  const updateUser = (patch) => setUser(prev => prev ? { ...prev, ...patch } : prev)

  const value = {
    user,
    login,
    logout,
    logoutAll,
    updateUser,
    loading,
    isAdmin: user?.role === 'ADMIN',
    isTeacher: user?.role === 'TEACHER',
    isStudent: user?.role === 'STUDENT',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
