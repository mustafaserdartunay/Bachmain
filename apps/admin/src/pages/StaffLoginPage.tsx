import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api } from '@/lib/api'

const STAFF_TOKEN_KEY = 'bachmain_staff_token'

export function getStaffToken() {
  try {
    return localStorage.getItem(STAFF_TOKEN_KEY) || ''
  } catch {
    return ''
  }
}

export function setStaffToken(token: string) {
  try {
    if (token) localStorage.setItem(STAFF_TOKEN_KEY, token)
    else localStorage.removeItem(STAFF_TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export function StaffLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const location = useLocation()
  const from = (location.state as { from?: string })?.from || '/'

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api.post<{ ok: boolean; token: string; user: { fullName: string } }>('/staff/login', {
        email,
        password,
      })
      setStaffToken(res.token)
      window.location.href = from
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Giriş başarısız')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f7f8fb_55%,_#eef1f6_100%)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-border bg-surface-elevated p-8 shadow-sm"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">BACHMAIN</p>
          <h1 className="mt-2 text-2xl font-bold text-ink">Yönetim Girişi</h1>
          <p className="mt-1 text-sm text-muted">Control Center personel oturumu</p>
        </div>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-ink">E-posta</span>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none ring-brand/30 focus:ring-2"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1.5 text-sm">
          <span className="font-medium text-ink">Şifre</span>
          <input
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 outline-none ring-brand/30 focus:ring-2"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
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
        const health = await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/health`).then((r) => r.json())
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
        await fetch(`${import.meta.env.VITE_API_URL ?? '/api'}/staff/me`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: 'include',
        }).then(async (r) => {
          if (!r.ok) throw new Error('unauthorized')
          return r.json()
        })
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
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Oturum kontrol ediliyor…</div>
  }
  if (state === 'no') {
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }
  return children
}
