import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearSession,
  fetchCurrentUser,
  getStoredSession,
  loginAccount,
  logoutAccount,
  persistSession,
  registerAccount,
} from '../utils/platformAuth'
import { saveUserProfile } from '../utils/userProfile'
import { updateCompanySettings, readCompanySettings } from '../utils/companySettings'
import {
  bindUserWorkspace,
  clearWorkspaceStorage,
  flushWorkspaceNow,
  WORKSPACE_OWNER_KEY,
} from '../utils/workspaceStorage'

const AuthContext = createContext(null)

function syncLocalProfile(user) {
  if (!user) return
  saveUserProfile({
    displayName: user.fullName || 'Kullanıcı',
    companyName: user.companyName || '',
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

  // Fill company card from membership only when still empty (never inject demo firm).
  const company = readCompanySettings()
  if (!company.companyName && user.companyName) {
    updateCompanySettings({
      companyName: user.companyName,
      email: user.email || company.email,
      phone: user.phone || company.phone,
    })
  }
}

async function activateWorkspace(user) {
  if (!user) return
  await bindUserWorkspace(user)
  syncLocalProfile(user)
}

export function AuthProvider({ children }) {
  const stored = getStoredSession()
  const [user, setUser] = useState(stored.user)
  const [loading, setLoading] = useState(Boolean(stored.token))
  const [bootstrapped, setBootstrapped] = useState(!stored.token)

  useEffect(() => {
    let cancelled = false
    async function boot() {
      const params = new URLSearchParams(window.location.search)
      const handoffToken = params.get('authToken')
      if (handoffToken) {
        persistSession({ token: handoffToken, user: getStoredSession().user })
        params.delete('authToken')
        const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash || ''}`
        window.history.replaceState({}, '', nextUrl || '/')
      }

      const { token, user: cached } = getStoredSession()
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
          setBootstrapped(true)
        }
        return
      }
      if (!cancelled) setLoading(true)
      try {
        const next = await fetchCurrentUser()
        if (!cancelled) {
          setUser(next)
          await activateWorkspace(next)
        }
      } catch {
        if (cached && !cancelled) {
          setUser(cached)
          await activateWorkspace(cached)
        } else if (!cancelled) {
          clearSession()
          clearWorkspaceStorage()
          localStorage.removeItem(WORKSPACE_OWNER_KEY)
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
      await activateWorkspace(data.user)
      return data.user
    },
    async register(form) {
      const data = await registerAccount(form)
      setUser(data.user)
      await activateWorkspace(data.user)
      return data.user
    },
    async logout() {
      try {
        await flushWorkspaceNow()
      } catch {
        // still logout locally
      }
      await logoutAccount()
      clearWorkspaceStorage()
      localStorage.removeItem(WORKSPACE_OWNER_KEY)
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
