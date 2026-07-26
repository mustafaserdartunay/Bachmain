'use client'

import { motion, useReducedMotion } from 'framer-motion'
import DemoForm from '../components/DemoForm'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'
import Button from '../components/Button'
import { platformPost } from '../utils/platformApi'

const inputCls =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15'

function AuthAmbient() {
  const reduce = useReducedMotion()

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(37,99,235,0.14),transparent_55%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_78%,rgba(56,189,248,0.12),transparent_42%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_88%_22%,rgba(59,130,246,0.10),transparent_40%)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 72%)',
        }}
      />
      <motion.div
        className="absolute -left-24 top-[18%] h-72 w-72 rounded-full bg-[#60A5FA]/25 blur-3xl"
        animate={reduce ? undefined : { x: [0, 36, 0], y: [0, 28, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -right-20 bottom-[12%] h-80 w-80 rounded-full bg-[#3B82F6]/20 blur-3xl"
        animate={reduce ? undefined : { x: [0, -28, 0], y: [0, -24, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute left-1/2 top-[42%] h-48 w-48 -translate-x-1/2 rounded-full bg-[#38BDF8]/15 blur-3xl"
        animate={reduce ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [0.92, 1.08, 0.92] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

export function DemoPage() {
  return (
    <div className="auth-ds relative flex min-h-[100dvh] flex-1 flex-col overflow-hidden bg-[#F8FAFC]">
      <h1 className="sr-only">Demo Oluştur</h1>
      <AuthAmbient />
      <section className="relative z-10 flex min-h-[100dvh] flex-1 items-center justify-center px-4 py-20 sm:px-6 lg:px-10">
        <div className="w-full max-w-[1600px]">
          <DemoForm variant="panel" />
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
