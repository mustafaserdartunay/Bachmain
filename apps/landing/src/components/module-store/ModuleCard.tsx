'use client'

import { Check, Plus } from 'lucide-react'
import type { StoreModule } from '../../data/moduleStoreTypes'
import { formatTry, modulePriceSuffix, moduleUnitPrice } from '../../data/moduleStoreFallback'
import { ModuleIcon } from './ModuleIcon'
import { useModuleStore } from './ModuleStoreContext'

export default function ModuleCard({ mod }: { mod: StoreModule }) {
  const { period, addToCart, isInCart, openDetail } = useModuleStore()
  const inCart = isInCart(mod.code)
  const owned = Boolean(mod.isOwned)
  const price = moduleUnitPrice(mod, period)

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_rgba(37,99,235,0.05)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(37,99,235,0.12)]">
      <div className="flex items-start gap-3">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${mod.iconColor}18` }}
        >
          <ModuleIcon name={mod.icon} color={mod.iconColor} className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[16px] font-bold tracking-tight text-slate-900">{mod.name}</h3>
            {owned ? (
              <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                ✓ Aktif
              </span>
            ) : null}
          </div>
          <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-slate-500">
            {mod.description}
          </p>
        </div>
      </div>

      {mod.features?.length ? (
        <ul className="mt-4 space-y-1.5">
          {mod.features.slice(0, 4).map((f) => (
            <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-600">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-5">
        <div className="mb-3 flex items-baseline gap-1.5">
          <span className="text-[22px] font-extrabold tracking-tight text-slate-900">
            {formatTry(price)}
          </span>
          <span className="text-[13px] font-medium text-slate-400">{modulePriceSuffix(period)}</span>
        </div>

        <div className="flex flex-col gap-2">
          {owned ? (
            <a
              href="https://uygulama.bachmain.com/hesap/lisans"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-[14px] font-bold text-slate-700 transition hover:bg-slate-100"
            >
              Modülü Yönet
            </a>
          ) : (
            <button
              type="button"
              onClick={() => addToCart(mod.code)}
              className={[
                'inline-flex h-11 items-center justify-center gap-1.5 rounded-xl text-[14px] font-bold transition duration-200',
                inCart
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.28)] hover:-translate-y-0.5 hover:bg-[#1D4ED8] hover:shadow-[0_12px_28px_rgba(37,99,235,0.35)]',
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
          <button
            type="button"
            onClick={() => openDetail(mod)}
            className="text-[13px] font-semibold text-blue-600 transition hover:text-blue-700"
          >
            Detayları Gör
          </button>
        </div>
      </div>
    </article>
  )
}
