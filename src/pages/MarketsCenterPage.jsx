import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Bell,
  CandlestickChart,
  Coins,
  LineChart,
  Newspaper,
  Settings2,
  Star,
  TrendingDown,
  TrendingUp,
  WalletCards,
} from 'lucide-react'
import { AppPageBackLink, AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import {
  APP_SURFACE_PANEL_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
  YFB_TEXT_CLASS,
} from '../utils/dashboardDesign'
import { marketsSubMenus } from '../data/marketsMenu'
import { marketsOverviewLocal } from '../markets/localStore'

function formatPrice(value, currency = 'TRY') {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency === 'USD' ? 'USD' : 'TRY',
      maximumFractionDigits: value >= 1000 ? 1 : 2,
    }).format(value)
  } catch {
    return String(value)
  }
}

function ChangePill({ pct }) {
  const up = pct >= 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${
        up ? 'text-emerald-600' : 'text-rose-600'
      }`}
    >
      {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {up ? '+' : ''}
      {pct.toFixed(2)}%
    </span>
  )
}

function QuoteCard({ quote }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`${YFB_TEXT_CLASS} text-[var(--ink)]`}>{quote.symbol}</p>
          <p className={`${YF_TEXT_CLASS} mt-0.5 truncate`}>{quote.name}</p>
        </div>
        <ChangePill pct={quote.changePct} />
      </div>
      <p className="mt-3 text-lg font-bold tabular-nums text-[var(--ink)]">
        {formatPrice(quote.price, quote.currency)}
      </p>
    </div>
  )
}

export default function MarketsCenterPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'overview'
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 12000)
    return () => window.clearInterval(id)
  }, [])

  const data = useMemo(() => {
    void tick
    return marketsOverviewLocal()
  }, [tick])

  const highlights = data.quotes.filter((q) =>
    ['XU100', 'XU030', 'USDTRY', 'EURTRY', 'XAUUSD', 'BTCUSD'].includes(q.symbol),
  )

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="PİYASA"
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />

      <div className="flex flex-wrap items-center gap-2">
        {marketsSubMenus.map((item) => {
          const active = (item.id === 'overview' ? 'overview' : item.id) === tab
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                setParams(item.id === 'overview' ? {} : { tab: item.id }, { replace: true })
              }
              className={`rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-[rgba(37,99,235,0.14)] text-[#1d4ed8]'
                  : 'text-[var(--muted)] hover:bg-[rgba(30,35,60,0.06)]'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} flex flex-wrap items-center gap-3 p-4`}>
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold ${
            data.marketOpen
              ? 'bg-emerald-500/15 text-emerald-700'
              : 'bg-slate-500/15 text-slate-600'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${data.marketOpen ? 'bg-emerald-500' : 'bg-slate-400'}`}
          />
          {data.marketOpen ? 'Piyasa Açık' : 'Piyasa Kapalı'}
        </span>
        <span className={YF_TEXT_CLASS}>{data.sessionLabel}</span>
        <span className={`${YF_TEXT_CLASS} ml-auto tabular-nums`}>
          Son güncelleme:{' '}
          {new Date(data.updatedAt).toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {highlights.map((quote) => (
          <QuoteCard key={quote.symbol} quote={quote} />
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
            <h2 className={`${YFB_TEXT_CLASS} uppercase text-[var(--muted)]`}>
              Günün en çok yükselenleri
            </h2>
          </div>
          <ul className="space-y-2">
            {data.gainers.map((q) => (
              <li key={q.symbol} className="flex items-center justify-between gap-2">
                <span className={YFB_TEXT_CLASS}>{q.symbol}</span>
                <ChangePill pct={q.changePct} />
              </li>
            ))}
          </ul>
        </section>
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="mb-3 flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-rose-600" />
            <h2 className={`${YFB_TEXT_CLASS} uppercase text-[var(--muted)]`}>
              Günün en çok düşenleri
            </h2>
          </div>
          <ul className="space-y-2">
            {data.losers.map((q) => (
              <li key={q.symbol} className="flex items-center justify-between gap-2">
                <span className={YFB_TEXT_CLASS}>{q.symbol}</span>
                <ChangePill pct={q.changePct} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="mb-3 flex items-center gap-2">
          <Star className="h-4 w-4 text-amber-500" />
          <h2 className={`${YFB_TEXT_CLASS} uppercase text-[var(--muted)]`}>Favorilerim</h2>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {data.favorites.map((q) => (
            <div
              key={q.symbol}
              className="flex items-center justify-between rounded-xl border border-[var(--glass-border)] px-3 py-2"
            >
              <div>
                <p className={YFB_TEXT_CLASS}>{q.symbol}</p>
                <p className="text-[12px] tabular-nums text-[var(--ink)]">
                  {formatPrice(q.price, q.currency)}
                </p>
              </div>
              <ChangePill pct={q.changePct} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CandlestickChart, label: 'Hisseler', tab: 'equities' },
          { icon: Coins, label: 'Döviz / Altın', tab: 'fx' },
          { icon: WalletCards, label: 'Portföyler', tab: 'portfolios' },
          { icon: Bell, label: 'Alarm Merkezi', tab: 'alerts' },
          { icon: Newspaper, label: 'Haberler', tab: 'news' },
          { icon: LineChart, label: 'Takip Panoları', tab: 'boards' },
          { icon: Settings2, label: 'Ayarlar', tab: 'settings' },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => setParams({ tab: item.tab }, { replace: true })}
            className={`${APP_SURFACE_PANEL_CLASS} flex items-center gap-3 p-4 text-left transition hover:-translate-y-0.5`}
          >
            <item.icon className="h-5 w-5 text-[var(--muted)]" strokeWidth={2.1} />
            <span className={YF_TEXT_CLASS}>{item.label}</span>
          </button>
        ))}
      </div>

      <p className={`${YF_TEXT_CLASS} text-center text-[12px] opacity-80`}>{data.disclaimer}</p>
      <p className={`${YF_TEXT_CLASS} text-center text-[11px]`}>
        Geliştirme verisi (mock). Canlı sağlayıcı backend üzerinden bağlanacak.{' '}
        <Link to="/finans" className="text-[#2563eb] underline-offset-2 hover:underline">
          Muhasebe Finans Merkezi
        </Link>{' '}
        ayrıdır.
      </p>
    </AppPageShell>
  )
}
