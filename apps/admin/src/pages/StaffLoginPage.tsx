import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'

const STAFF_TOKEN_KEY = 'bachmain_staff_token'
const STAFF_ROLE_KEY = 'bachmain_staff_role'

const APP_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) ||
  'https://uygulama.bachmain.com'

export function getStaffToken() {
  try {
    return localStorage.getItem(STAFF_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function getStaffRole() {
  try {
    return localStorage.getItem(STAFF_ROLE_KEY) || ''
  } catch {
    return ''
  }
}

export function setStaffToken(token: string, role?: string) {
  try {
    if (token) {
      localStorage.setItem(STAFF_TOKEN_KEY, token)
      if (role) localStorage.setItem(STAFF_ROLE_KEY, role)
    } else {
      localStorage.removeItem(STAFF_TOKEN_KEY)
      localStorage.removeItem(STAFF_ROLE_KEY)
    }
  } catch {
    /* ignore */
  }
}

function redirectToBusinessApp(token: string) {
  const url = new URL('/', APP_URL)
  url.searchParams.set('authToken', token)
  window.location.replace(url.toString())
}

type PortalTarget = 'business' | 'studio'

export function StaffLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState<PortalTarget | null>(null)
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  async function loginTo(target: PortalTarget) {
    if (!email.trim() || !password) {
      setError('E-posta ve şifre gerekli.')
      return
    }
    setLoading(target)
    setError('')
    try {
      if (target === 'studio') {
        const res = await api.post<{
          ok: boolean
          token: string
          user: { fullName: string; role?: string }
        }>('/staff/login', {
          email: email.trim().toLowerCase(),
          password,
        })
        setStaffToken(res.token, res.user?.role || 'super_admin')
        window.location.href = from
        return
      }

      const res = await api.post<{
        ok: boolean
        token: string
      }>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      })
      if (!res.token) {
        throw new Error('Oturum anahtarı alınamadı.')
      }
      redirectToBusinessApp(res.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
      setLoading(null)
    }
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col lg:flex-row">
      {/* Sol — Business */}
      <section className="flex min-h-[42vh] flex-1 flex-col items-center justify-center bg-white px-6 py-16 lg:min-h-screen lg:px-10">
        <img
          src="/assets/bachmain-logo.png"
          alt="BACHMAIN"
          className="h-14 w-auto object-contain sm:h-16"
          draggable={false}
        />
        <p className="mt-4 text-[16px] font-semibold tracking-[0.22em] text-[#0f172a] uppercase">
          Business
        </p>
      </section>

      {/* Sağ — Bachmain Studio */}
      <section className="flex min-h-[42vh] flex-1 flex-col items-center justify-center bg-gradient-to-br from-[#1d4ed8] via-[#2563eb] to-[#1e40af] px-6 py-16 lg:min-h-screen lg:px-10">
        <img
          src="/assets/bachmain-logo-on-dark.png"
          alt="BACHMAIN"
          className="h-14 w-auto object-contain sm:h-16"
          draggable={false}
        />
        <p className="mt-4 text-[16px] font-semibold tracking-[0.22em] text-white uppercase">
          Bachmain Studio
        </p>
      </section>

      {/* Ortak giriş kartı */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-4 py-8">
        <form
          className="pointer-events-auto w-full max-w-[420px] space-y-4 rounded-2xl border border-[#e2e8f0] bg-white/95 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.18)] backdrop-blur-md sm:p-8"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div className="text-center">
            <h1 className="text-xl font-bold tracking-tight text-[#0f172a]">Giriş Yap</h1>
            <p className="mt-1 text-sm text-[#64748b]">
              Aynı hesapla Business veya Studio’ya geçebilirsiniz.
            </p>
          </div>

          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[#0f172a]">E-posta</span>
            <input
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-[#0f172a] outline-none ring-[#2563eb]/30 focus:ring-2"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-[#0f172a]">Şifre</span>
            <input
              className="w-full rounded-xl border border-[#e2e8f0] bg-white px-3 py-2.5 text-[#0f172a] outline-none ring-[#2563eb]/30 focus:ring-2"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => loginTo('business')}
              className="rounded-xl border border-[#0f172a] bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:opacity-60"
            >
              {loading === 'business' ? 'Giriş…' : 'Business'}
            </button>
            <button
              type="button"
              disabled={loading !== null}
              onClick={() => loginTo('studio')}
              className="rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60"
            >
              {loading === 'studio' ? 'Giriş…' : 'Bachmain Studio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function RequireStaff({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<'loading' | 'ok' | 'no'>('loading')
  const location = useLocation()

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const health = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/health`).then((r) =>
          r.json(),
        )
        if (!health.staffAuth) {
          if (!cancelled) setState('ok')
          return
        }
      } catch {
        /* continue to token check */
      }
      const token = getStaffToken()
      if (!token) {
        if (!cancelled) setState('no')
        return
      }
      try {
        const me = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/staff/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).then(async (r) => {
          if (!r.ok) throw new Error('unauthorized')
          return r.json() as Promise<{ user?: { role?: string }; role?: string }>
        })
        const role = me.user?.role || me.role
        if (role) setStaffToken(token, role)
        if (!cancelled) setState('ok')
      } catch {
        setStaffToken('')
        if (!cancelled) setState('no')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Oturum kontrol ediliyor…
      </div>
    )
  }
  if (state === 'no') {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }
  return children
}
