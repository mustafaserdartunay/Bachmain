import { Link } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getStoredSession } from '../../utils/platformAuth'

const API = import.meta.env.VITE_PLATFORM_API_URL || 'https://yonetim.bachmain.com/api'

const PLANS = [
  { id: 'Starter', label: 'Başlangıç', price: '₺990/ay' },
  { id: 'Pro', label: 'Profesyonel', price: '₺2.490/ay' },
  { id: 'Enterprise', label: 'Kurumsal', price: 'Teklif' },
]

export default function LicensePage() {
  const { user, logout } = useAuth()
  const expiry = user?.licenseExpiry || '—'
  const plan = user?.plan || 'Starter'
  const status = user?.status || 'trial'
  const [busy, setBusy] = useState('')
  const [message, setMessage] = useState('')

  async function startCheckout(planId) {
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
          plan: planId,
          customerId: user?.customerId,
          email: user?.email,
          source: 'license_page',
          successUrl: 'https://uygulama.bachmain.com/?paid=1',
          cancelUrl: 'https://uygulama.bachmain.com/hesap/lisans',
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
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">BACHMAIN</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Lisans / Deneme süresi</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hesabınızın erişimi sınırlandı. Plan: <strong>{plan}</strong> · Durum: <strong>{status}</strong> ·
          Bitiş: <strong>{expiry}</strong>
        </p>

        <div className="mt-6 space-y-2">
          <p className="text-sm font-medium text-slate-800">Plan yükselt</p>
          {PLANS.map((p) => (
            <button
              key={p.id}
              type="button"
              disabled={Boolean(busy)}
              onClick={() => startCheckout(p.id)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-sm hover:border-blue-400 disabled:opacity-60"
            >
              <span>
                <strong>{p.label}</strong>
                <span className="ml-2 text-slate-500">{p.price}</span>
              </span>
              <span className="text-blue-700">{busy === p.id ? '…' : 'Seç'}</span>
            </button>
          ))}
        </div>

        {message ? <p className="mt-4 text-sm text-slate-700">{message}</p> : null}

        <div className="mt-6 space-y-2 text-sm text-slate-600">
          <a className="block font-medium text-blue-700 underline" href="mailto:destek@bachmain.com">
            destek@bachmain.com
          </a>
          <a className="block font-medium text-blue-700 underline" href="https://bachmain.com/fiyatlandirma.html">
            Fiyatlandırma
          </a>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/giris"
            onClick={() => logout?.()}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800"
          >
            Çıkış yap
          </Link>
        </div>
      </div>
    </div>
  )
}
