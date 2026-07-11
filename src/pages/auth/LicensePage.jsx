import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function LicensePage() {
  const { user, logout } = useAuth()
  const expiry = user?.licenseExpiry || '—'
  const plan = user?.plan || 'Starter'
  const status = user?.status || 'trial'

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">BACHMAIN</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Lisans / Deneme süresi</h1>
        <p className="mt-2 text-sm text-slate-600">
          Hesabınızın erişimi sınırlandı. Plan: <strong>{plan}</strong> · Durum: <strong>{status}</strong> ·
          Bitiş: <strong>{expiry}</strong>
        </p>
        <div className="mt-6 space-y-3 text-sm text-slate-700">
          <p>Satış ekibimizle iletişime geçerek planınızı yükseltebilir veya ödemeyi tamamlayabilirsiniz.</p>
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
