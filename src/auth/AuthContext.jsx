import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  clearSession,
  fetchCurrentUser,
  getStoredSession,
  loginAccount,
  logoutAccount,
  persistSession,
  registerAccount,
  completeOnboarding as completeOnboardingRequest,
  fetchAccessibleCompanies,
  switchActiveCompany,
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

  // Fill company card from membership only when still empty (user's own firm data).
  const company = readCompanySettings()
  if (!company.companyName && user.companyName) {
    updateCompanySettings({
      companyName: user.companyName,
      legalTitle: user.companyName,
      email: user.email || company.email,
      phone: user.phone || company.phone,
      taxOffice: user.taxOffice || company.taxOffice,
      taxNumber: user.taxNo || company.taxNumber,
      address:
        [user.address, user.district, user.city].filter(Boolean).join(', ') || company.address,
    })
  }
}

async function activateWorkspace(user) {
  if (!user) return
  await bindUserWorkspace(user)
  syncLocalProfile(user)
}

function readHandoffToken() {
  if (typeof window === 'undefined') return ''
  try {
    return new URLSearchParams(window.location.search).get('authToken') || ''
  } catch {
    return ''
  }
}

/** Capture marketing→app SSO token before the first paint so RequireAuth never races. */
function captureHandoffToken() {
  const handoffToken = readHandoffToken()
  if (!handoffToken) return false
  // Drop any stale profile from a previous account; /auth/me will refill it.
  try {
    localStorage.removeItem('bachmain_auth_user')
  } catch {
    /* ignore */
  }
  persistSession({ token: handoffToken })
  try {
    const params = new URLSearchParams(window.location.search)
    params.delete('authToken')
    const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ''}${window.location.hash || ''}`
    window.history.replaceState({}, '', nextUrl || '/')
  } catch {
    /* ignore URL cleanup failures */
  }
  return true
}

const HAND_OFF_ON_LOAD = typeof window !== 'undefined' ? captureHandoffToken() : false

function sameUser(a, b) {
  if (a === b) return true
  if (!a || !b) return false
  try {
    return JSON.stringify(a) === JSON.stringify(b)
  } catch {
    return false
  }
}

export function AuthProvider({ children }) {
  const stored = getStoredSession()
  const localBoot = typeof window !== 'undefined' && isLocalDevHost()
  const initialUser = localBoot ? LOCAL_DEV_USER : stored.user
  const pendingSession = Boolean(stored.token) || HAND_OFF_ON_LOAD
  const [user, setUser] = useState(initialUser)
  const [loading, setLoading] = useState(localBoot ? false : pendingSession)
  const [bootstrapped, setBootstrapped] = useState(localBoot ? true : !pendingSession)

  const applyUser = useCallback((next) => {
    setUser((current) => (sameUser(current, next) ? current : next))
  }, [])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      // Re-check in case the token arrived after module init (rare deep-link timing).
      const lateHandoff = captureHandoffToken()

      let { token, user: cached } = getStoredSession()
      const arrivedViaHandoff = HAND_OFF_ON_LOAD || lateHandoff || Boolean(token && !cached)

      // Localhost: never block on login — open the CRM UI with a local session.
      if (isLocalDevHost()) {
        persistSession({ token: LOCAL_DEV_TOKEN, user: LOCAL_DEV_USER })
        if (!cancelled) {
          applyUser(LOCAL_DEV_USER)
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
            applyUser(cached || LOCAL_DEV_USER)
            await activateWorkspace(cached || LOCAL_DEV_USER)
          }
        } else {
          const next = await fetchCurrentUser()
          if (!cancelled) {
            applyUser(next)
            try {
              await activateWorkspace(next)
            } catch (workspaceError) {
              // Workspace sync must not undo a valid login.
              console.warn('[auth] workspace activate failed', workspaceError)
            }
          }
        }
      } catch (error) {
        if (cached && !cancelled) {
          applyUser(cached)
          try {
            await activateWorkspace(cached)
          } catch {
            /* ignore */
          }
        } else if (arrivedViaHandoff && !cancelled) {
          // Fresh SSO handoff: keep the token and retry once before giving up.
          try {
            await new Promise((resolve) => window.setTimeout(resolve, 400))
            const retry = await fetchCurrentUser()
            if (!cancelled && retry) {
              applyUser(retry)
              try {
                await activateWorkspace(retry)
              } catch {
                /* ignore */
              }
              return
            }
          } catch {
            /* fall through to clear */
          }
          console.warn('[auth] handoff session validation failed', error?.message || error)
          clearSession()
          clearWorkspaceStorage()
          localStorage.removeItem(WORKSPACE_OWNER_KEY)
          setUser(null)
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
  }, [applyUser])

  useEffect(() => {
    const onChange = (event) => applyUser(event.detail?.user || null)
    window.addEventListener('bachmain:auth-changed', onChange)
    return () => window.removeEventListener('bachmain:auth-changed', onChange)
  }, [applyUser])

  useEffect(() => {
    if (!user) return undefined
    const { token } = getStoredSession()
    if (token === LOCAL_DEV_TOKEN) return undefined
    const tick = async () => {
      try {
        const next = await fetchCurrentUser()
        applyUser(next)
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
  }, [user?.id, applyUser])

  const refreshUser = useCallback(async () => {
    const next = await fetchCurrentUser()
    applyUser(next)
    await activateWorkspace(next)
    return next
  }, [applyUser])

  const listAccessibleCompanies = useCallback(() => fetchAccessibleCompanies(), [])

  const switchCompany = useCallback(
    async (tenantCode) => {
      await flushWorkspaceNow()
      const data = await switchActiveCompany(tenantCode)
      applyUser(data.user)
      await activateWorkspace(data.user)
      return data.user
    },
    [applyUser],
  )

  const login = useCallback(
    async (form) => {
      const data = await loginAccount(form)
      applyUser(data.user)
      await activateWorkspace(data.user)
      return data.user
    },
    [applyUser],
  )

  const register = useCallback(
    async (form) => {
      const data = await registerAccount(form)
      applyUser(data.user)
      await activateWorkspace(data.user)
      return data.user
    },
    [applyUser],
  )

  const logout = useCallback(async () => {
    try {
      await flushWorkspaceNow()
    } catch {
      // still logout locally
    }
    await logoutAccount()
    clearWorkspaceStorage()
    localStorage.removeItem(WORKSPACE_OWNER_KEY)
    setUser(null)
  }, [])

  const completeOnboarding = useCallback(async () => {
    const next = await completeOnboardingRequest()
    applyUser(next)
    await activateWorkspace(next)
    return next
  }, [applyUser])

  const value = useMemo(
    () => ({
      user,
      loading,
      bootstrapped,
      isAuthenticated: Boolean(user),
      refreshUser,
      listAccessibleCompanies,
      switchCompany,
      login,
      register,
      logout,
      completeOnboarding,
    }),
    [
      user,
      loading,
      bootstrapped,
      refreshUser,
      listAccessibleCompanies,
      switchCompany,
      login,
      register,
      logout,
      completeOnboarding,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
