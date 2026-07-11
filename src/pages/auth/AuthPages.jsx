import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import BrandLogo from '../../components/Layout/BrandLogo'
import { useAuth } from '../../auth/AuthContext'

function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f4f6fa_45%,_#eef1f6_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <BrandLogo />
          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[#0b1f3a]">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_60px_-30px_rgba(11,31,58,0.45)] backdrop-blur">
          {children}
        </div>
        {footer ? <div className="mt-5 text-center text-sm text-slate-600">{footer}</div> : null}
      </div>
    </div>
  )
}

const fieldClass =
  'mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-[#2f6fed]/20 placeholder:text-slate-400 focus:border-[#2f6fed] focus:ring-4'

export function LoginPage() {
  const { login, isAuthenticated, bootstrapped } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (bootstrapped && isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login({ email, password })
      navigate(location.state?.from || '/', { replace: true })
    } catch (err) {
      setError(err.message || 'Giriş başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Uygulamaya giriş"
      subtitle="BACHMAIN hesabınızla devam edin"
      footer={(
        <>
          Hesabınız yok mu?{' '}
          <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/kayit">
            Üye olun
          </Link>
        </>
      )}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          E-posta
          <input className={fieldClass} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Şifre
          <input className={fieldClass} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143056] disabled:opacity-60"
        >
          {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
      </form>
    </AuthShell>
  )
}

export function RegisterPage() {
  const { register, isAuthenticated, bootstrapped } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const planFromUrl = new URLSearchParams(location.search).get('plan') || 'Starter'
  const [form, setForm] = useState({
    fullName: '',
    companyName: '',
    email: '',
    phone: '',
    password: '',
    plan: planFromUrl,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (bootstrapped && isAuthenticated) {
    return <Navigate to="/" replace />
  }

  function update(key) {
    return (event) => setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await register({ ...form, plan: form.plan || planFromUrl })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Kayıt başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="14 gün ücretsiz üye olun"
      subtitle={`Seçilen plan: ${form.plan || 'Starter'} · Kayıt sonrası yönetim panelinde görünür`}
      footer={(
        <>
          Zaten üye misiniz?{' '}
          <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/giris">
            Giriş yapın
          </Link>
        </>
      )}
    >
      <form className="space-y-3.5" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Ad Soyad
          <input className={fieldClass} required value={form.fullName} onChange={update('fullName')} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Firma adı
          <input className={fieldClass} required value={form.companyName} onChange={update('companyName')} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          E-posta
          <input className={fieldClass} type="email" autoComplete="email" required value={form.email} onChange={update('email')} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Telefon
          <input className={fieldClass} type="tel" value={form.phone} onChange={update('phone')} placeholder="05xx xxx xx xx" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Şifre
          <input className={fieldClass} type="password" autoComplete="new-password" minLength={6} required value={form.password} onChange={update('password')} />
        </label>
        {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-[#2f6fed] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2563eb] disabled:opacity-60"
        >
          {busy ? 'Hesap oluşturuluyor…' : 'Üye Ol'}
        </button>
      </form>
    </AuthShell>
  )
}
