import { Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import DemoForm from '../components/DemoForm'
import ScrollReveal from '../components/ScrollReveal'
import { platformPost, redirectToAppWithToken } from '../utils/platformApi'

const inputCls =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15'

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      {children}
      {error ? <p className="mt-1 text-xs text-rose-500">{error}</p> : null}
    </div>
  )
}

function AuthShell({ title, subtitle, dark = false, children, wide = false }) {
  return (
    <div
      className={`relative min-h-[85vh] overflow-hidden pt-24 pb-16 ${dark ? 'bg-slate-950' : 'page-mesh'}`}
    >
      <div className={`relative mx-auto px-4 lg:px-8 ${wide ? 'max-w-3xl' : 'max-w-md'}`}>
        {title ? (
          <h1
            className={`text-center text-3xl font-extrabold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}
          >
            {title}
          </h1>
        ) : null}
        {subtitle ? (
          <p className={`mt-2 text-center ${dark ? 'text-slate-300' : 'text-slate-500'}`}>
            {subtitle}
          </p>
        ) : null}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  )
}

function LoginForm() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    const e2 = {}
    if (!form.email?.trim()) e2.email = 'E-posta gerekli'
    if (!form.password?.trim()) e2.password = 'Şifre gerekli'
    setErrors(e2)
    if (Object.keys(e2).length > 0) return

    setBusy(true)
    setSubmitError('')
    try {
      const data = await platformPost('auth/login', {
        email: form.email.trim(),
        password: form.password,
      })
      setDone(true)
      setTimeout(() => redirectToAppWithToken(data.token), 900)
    } catch (err) {
      setSubmitError(err.message || 'İşlem başarısız. Lütfen tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="saas-card p-8 text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-blue-600" />
        <h3 className="mt-4 text-xl font-bold text-slate-900">Giriş başarılı!</h3>
        <p className="mt-2 text-slate-500">Uygulamaya yönlendiriliyorsunuz…</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="saas-card space-y-4 p-8">
      <Field label="E-posta *" error={errors.email}>
        <input
          type="email"
          className={inputCls}
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
      </Field>
      <Field label="Şifre *" error={errors.password}>
        <input
          type="password"
          className={inputCls}
          autoComplete="current-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </Field>
      {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
      <Button type="submit" disabled={busy} className="w-full justify-center">
        {busy ? 'Lütfen bekleyin…' : 'Giriş Yap'}
      </Button>
      <p className="text-center text-sm text-slate-500">
        Hesabınız yok mu?{' '}
        <Link to="/register" className="font-semibold text-blue-600 hover:underline">
          Üye Ol
        </Link>
      </p>
    </form>
  )
}

export function LoginPage() {
  return (
    <AuthShell dark title="Giriş Yap" subtitle="Hesabınıza giriş yapın">
      <LoginForm />
    </AuthShell>
  )
}

export function DemoPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Demo Talep Edin</h1>
        <p className="mt-3 text-slate-500">
          Size özel bir demo sunalım — talebiniz yönetim panelinde kaydedilir
        </p>
      </section>
      <section className="pb-20">
        <div className="mx-auto max-w-2xl px-4">
          <ScrollReveal>
            <div className="cta-band p-2">
              <DemoForm />
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}

export function ContactPage() {
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setSubmitError('')
    try {
      await platformPost('leads/demo', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
        company: form.name.trim(),
        source: 'bachmain_contact',
      })
      setDone(true)
    } catch (err) {
      setSubmitError(err.message || 'Mesaj gönderilemedi.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">İletişim</h1>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Bize Ulaşın</h2>
            <ul className="mt-6 space-y-4 text-slate-500">
              <li>info@bachmain.com.tr</li>
              <li>0212 963 00 20</li>
              <li>İstanbul, Türkiye</li>
            </ul>
          </div>
          {done ? (
            <div className="saas-card p-8 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-blue-600" />
              <p className="mt-4 font-bold text-slate-900">Mesajınız iletildi!</p>
            </div>
          ) : (
            <form onSubmit={submit} className="saas-card space-y-4 p-8">
              <div>
                <label className="text-sm font-semibold text-slate-700">Ad Soyad</label>
                <input
                  required
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">E-posta</label>
                <input
                  type="email"
                  required
                  className={inputCls}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Telefon</label>
                <input
                  required
                  className={inputCls}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Mesaj</label>
                <textarea
                  rows={4}
                  className={inputCls}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                />
              </div>
              {submitError ? <p className="text-sm text-rose-500">{submitError}</p> : null}
              <Button type="submit" disabled={busy} className="w-full justify-center">
                {busy ? 'Gönderiliyor…' : 'Gönder'}
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
