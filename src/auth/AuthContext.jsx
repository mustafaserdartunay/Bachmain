import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearSession,
  fetchCurrentUser,
  getStoredSession,
  loginAccount,
  logoutAccount,
  registerAccount,
} from '../utils/platformAuth'
import { saveUserProfile } from '../utils/userProfile'

const AuthContext = createContext(null)

function syncLocalProfile(user) {
  if (!user) return
  saveUserProfile({
    displayName: user.fullName || 'Kullanıcı',
    companyName: user.companyName || 'Firma',
    email: user.email || '',
    phone: user.phone || '',
    title: 'Hesap Sahibi',
    avatarDataUrl: '',
    tenantCode: user.tenantCode || '',
    createdAt: new Date().toISOString(),
    customerId: user.customerId,
    plan: user.plan,
    status: user.status,
    licenseExpiry: user.licenseExpiry || '',
  })
}

export function AuthProvider({ children }) {
  const stored = getStoredSession()
  const [user, setUser] = useState(stored.user)
  const [loading, setLoading] = useState(Boolean(stored.token))
  const [bootstrapped, setBootstrapped] = useState(!stored.token)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const { token, user: cached } = getStoredSession()
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
          setBootstrapped(true)
        }
        return
      }
      try {
        const next = await fetchCurrentUser()
        if (!cancelled) {
          setUser(next)
          syncLocalProfile(next)
        }
      } catch {
        if (cached && !cancelled) {
          setUser(cached)
          syncLocalProfile(cached)
        } else if (!cancelled) {
          clearSession()
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
          setBootstrapped(true)
        }
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const onChange = (event) => setUser(event.detail?.user || null)
    window.addEventListener('bachmain:auth-changed', onChange)
    return () => window.removeEventListener('bachmain:auth-changed', onChange)
  }, [])

  const value = {
    user,
    loading,
    bootstrapped,
    isAuthenticated: Boolean(user),
    async login(form) {
      const data = await loginAccount(form)
      setUser(data.user)
      syncLocalProfile(data.user)
      return data.user
    },
    async register(form) {
      const data = await registerAccount(form)
      setUser(data.user)
      syncLocalProfile(data.user)
      return data.user
    },
    async logout() {
      await logoutAccount()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
