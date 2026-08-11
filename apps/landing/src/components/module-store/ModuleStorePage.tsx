'use client'

import { Search, ShoppingCart, Sparkles } from 'lucide-react'
import ModuleCard from './ModuleCard'
import ModuleCartSidebar from './ModuleCartSidebar'
import ModuleDetailDrawer from './ModuleDetailDrawer'
import { ModuleStoreProvider, useModuleStore } from './ModuleStoreContext'

function PeriodToggle() {
  const { period, setPeriod, catalog } = useModuleStore()
  return (
    <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => setPeriod('month')}
        className={[
          'rounded-full px-4 py-2 text-[13px] font-bold transition',
          period === 'month' ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:text-slate-900',
        ].join(' ')}
      >
        Aylık
      </button>
      <button
        type="button"
        onClick={() => setPeriod('year')}
        className={[
          'rounded-full px-4 py-2 text-[13px] font-bold transition',
          period === 'year' ? 'bg-[#2563EB] text-white' : 'text-slate-600 hover:text-slate-900',
        ].join(' ')}
      >
        Yıllık
        <span className="ml-1.5 rounded-full bg-[#FFB000]/20 px-1.5 py-0.5 text-[10px] font-extrabold text-[#B45309]">
          %{catalog.yearlyDiscountPercent} avantaj
        </span>
      </button>
    </div>
  )
}

function ModuleStoreInner() {
  const {
    loading,
    catalog,
    category,
    setCategory,
    query,
    setQuery,
    filteredModules,
    totals,
    mobileCartOpen,
    setMobileCartOpen,
    toast,
  } = useModuleStore()

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] pb-28 lg:pb-16">
      <section className="border-b border-slate-200/70 bg-gradient-to-b from-white to-[#F8FAFC] pt-28 pb-10">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-blue-600">
            Bachmain Modül Mağazası
          </p>
          <h1 className="mt-2 max-w-3xl text-[34px] font-extrabold tracking-tight text-slate-900 sm:text-[42px]">
            İhtiyacın Olan Modülü Seç.
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-500 sm:text-[16px]">
            Bachmain’i işletmenizin ihtiyaçlarına göre şekillendirin. Sadece kullanacağınız
            modülleri seçin, sepetinize ekleyin ve hemen kullanmaya başlayın.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              'İhtiyacınıza göre seçin',
              'İstediğiniz zaman ekleyin',
              'Tek panelden yönetin',
              'Şeffaf fiyatlandırma',
            ].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600"
              >
                <Sparkles className="h-3 w-3 text-[#FFB000]" aria-hidden />
                {label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <PeriodToggle />
            <label className="relative block w-full max-w-sm">
              <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Modül ara..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-4 pl-10 text-[14px] text-slate-800 outline-none ring-blue-500/30 placeholder:text-slate-400 focus:border-blue-400 focus:ring-2"
              />
            </label>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 py-8 lg:gap-8">
          <div className="min-w-0 flex-1 lg:w-[72%]">
            <div className="mb-5 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {catalog.categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.id)}
                  className={[
                    'shrink-0 rounded-full px-3.5 py-2 text-[13px] font-bold transition',
                    category === c.id
                      ? 'bg-[#2563EB] text-white shadow-sm'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-700',
                  ].join(' ')}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-64 animate-pulse rounded-2xl border border-slate-100 bg-white"
                  />
                ))}
              </div>
            ) : filteredModules.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center">
                <p className="text-[15px] font-semibold text-slate-700">Modül bulunamadı</p>
                <p className="mt-1 text-[13px] text-slate-500">
                  Farklı bir kategori veya arama deneyin.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filteredModules.map((mod) => (
                  <ModuleCard key={mod.code} mod={mod} />
                ))}
              </div>
            )}
          </div>

          <div className="hidden w-[28%] shrink-0 lg:block">
            <ModuleCartSidebar />
          </div>
        </div>
      </div>

      {/* Mobile sticky cart bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileCartOpen(true)}
          className="flex h-12 w-full items-center justify-between rounded-xl bg-[#2563EB] px-4 text-white shadow-lg"
        >
          <span className="inline-flex items-center gap-2 text-[14px] font-bold">
            <ShoppingCart className="h-4 w-4" />
            Sepetim ({totals.count})
          </span>
          <span className="text-[14px] font-extrabold">
            ₺{totals.total.toLocaleString('tr-TR')}
          </span>
        </button>
      </div>

      {mobileCartOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/40"
            aria-label="Kapat"
            onClick={() => setMobileCartOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88vh] overflow-hidden">
            <ModuleCartSidebar variant="sheet" onClose={() => setMobileCartOpen(false)} />
          </div>
        </div>
      ) : null}

      <ModuleDetailDrawer />

      {toast ? (
        <div
          className={[
            'fixed right-4 bottom-24 z-[90] max-w-sm rounded-xl px-4 py-3 text-[13.5px] font-semibold text-white shadow-xl lg:bottom-6',
            toast.tone === 'warn' ? 'bg-amber-600' : 'bg-slate-900',
          ].join(' ')}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  )
}

export default function ModuleStorePage() {
  return (
    <ModuleStoreProvider>
      <ModuleStoreInner />
    </ModuleStoreProvider>
  )
}
