import { Link, Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import BrandLogo from '../../components/Layout/BrandLogo'
import { useAuth } from '../../auth/AuthContext'
import {
  requestPasswordReset,
  resetPasswordWithToken,
  verifyEmailWithToken,
} from '../../utils/platformAuth'
import { acceptTeamInvite, loadInvitePreview } from '../../utils/teamUsersApi'
import { MODULE_LEVELS } from '../../data/appModules'
import {
  isLocalDevHost,
  MARKETING_LOGIN_URL,
  redirectToMarketingLogin,
} from '../../utils/marketingLogin'

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
  const localDev = isLocalDevHost()

  useEffect(() => {
    if (localDev) return
    if (bootstrapped && isAuthenticated) return
    redirectToMarketingLogin(location.state?.from)
  }, [localDev, bootstrapped, isAuthenticated, location.state?.from])

  if (bootstrapped && isAuthenticated) {
    return <Navigate to={location.state?.from || '/'} replace />
  }

  if (!localDev) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center text-sm text-slate-600">
        <p>Giriş sayfasına yönlendiriliyorsunuz…</p>
        <a className="font-semibold text-[#1d4ed8] hover:underline" href={MARKETING_LOGIN_URL}>
          Giriş Yap
        </a>
      </div>
    )
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
      title="Uygulamaya giriş (yerel)"
      subtitle="Production’da giriş bachmain.com/giris üzerinden yapılır"
      footer={
        <>
          Hesabınız yok mu?{' '}
          <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/kayit">
            Üye olun
          </Link>
        </>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          E-posta
          <input
            className={fieldClass}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Şifre
          <input
            className={fieldClass}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="text-right">
          <Link
            className="text-sm font-semibold text-[#1d4ed8] hover:underline"
            to="/sifremi-unuttum"
          >
            Şifremi unuttum
          </Link>
        </div>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
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
      title="7 gün ücretsiz üye olun"
      subtitle={`Seçilen plan: ${form.plan || 'Starter'} · Kayıt sonrası yönetim panelinde görünür`}
      footer={
        <>
          Zaten üye misiniz?{' '}
          <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/giris">
            Giriş yapın
          </Link>
        </>
      }
    >
      <form className="space-y-3.5" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Ad Soyad
          <input
            className={fieldClass}
            required
            value={form.fullName}
            onChange={update('fullName')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Firma adı
          <input
            className={fieldClass}
            required
            value={form.companyName}
            onChange={update('companyName')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          E-posta
          <input
            className={fieldClass}
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Telefon
          <input
            className={fieldClass}
            type="tel"
            value={form.phone}
            onChange={update('phone')}
            placeholder="05xx xxx xx xx"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Şifre
          <input
            className={fieldClass}
            type="password"
            autoComplete="new-password"
            minLength={6}
            required
            value={form.password}
            onChange={update('password')}
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await requestPasswordReset(email)
      setDone(true)
    } catch (err) {
      setError(err.message || 'İstek başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Şifremi unuttum"
      subtitle="E-posta adresinize sıfırlama bağlantısı göndeririz"
      footer={
        <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/giris">
          Girişe dön
        </Link>
      }
    >
      {done ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          Eşleşen bir hesap varsa sıfırlama bağlantısı e-posta kutunuza gönderildi.
        </p>
      ) : (
        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            E-posta
            <input
              className={fieldClass}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Gönderiliyor…' : 'Bağlantı gönder'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}

export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await resetPasswordWithToken({ token, password })
      navigate('/giris', { replace: true })
    } catch (err) {
      setError(err.message || 'Şifre güncellenemedi')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Yeni şifre belirle" subtitle="Güvenli bir şifre seçin (en az 6 karakter)">
      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Yeni şifre
          <input
            className={fieldClass}
            type="password"
            minLength={6}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy || !token}
          className="w-full rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {busy ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </button>
      </form>
    </AuthShell>
  )
}

export function AcceptInvitePage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''
  const [preview, setPreview] = useState(null)
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        setError('Davet bağlantısı eksik')
        setLoading(false)
        return
      }
      try {
        const data = await loadInvitePreview(token)
        if (!cancelled) {
          setPreview(data)
          setFullName(data.fullName || '')
        }
      } catch (err) {
        if (!cancelled) setError(err.message || 'Davet yüklenemedi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  async function onSubmit(event) {
    event.preventDefault()
    if (preview?.requiresPassword !== false) {
      if (password !== password2) {
        setError('Şifreler eşleşmiyor')
        return
      }
    }
    setBusy(true)
    setError('')
    try {
      await acceptTeamInvite({ token, password, fullName })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Davet onaylanamadı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title="Firma daveti"
      subtitle={
        preview
          ? `${preview.companyName || 'Firma'} sizi uygulamaya davet etti`
          : 'Davet bilgileri yükleniyor'
      }
      footer={
        <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/giris">
          Zaten hesabım var, giriş yap
        </Link>
      }
    >
      {loading ? <p className="text-sm text-slate-600">Davet kontrol ediliyor…</p> : null}
      {error && !preview ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}
      {preview ? (
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <p>
              <strong>{preview.email}</strong> adresiyle katılacaksınız.
            </p>
            {preview.jobTitle ? <p className="mt-1 text-slate-500">{preview.jobTitle}</p> : null}
            {Array.isArray(preview.modules) && preview.modules.length ? (
              <ul className="mt-2 space-y-1 text-xs text-slate-500">
                {preview.modules.map((mod) => (
                  <li key={mod.code}>
                    {mod.label} · {MODULE_LEVELS[mod.level]?.label || mod.level}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Ad soyad
            <input
              className={fieldClass}
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>
          {preview.requiresPassword !== false ? (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Şifre
                <input
                  className={fieldClass}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Şifre tekrar
                <input
                  className={fieldClass}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password2}
                  onChange={(e) => setPassword2(e.target.value)}
                />
              </label>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              Mevcut hesabınızın e-posta ve şifresiyle giriş yapmaya devam edeceksiniz.
            </p>
          )}
          {error ? <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Onaylanıyor…' : 'Daveti onayla ve gir'}
          </button>
        </form>
      ) : null}
    </AuthShell>
  )
}

export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!token) {
        setError('Doğrulama bağlantısı eksik')
        return
      }
      try {
        await verifyEmailWithToken(token)
        if (!cancelled) setDone(true)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Doğrulama başarısız')
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <AuthShell
      title="E-posta doğrulama"
      subtitle="Hesap e-posta adresiniz doğrulanıyor"
      footer={
        <Link className="font-semibold text-[#1d4ed8] hover:underline" to="/giris">
          Girişe git
        </Link>
      }
    >
      {done ? (
        <p className="rounded-lg bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
          E-posta adresiniz doğrulandı.
        </p>
      ) : error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : (
        <p className="text-sm text-slate-600">Doğrulanıyor…</p>
      )}
    </AuthShell>
  )
}
