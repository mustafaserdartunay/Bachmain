'use client'

import { Check, Plus, X } from 'lucide-react'
import { formatTry, modulePriceSuffix, moduleUnitPrice } from '../../data/moduleStoreFallback'
import { ModuleIcon } from './ModuleIcon'
import { useModuleStore } from './ModuleStoreContext'

export default function ModuleDetailDrawer() {
  const { detailModule, openDetail, period, addToCart, isInCart } = useModuleStore()
  if (!detailModule) return null

  const mod = detailModule
  const inCart = isInCart(mod.code)
  const owned = Boolean(mod.isOwned)
  const price = moduleUnitPrice(mod, period)

  return (
    <div className="fixed inset-0 z-[80] flex justify-end">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]"
        aria-label="Kapat"
        onClick={() => openDetail(null)}
      />
      <div className="relative flex h-full w-full max-w-md translate-x-0 flex-col bg-white shadow-2xl transition-transform duration-200">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <span
              className="flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${mod.iconColor}18` }}
            >
              <ModuleIcon name={mod.icon} color={mod.iconColor} className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Modül detayı
              </p>
              <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">{mod.name}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openDetail(null)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-[14px] leading-relaxed text-slate-600">{mod.longDescription}</p>

          {mod.audience ? (
            <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3">
              <p className="text-[12px] font-bold uppercase tracking-wide text-blue-700">
                Kimler için?
              </p>
              <p className="mt-1 text-[13.5px] text-slate-700">{mod.audience}</p>
            </div>
          ) : null}

          {mod.features?.length ? (
            <div className="mt-6">
              <p className="text-[13px] font-bold text-slate-900">Özellikler</p>
              <ul className="mt-3 space-y-2">
                {mod.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[13.5px] text-slate-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex items-baseline gap-1.5">
            <span className="text-[28px] font-extrabold text-slate-900">{formatTry(price)}</span>
            <span className="text-[14px] font-medium text-slate-400">{modulePriceSuffix(period)}</span>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-4">
          {owned ? (
            <a
              href="https://uygulama.bachmain.com/hesap/lisans"
              className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[15px] font-bold text-slate-700"
            >
              Modülü Yönet
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                addToCart(mod.code)
                openDetail(null)
              }}
              className={[
                'inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[15px] font-bold transition',
                inCart
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'bg-[#2563EB] text-white shadow-[0_10px_24px_rgba(37,99,235,0.3)] hover:bg-[#1D4ED8]',
              ].join(' ')}
            >
              {inCart ? (
                <>
                  <Check className="h-4 w-4" /> Sepette
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Sepete Ekle
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
