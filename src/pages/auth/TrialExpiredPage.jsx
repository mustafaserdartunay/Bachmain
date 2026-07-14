import { useState } from 'react'
import BrandLogo from '../../components/Layout/BrandLogo'
import { useAuth } from '../../auth/AuthContext'
import { getStoredSession } from '../../utils/platformAuth'

const API = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'

const PLANS = [
  { id: 'Starter', label: 'Starter', price: '990₺', priceNote: '/ay', cta: 'Ödeme yap' },
  { id: 'Professional', label: 'Professional', price: '2490₺', priceNote: '/ay', cta: 'Ödeme yap' },
  { id: 'Business', label: 'Business', price: '4990₺', priceNote: '/ay', cta: 'Ödeme yap' },
  { id: 'Enterprise', label: 'Enterprise', price: 'İletişim', priceNote: '', cta: 'İletişime geç' },
]

export default function TrialExpiredPage() {
  const { user, logout } = useAuth()
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  async function startCheckout(planId) {
    if (planId === 'Enterprise') {
      window.location.href = 'mailto:destek@bachmain.com?subject=BACHMAIN%20Enterprise'
      return
    }
    setBusy(planId)
    setMessage('')
    try {
      const headers = { 'Content-Type': 'application/json' }
      const { token } = getStoredSession()
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`${API}/payments/checkout`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          plan: planId === 'Professional' ? 'Pro' : planId,
          customerId: user?.customerId,
          email: user?.email,
          source: 'trial_expired',
          successUrl: 'https://uygulama.bachmain.com/?paid=1',
          cancelUrl: 'https://uygulama.bachmain.com/deneme-bitti',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || data.error || 'Ödeme başlatılamadı')
      if (data.url) {
        window.location.href = data.url
        return
      }
      setMessage(data.message || 'Talebiniz alındı. Satış ekibi sizinle iletişime geçecek.')
    } catch (err) {
      setMessage(err.message || 'Bir hata oluştu')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#e8eef8_0%,_#f4f6fa_45%,_#eef1f6_100%)] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-4 py-12">
        <BrandLogo />
        <h1 className="mt-8 text-center text-3xl font-semibold tracking-tight text-[#0b1f3a] sm:text-4xl">
          Ücretsiz deneme süreniz doldu.
        </h1>
        <p className="mt-2 text-center text-sm text-slate-500" lang="en">
          Your free trial has expired.
        </p>
        <p className="mt-5 text-center text-base text-slate-600">
          Bir abonelik seçin.
          <span className="ml-1 text-slate-400" lang="en">
            Choose a subscription.
          </span>
        </p>

        <div className="mt-10 grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="flex flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_20px_60px_-30px_rgba(11,31,58,0.45)] backdrop-blur"
            >
              <p className="text-sm font-semibold text-[#0b1f3a]">{plan.label}</p>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-[#0b1f3a]">
                {plan.price}
                {plan.priceNote ? (
                  <span className="ml-0.5 text-sm font-medium text-slate-500">{plan.priceNote}</span>
                ) : null}
              </p>
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => startCheckout(plan.id)}
                className="mt-5 w-full rounded-xl bg-[#0b1f3a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#143056] disabled:opacity-60"
              >
                {busy === plan.id ? '…' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        {message ? (
          <p className="mt-6 rounded-lg bg-slate-100 px-4 py-2 text-sm text-slate-700">{message}</p>
        ) : null}

        <button
          type="button"
          onClick={() => logout?.()}
          className="mt-10 text-sm font-medium text-slate-500 transition hover:text-slate-800 hover:underline"
        >
          Çıkış yap
        </button>
      </div>
    </div>
  )
}
