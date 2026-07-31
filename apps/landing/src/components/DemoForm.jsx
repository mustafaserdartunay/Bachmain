'use client'

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle, Mail, Phone, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from './ui/Button'
import Input from './ui/Input'
import { yonetimPost, redirectToAppWithToken } from '../utils/platformApi'
import { trackCta } from '../analytics/track'

const bandInputCls =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20'

const emptyForm = {
  fullName: '',
  companyName: '',
  phone: '',
  email: '',
}

function readPrefill() {
  if (typeof window === 'undefined') return {}
  try {
    const q = new URLSearchParams(window.location.search)
    return {
      fullName: q.get('name') || q.get('fullName') || '',
      companyName: q.get('company') || q.get('companyName') || '',
      phone: q.get('phone') || '',
      email: q.get('email') || '',
    }
  } catch {
    return {}
  }
}

/**
 * Demo lead form — single short form creates the demo and enters the app.
 * No second billing form, no kurulum sihirbazı.
 * - panel: /demo card
 * - band: homepage CTA glass
 */
export default function DemoForm({ variant = 'panel' } = {}) {
  const [form, setForm] = useState(() => ({ ...emptyForm, ...readPrefill() }))
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [sessionToken, setSessionToken] = useState('')
  const [licenseExpiry, setLicenseExpiry] = useState('')

  useEffect(() => {
    const pre = readPrefill()
    if (Object.values(pre).some(Boolean)) {
      setForm((prev) => ({ ...prev, ...pre }))
    }
  }, [])

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = 'Ad soyad gerekli'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Geçerli e-posta girin'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10)
      e.phone = 'Geçerli telefon girin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const createDemoAccount = async (sourceLabel) => {
    setBusy(true)
    setSubmitError('')
    try {
      const data = await yonetimPost('leads/demo', {
        fullName: form.fullName.trim(),
        companyName: form.companyName.trim() || form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        source: 'bachmain_demo',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        language: typeof navigator !== 'undefined' ? navigator.language : 'tr',
      })
      trackCta('demo_submit', { source: sourceLabel })
      const token = data.token || data.tokens?.accessToken || ''
      if (!token) {
        throw new Error('Demo oluşturuldu ancak oturum alınamadı. Giriş sayfasından deneyin.')
      }
      setSessionToken(token)
      setLicenseExpiry(data.licenseExpiry || data.user?.licenseExpiry || '')
      setDone(true)
      window.setTimeout(() => redirectToAppWithToken(token), 900)
    } catch (err) {
      setDone(false)
      setSubmitError(err.message || 'Demonuz oluşturulamadı. Lütfen tekrar deneyin.')
      setBusy(false)
    }
  }

  const onSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    await createDemoAccount(variant === 'band' ? 'demo_band' : 'demo_panel')
  }

  const enterApp = () => {
    if (sessionToken) redirectToAppWithToken(sessionToken)
    else window.location.href = 'https://bachmain.com/giris'
  }

  if (variant === 'band') {
    if (done) {
      return (
        <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur lg:p-8">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-300" aria-hidden />
          <p className="mt-4 text-lg font-bold text-white">Demonuz oluşturuldu</p>
          <p className="mt-2 text-sm text-white/75">
            Teşekkür ederiz. Uygulamaya yönlendiriliyorsunuz…
            {licenseExpiry ? (
              <>
                {' '}
                · bitiş:{' '}
                <span className="font-semibold tabular-nums text-white">{licenseExpiry}</span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={enterApp}
            className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 sm:w-auto"
          >
            Hemen Giriş Yap
          </button>
        </div>
      )
    }

    return (
      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur lg:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'fullName', label: 'Ad Soyad *', type: 'text' },
            { key: 'companyName', label: 'Şirket (opsiyonel)', type: 'text' },
            { key: 'phone', label: 'Telefon *', type: 'tel' },
            { key: 'email', label: 'İş e-postası *', type: 'email' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-semibold text-white/85">{label}</label>
              <input
                type={type}
                className={bandInputCls}
                value={form[key]}
                onChange={setField(key)}
                autoComplete={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'name'}
              />
              {errors[key] ? <p className="mt-1 text-xs text-rose-200">{errors[key]}</p> : null}
            </div>
          ))}
        </div>
        {submitError ? <p className="mt-4 text-sm text-rose-200">{submitError}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-full bg-white px-6 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 disabled:opacity-60 sm:w-auto"
        >
          {busy ? 'Oluşturuluyor…' : 'Demo Oluştur →'}
        </button>
      </form>
    )
  }

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[640px]"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="text-center text-4xl font-extrabold tracking-[-0.04em] text-[#2563EB] uppercase sm:text-5xl">
        Demo Oluştur
      </h2>
      {!done ? (
        <p className="mx-auto mt-4 max-w-xl text-center text-[14px] leading-relaxed font-medium text-[#64748B]">
          Bilgilerinizi girin; 7 günlük demo hemen açılsın. Kurulum sihirbazı yok — doğrudan
          uygulamaya girersiniz.
        </p>
      ) : null}

      <div className="relative mt-10 rounded-[32px] border-[3px] border-[#2563EB] bg-white/95 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:mt-12 sm:p-10">
        {done ? (
          <div className="py-6 text-center">
            <CheckCircle className="mx-auto h-14 w-14 text-[#16A34A]" aria-hidden />
            <p className="mt-5 text-[28px] font-extrabold tracking-tight text-[#0F172A]">
              Demonuz oluşturuldu
            </p>
            <p className="mt-2 text-[15px] font-medium text-[#64748B]">
              Teşekkür ederiz. 7 günlük demo hesabınız hazır
              {licenseExpiry ? (
                <>
                  {' '}
                  · bitiş:{' '}
                  <span className="font-bold text-[#0F172A] tabular-nums">{licenseExpiry}</span>
                </>
              ) : null}
              .
            </p>
            <p className="mt-4 text-[14px] font-medium text-[#64748B]">
              Uygulamaya yönlendiriliyorsunuz…
            </p>
            <Button type="button" fullWidth className="mt-6" onClick={enterApp}>
              Hemen Giriş Yap
            </Button>
            <p className="mt-4 text-[13px] font-medium text-[#64748B]">
              Aynı e-posta ile ikinci demo açılamaz. Süre bitince yönetim uzatabilir.
            </p>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                name="fullName"
                required
                autoComplete="name"
                placeholder="Ad Soyad *"
                value={form.fullName}
                onChange={setField('fullName')}
                error={errors.fullName}
                leftIcon={<User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
                aria-label="Ad Soyad"
              />
              <Input
                name="companyName"
                autoComplete="organization"
                placeholder="Şirket (opsiyonel)"
                value={form.companyName}
                onChange={setField('companyName')}
                error={errors.companyName}
                leftIcon={
                  <Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
                }
                aria-label="Şirket"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                name="phone"
                required
                type="tel"
                autoComplete="tel"
                placeholder="Telefon *"
                value={form.phone}
                onChange={setField('phone')}
                error={errors.phone}
                leftIcon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
                aria-label="Telefon"
              />
              <Input
                name="email"
                required
                type="email"
                autoComplete="email"
                placeholder="E-posta *"
                value={form.email}
                onChange={setField('email')}
                error={errors.email}
                leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
                aria-label="E-posta"
              />
            </div>

            {submitError ? (
              <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
                {submitError}
              </p>
            ) : null}

            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Oluşturuluyor…' : 'Demo Oluştur'}
            </Button>

            <p className="pt-1 text-center text-[14px] font-medium text-[#64748B]">
              Hesabınız var mı?{' '}
              <Link to="/login" className="font-bold text-[#2563EB] hover:underline">
                Giriş Yap
              </Link>
            </p>
          </form>
        )}
      </div>
    </motion.div>
  )
}
