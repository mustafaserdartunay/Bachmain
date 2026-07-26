'use client'

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, CheckCircle, Mail, Phone, User } from 'lucide-react'
import { motion } from 'framer-motion'
import Button from './ui/Button'
import Input from './ui/Input'
import { platformPost } from '../utils/platformApi'
import { trackCta } from '../analytics/track'

const bandInputCls =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20'

/**
 * Demo lead form.
 * - panel: login-style light card ( /demo )
 * - band: dark glass fields for homepage CTA strip
 */
export default function DemoForm({ variant = 'panel' } = {}) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '' })
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Ad soyad gerekli'
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Geçerli e-posta girin'
    if (!form.phone.trim() || form.phone.replace(/\D/g, '').length < 10)
      e.phone = 'Geçerli telefon girin'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setBusy(true)
    setSubmitError('')
    try {
      await platformPost('leads/demo', {
        name: form.name.trim(),
        company: form.company.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        source: 'bachmain_demo',
      })
      trackCta('demo_submit', { source: 'demo_form' })
      setDone(true)
    } catch (err) {
      setSubmitError(err.message || 'Talebiniz gönderilemedi. Lütfen tekrar deneyin.')
    } finally {
      setBusy(false)
    }
  }

  if (variant === 'band') {
    if (done) {
      return (
        <div className="rounded-2xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur">
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-300" />
          <h3 className="mt-4 text-xl font-bold text-white">Talebiniz alındı!</h3>
          <p className="mt-2 text-white/70">Ekibimiz 24 saat içinde sizinle iletişime geçecek.</p>
        </div>
      )
    }

    return (
      <form
        onSubmit={submit}
        className="rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur lg:p-8"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { key: 'name', label: 'Ad Soyad *', type: 'text' },
            { key: 'company', label: 'Şirket (opsiyonel)', type: 'text' },
            { key: 'phone', label: 'Telefon *', type: 'tel' },
            { key: 'email', label: 'İş e-postası *', type: 'email' },
          ].map(({ key, label, type }) => (
            <div key={key}>
              <label className="mb-1 block text-sm font-semibold text-white/85">{label}</label>
              <input
                type={type}
                className={bandInputCls}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
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
          {busy ? 'Gönderiliyor…' : 'Hemen Demo Talep Et →'}
        </button>
      </form>
    )
  }

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[440px]"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <h2 className="mb-8 text-center text-4xl font-extrabold tracking-[-0.04em] text-[#2563EB] uppercase sm:text-5xl">
        Demo Oluştur
      </h2>

      <motion.div
        className="pointer-events-none absolute top-[4.5rem] -inset-x-px bottom-0 rounded-[34px] bg-gradient-to-br from-[#60A5FA]/50 via-[#2563EB]/25 to-[#38BDF8]/40 opacity-70 blur-[1px]"
        aria-hidden
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative rounded-[32px] border-[3px] border-[#2563EB] bg-white/95 p-8 shadow-[0_24px_64px_rgba(37,99,235,0.14)] backdrop-blur-sm sm:p-10">
        {done ? (
          <div className="py-10 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-[#2563EB]" aria-hidden />
            <p className="mt-4 text-[22px] font-extrabold tracking-tight text-[#0F172A]">
              Talebiniz alındı!
            </p>
            <p className="mt-2 text-[14px] font-medium text-[#64748B]">
              Ekibimiz 24 saat içinde sizinle iletişime geçecek.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <Input
              name="name"
              type="text"
              autoComplete="name"
              placeholder="Ad Soyad"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              error={errors.name}
              leftIcon={<User className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Ad Soyad"
            />
            <Input
              name="company"
              type="text"
              autoComplete="organization"
              placeholder="Şirket (opsiyonel)"
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              leftIcon={<Building2 className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Şirket"
            />
            <Input
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="Telefon"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              error={errors.phone}
              leftIcon={<Phone className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="Telefon"
            />
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="İş e-postası"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={errors.email}
              leftIcon={<Mail className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />}
              aria-label="İş e-postası"
            />

            {submitError ? (
              <p className="rounded-[18px] bg-[#FEF2F2] px-4 py-3 text-sm font-medium text-[#EF4444]">
                {submitError}
              </p>
            ) : null}

            <Button type="submit" fullWidth disabled={busy}>
              {busy ? 'Gönderiliyor…' : 'Hemen Demo Talep Et'}
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
