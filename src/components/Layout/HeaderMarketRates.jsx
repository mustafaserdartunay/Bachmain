import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowLeftRight,
  CandlestickChart,
  Loader2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import {
  getMarketSeries,
  MARKET_RATES_DISCLAIMER,
  pushMarketSeriesPoint,
} from '../../markets/localStore'

function formatPrice(value, digits = 2) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number(value) || 0)
}

function parseAmount(raw) {
  const normalized = String(raw || '')
    .trim()
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
  const n = Number(normalized)
  return Number.isFinite(n) ? n : NaN
}

function requestRatesRefresh() {
  try {
    window.dispatchEvent(new Event('bach:exchange-rates-refresh'))
  } catch {
    /* ignore */
  }
}

function TryConverter({ rate, foreignUnit }) {
  const [foreign, setForeign] = useState('1')
  const [tryAmount, setTryAmount] = useState('')
  const [lastEdited, setLastEdited] = useState('foreign')

  useEffect(() => {
    if (!Number.isFinite(rate) || rate <= 0) return
    if (lastEdited === 'foreign') {
      const f = parseAmount(foreign)
      if (!Number.isFinite(f)) return
      setTryAmount(formatPrice(f * rate, 2))
      return
    }
    const t = parseAmount(tryAmount)
    if (!Number.isFinite(t)) return
    setForeign(formatPrice(t / rate, foreignUnit === 'gr' ? 4 : 2))
  }, [rate]) // foreign/try/lastEdited intentionally omitted — only reprice on live rate tick

  function onForeignChange(value) {
    setLastEdited('foreign')
    setForeign(value)
    const f = parseAmount(value)
    if (!Number.isFinite(f) || !rate) {
      setTryAmount('')
      return
    }
    setTryAmount(formatPrice(f * rate, 2))
  }

  function onTryChange(value) {
    setLastEdited('try')
    setTryAmount(value)
    const t = parseAmount(value)
    if (!Number.isFinite(t) || !rate) {
      setForeign('')
      return
    }
    setForeign(formatPrice(t / rate, foreignUnit === 'gr' ? 4 : 2))
  }

  const inputClass =
    'min-w-0 flex-1 rounded-lg border border-[rgba(140,145,165,0.22)] bg-white/50 px-2 py-1.5 text-[13px] font-semibold tabular-nums text-[var(--ink)] outline-none focus:border-[rgba(37,99,235,0.45)]'

  return (
    <div className="mt-2 space-y-1.5 border-t border-[rgba(140,145,165,0.12)] pt-2">
      <p className={`${YF_TEXT_CLASS} text-[12px]`}>TL hesaplama</p>
      <div className="flex items-center gap-1.5">
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={foreign}
            onChange={(e) => onForeignChange(e.target.value)}
            className={inputClass}
            aria-label="Döviz veya gram tutarı"
          />
          <span className={`${YF_TEXT_CLASS} w-7 shrink-0 text-[12px]`}>{foreignUnit}</span>
        </div>
        <button
          type="button"
          onClick={() => setLastEdited((v) => (v === 'foreign' ? 'try' : 'foreign'))}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-white/55"
          title="Yön değiştir"
          aria-label="Hesaplama yönünü değiştir"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
        </button>
        <div className="flex min-w-0 flex-1 items-center gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={tryAmount}
            onChange={(e) => onTryChange(e.target.value)}
            className={inputClass}
            aria-label="Türk lirası tutarı"
          />
          <span className={`${YF_TEXT_CLASS} w-7 shrink-0 text-[12px]`}>₺</span>
        </div>
      </div>
    </div>
  )
}

function RateCard({ instrument }) {
  const up = instrument.changePct >= 0
  const stroke = up ? '#10b981' : '#e11d48'
  const fillId = `mkt-fill-${instrument.id}`

  return (
    <div className="rounded-xl border border-[rgba(140,145,165,0.14)] bg-white/35 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`${YFB_TEXT_CLASS} text-[var(--ink)]`}>{instrument.label}</p>
          <p className="mt-1 text-[15px] font-bold tabular-nums text-[var(--ink)]">
            {formatPrice(instrument.price, instrument.id === 'GOLD' ? 2 : 4)}
            <span className={`${YF_TEXT_CLASS} ml-1`}>₺</span>
          </p>
          {instrument.buy && instrument.sell ? (
            <p className={`${YF_TEXT_CLASS} mt-0.5 text-[11px]`}>
              Alış {formatPrice(instrument.buy, 2)} · Satış {formatPrice(instrument.sell, 2)}
            </p>
          ) : null}
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${
            up ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {up ? '+' : ''}
          {Number(instrument.changePct || 0).toFixed(2)}%
        </span>
      </div>
      <div className="mt-2 h-[52px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={instrument.series} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.28} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area
              type="monotone"
              dataKey="value"
              stroke={stroke}
              strokeWidth={1.75}
              fill={`url(#${fillId})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <TryConverter rate={instrument.price} foreignUnit={instrument.foreignUnit} />
    </div>
  )
}

export default function HeaderMarketRates() {
  const { open, setOpen, toggle } = useHeaderPopover('market-rates')
  const { rates, loading } = useExchangeRates()
  const [seriesTick, setSeriesTick] = useState(0)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'end',
    matchWidth: false,
    width: 360,
    offset: 8,
  })

  useEffect(() => {
    if (!open) return undefined
    requestRatesRefresh()
    const id = window.setInterval(requestRatesRefresh, 30_000)
    return () => window.clearInterval(id)
  }, [open])

  useEffect(() => {
    ;[
      ['USD', rates.USD],
      ['EUR', rates.EUR],
      ['GOLD', rates.GOLD],
    ].forEach(([id, price]) => {
      if (Number.isFinite(price) && price > 0) pushMarketSeriesPoint(id, price)
    })
    setSeriesTick((n) => n + 1)
  }, [rates.USD, rates.EUR, rates.GOLD, rates.updatedAt])

  const instruments = useMemo(() => {
    void seriesTick
    return [
      {
        id: 'USD',
        label: 'Dolar',
        foreignUnit: '$',
        price: rates.USD,
        buy: rates.market?.USD?.buy,
        sell: rates.market?.USD?.sell,
        changePct: rates.change?.USD ?? 0,
        series: getMarketSeries('USD', rates.USD),
      },
      {
        id: 'EUR',
        label: 'Euro',
        foreignUnit: '€',
        price: rates.EUR,
        buy: rates.market?.EUR?.buy,
        sell: rates.market?.EUR?.sell,
        changePct: rates.change?.EUR ?? 0,
        series: getMarketSeries('EUR', rates.EUR),
      },
      {
        id: 'GOLD',
        label: 'Gram Altın',
        foreignUnit: 'gr',
        price: rates.GOLD,
        buy: rates.market?.GOLD?.buy,
        sell: rates.market?.GOLD?.sell,
        changePct: rates.change?.GOLD ?? 0,
        series: getMarketSeries('GOLD', rates.GOLD),
      },
    ]
  }, [rates, seriesTick])

  return (
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        data-header-popover-trigger="market-rates"
        onClick={() => toggle()}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label="Döviz ve altın"
        title="Döviz ve Altın"
        aria-expanded={open}
      >
        <span className="icon-wrap">
          <CandlestickChart className="h-4 w-4 shrink-0" />
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={
                menuStyle ?? {
                  position: 'fixed',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 10000,
                }
              }
              className="app-header-dropdown header-popover-panel w-[min(22.5rem,calc(100vw-1rem))] overflow-hidden"
              data-header-popover="market-rates"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-popover-head !px-3 !py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Döviz & Altın
                  </p>
                  <p className={`${YF_TEXT_CLASS} mt-0.5 flex items-center gap-1.5`}>
                    {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                    Canlı · {rates.updatedAt || '—'}
                    {rates.source ? ` · ${rates.source}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  aria-label="Piyasa penceresini kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[min(70vh,32rem)] space-y-2 overflow-y-auto p-3">
                {instruments.map((instrument) => (
                  <RateCard key={instrument.id} instrument={instrument} />
                ))}
                <p className="px-0.5 text-[11px] font-normal leading-snug text-[var(--muted)]">
                  {MARKET_RATES_DISCLAIMER}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
