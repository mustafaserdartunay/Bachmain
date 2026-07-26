'use client'

import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import Button from './Button'
import { platformPost } from '../utils/platformApi'
import { trackCta } from '../analytics/track'

const inputCls =
  'w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-white/50 focus:outline-none focus:ring-2 focus:ring-white/20'

/** High-conversion demo form — fewer fields, stronger trust. */
export default function DemoForm() {
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
      <p className="mb-5 text-sm font-semibold text-white/80">
        4 alan · 30 sn · Kredi kartı yok · SSL korumalı
      </p>
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
              className={inputCls}
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              autoComplete={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'name'}
            />
            {errors[key] ? <p className="mt-1 text-xs text-rose-200">{errors[key]}</p> : null}
          </div>
        ))}
      </div>
      {submitError ? <p className="mt-4 text-sm text-rose-200">{submitError}</p> : null}
      <Button
        type="submit"
        variant="secondary"
        disabled={busy}
        className="mt-6 w-full justify-center sm:w-auto"
      >
        {busy ? 'Gönderiliyor…' : 'Hemen Demo Talep Et →'}
      </Button>
      <ul className="mt-4 flex flex-wrap gap-3 text-[11px] font-semibold text-white/55">
        <li>KVKK uyumlu</li>
        <li>SSL</li>
        <li>Veri güvenliği</li>
        <li>Bulut altyapı</li>
      </ul>
    </form>
  )
}
