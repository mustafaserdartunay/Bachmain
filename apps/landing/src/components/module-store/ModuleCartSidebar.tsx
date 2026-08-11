'use client'

import { Link } from 'react-router-dom'
import { ArrowRight, PackageOpen, ShieldCheck, Trash2, X } from 'lucide-react'
import { formatTry, modulePriceSuffix, moduleUnitPrice } from '../../data/moduleStoreFallback'
import { ModuleIcon } from './ModuleIcon'
import { useModuleStore } from './ModuleStoreContext'

export default function ModuleCartSidebar({
  variant = 'desktop',
  onClose,
}: {
  variant?: 'desktop' | 'sheet'
  onClose?: () => void
}) {
  const {
    cartModules,
    period,
    totals,
    removeFromCart,
    clearCart,
    showToast,
  } = useModuleStore()

  const confirmRemove = (code: string, name: string) => {
    if (window.confirm(`${name}'yu sepetten çıkarmak istiyor musunuz?`)) {
      removeFromCart(code)
      showToast(`${name} sepetten çıkarıldı.`, 'warn')
    }
  }

  return (
    <aside
      className={[
        'flex flex-col border border-slate-200/90 bg-white shadow-[0_8px_32px_rgba(15,23,42,0.08)]',
        variant === 'desktop'
          ? 'sticky top-24 max-h-[calc(100vh-7rem)] rounded-2xl'
          : 'h-full rounded-t-3xl',
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-[17px] font-extrabold tracking-tight text-slate-900">Sepetim</h2>
          <p className="text-[12.5px] font-medium text-slate-500">
            {totals.count > 0
              ? `${totals.count} modül seçildi`
              : 'Henüz bir modül seçmediniz.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {totals.count > 0 ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Sepeti temizlemek istiyor musunuz?')) clearCart()
              }}
              className="text-[12px] font-semibold text-slate-400 transition hover:text-rose-600"
            >
              Temizle
            </button>
          ) : null}
          {variant === 'sheet' && onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {cartModules.length === 0 ? (
          <div className="flex flex-col items-center px-2 py-10 text-center">
            <span className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-400">
              <PackageOpen className="h-7 w-7" />
            </span>
            <p className="text-[14px] font-semibold text-slate-700">Sepetiniz boş</p>
            <p className="mt-1.5 max-w-[220px] text-[12.5px] leading-relaxed text-slate-500">
              İhtiyacınız olan modülleri seçerek işletmenizi kendi ihtiyaçlarınıza göre oluşturun.
            </p>
            {variant === 'sheet' && onClose ? (
              <button
                type="button"
                onClick={onClose}
                className="mt-5 inline-flex h-10 items-center rounded-xl bg-slate-100 px-4 text-[13px] font-bold text-slate-700"
              >
                Modülleri İncele
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2.5">
            {cartModules.map((m) => (
              <li
                key={m.code}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white"
                  style={{ color: m.iconColor }}
                >
                  <ModuleIcon name={m.icon} color={m.iconColor} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold text-slate-800">{m.name}</p>
                  <p className="text-[12px] font-semibold text-slate-500">
                    {formatTry(moduleUnitPrice(m, period))} {modulePriceSuffix(period)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => confirmRemove(m.code, m.name)}
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600"
                  aria-label={`${m.name} kaldır`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-slate-100 px-5 py-4">
        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between text-slate-500">
            <dt>Ara toplam</dt>
            <dd className="font-semibold text-slate-700">{formatTry(totals.subtotal)}</dd>
          </div>
          {totals.yearlyAdvantage > 0 ? (
            <div className="flex justify-between text-emerald-600">
              <dt>Yıllık avantaj</dt>
              <dd className="font-semibold">−{formatTry(totals.yearlyAdvantage)}</dd>
            </div>
          ) : null}
          <div className="flex justify-between text-slate-500">
            <dt>KDV (%20)</dt>
            <dd className="font-semibold text-slate-700">{formatTry(totals.vat)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-slate-100 pt-2">
            <dt className="text-[14px] font-bold text-slate-900">Toplam</dt>
            <dd className="text-[20px] font-extrabold tracking-tight text-[#2563EB]">
              {formatTry(totals.total)}
              <span className="ml-1 text-[12px] font-semibold text-slate-400">
                {modulePriceSuffix(period)}
              </span>
            </dd>
          </div>
        </dl>

        <Link
          to="/paketler/moduller/odeme"
          className={[
            'mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition',
            totals.count === 0
              ? 'pointer-events-none bg-slate-100 text-slate-400'
              : 'bg-[#2563EB] text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 hover:bg-[#1D4ED8]',
          ].join(' ')}
          onClick={onClose}
        >
          Satın Almaya Devam Et <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mt-3 flex items-start gap-2 text-[11.5px] leading-snug text-slate-500">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
          <span>
            <strong className="font-semibold text-slate-600">Güvenli Ödeme</strong>
            <br />
            256 bit SSL ile güvenli ödeme
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-3.5 py-3">
          <p className="text-[12.5px] font-semibold text-slate-700">
            İhtiyacın olan modülü bulamadın mı?
          </p>
          <Link
            to="/iletisim"
            className="mt-2 inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[12.5px] font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
            onClick={onClose}
          >
            İletişime Geç
          </Link>
        </div>
      </div>
    </aside>
  )
}
