import { createContext, useContext, useEffect, useState } from 'react'
import {
  clearSession,
  fetchCurrentUser,
  getStoredSession,
  loginAccount,
  logoutAccount,
  persistSession,
  registerAccount,
  completeOnboarding as completeOnboardingRequest,
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

const LOCAL_DEV_TOKEN = 'bachmain-local-dev'
const LOCAL_DEV_USER = {
  id: 'local-dev',
  email: 'dev@bachmain.local',
  fullName: 'Yerel Geliştirici',
  companyName: 'BachMain',
  phone: '',
  tenantCode: 'LOCAL',
  customerId: 'local-dev',
  plan: 'pro',
  status: 'active',
  subscriptionStatus: 'active',
  licenseExpiry: '2099-12-31',
  onboardingCompleted: true,
  trialEnded: false,
  legal: { mustAccept: false, outstanding: [] },
}

function isLocalDevHost() {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

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
  const localBoot = typeof window !== 'undefined' && isLocalDevHost()
  const initialUser = localBoot ? LOCAL_DEV_USER : stored.user
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(localBoot ? false : Boolean(stored.token))
  const [bootstrapped, setBootstrapped] = useState(localBoot ? true : !stored.token)

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

      let { token, user: cached } = getStoredSession()

      // Localhost: never block on login — open the CRM UI with a local session.
      if (isLocalDevHost()) {
        persistSession({ token: LOCAL_DEV_TOKEN, user: LOCAL_DEV_USER })
        if (!cancelled) {
          setUser(LOCAL_DEV_USER)
          await activateWorkspace(LOCAL_DEV_USER)
          setLoading(false)
          setBootstrapped(true)
        }
        return
      }

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
        if (token === LOCAL_DEV_TOKEN) {
          if (!cancelled) {
            setUser(cached || LOCAL_DEV_USER)
            await activateWorkspace(cached || LOCAL_DEV_USER)
          }
        } else {
          const next = await fetchCurrentUser()
          if (!cancelled) {
            setUser(next)
            await activateWorkspace(next)
          }
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

  useEffect(() => {
    if (!user) return undefined
    const { token } = getStoredSession()
    if (token === LOCAL_DEV_TOKEN) return undefined
    const tick = async () => {
      try {
        const next = await fetchCurrentUser()
        setUser(next)
      } catch {
        /* ignore poll errors */
      }
    }
    const onLicense = () => {
      tick()
    }
    window.addEventListener('bachmain:license-updated', onLicense)
    const id = window.setInterval(tick, 60_000)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('bachmain:license-updated', onLicense)
    }
  }, [user?.id])

  const value = {
    user,
    loading,
    bootstrapped,
    isAuthenticated: Boolean(user),
    async refreshUser() {
      const next = await fetchCurrentUser()
      setUser(next)
      await activateWorkspace(next)
      return next
    },
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
    async completeOnboarding() {
      const next = await completeOnboardingRequest()
      setUser(next)
      await activateWorkspace(next)
      return next
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
