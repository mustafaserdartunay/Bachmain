import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CandlestickChart, Loader2, X } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import { getMarketSeries, pushMarketSeriesPoint } from '../../markets/localStore'

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

function MiniSpark({ id, series, up }) {
  const stroke = up ? '#10b981' : '#e11d48'
  const fillId = `mkt-sp-${id}`
  return (
    <div className="h-9 w-[4.5rem] shrink-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.32} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis domain={['dataMin', 'dataMax']} hide />
          <Area
            type="monotone"
            dataKey="value"
            stroke={stroke}
            strokeWidth={1.5}
            fill={`url(#${fillId})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
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
    'min-w-0 flex-1 bg-transparent text-[13px] font-semibold tabular-nums text-[var(--ink)] outline-none'

  return (
    <div className="mt-2 flex items-center gap-1.5 rounded-xl bg-[rgba(255,255,255,0.42)] px-2.5 py-1.5 ring-1 ring-[rgba(255,255,255,0.55)]">
      <input
        type="text"
        inputMode="decimal"
        value={foreign}
        onChange={(e) => onForeignChange(e.target.value)}
        className={inputClass}
        aria-label="Döviz veya gram tutarı"
      />
      <span className={`${YF_TEXT_CLASS} shrink-0 text-[12px]`}>{foreignUnit}</span>
      <span className={`${YF_TEXT_CLASS} shrink-0 opacity-50`}>→</span>
      <input
        type="text"
        inputMode="decimal"
        value={tryAmount}
        onChange={(e) => onTryChange(e.target.value)}
        className={inputClass}
        aria-label="Türk lirası tutarı"
      />
      <span className={`${YF_TEXT_CLASS} shrink-0 text-[12px]`}>₺</span>
    </div>
  )
}

function RateCard({ instrument }) {
  const up = instrument.changePct >= 0
  return (
    <div className="rounded-2xl bg-[rgba(255,255,255,0.28)] p-3 ring-1 ring-[rgba(255,255,255,0.5)]">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`${YF_TEXT_CLASS}`}>{instrument.label}</p>
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                up ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {up ? '+' : ''}
              {Number(instrument.changePct || 0).toFixed(2)}%
            </span>
          </div>
          <p className={`${YFB_TEXT_CLASS} mt-0.5 text-[15px] tabular-nums text-[var(--ink)]`}>
            {formatPrice(instrument.price, instrument.id === 'GOLD' ? 2 : 4)}
            <span className={`${YF_TEXT_CLASS} ml-1`}>₺</span>
          </p>
        </div>
        <MiniSpark id={instrument.id} series={instrument.series} up={up} />
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
    width: 300,
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
        changePct: rates.change?.USD ?? 0,
        series: getMarketSeries('USD', rates.USD),
      },
      {
        id: 'EUR',
        label: 'Euro',
        foreignUnit: '€',
        price: rates.EUR,
        changePct: rates.change?.EUR ?? 0,
        series: getMarketSeries('EUR', rates.EUR),
      },
      {
        id: 'GOLD',
        label: 'Gram Altın',
        foreignUnit: 'gr',
        price: rates.GOLD,
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
              className="app-header-dropdown header-popover-panel w-[min(18.75rem,calc(100vw-1rem))] overflow-hidden"
              data-header-popover="market-rates"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-popover-head !px-3 !py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Kurlar
                  </p>
                  <p className={`${YF_TEXT_CLASS} mt-0.5 flex items-center gap-1.5`}>
                    {loading ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : null}
                    <span className="truncate">{rates.updatedAt || '—'}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  aria-label="Kapat"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 p-2.5">
                {instruments.map((instrument) => (
                  <RateCard key={instrument.id} instrument={instrument} />
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
