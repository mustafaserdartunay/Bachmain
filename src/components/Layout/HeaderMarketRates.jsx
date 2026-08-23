import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CandlestickChart, TrendingDown, TrendingUp, X } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import { marketRatesLocal } from '../../markets/localStore'

function formatPrice(value) {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatUpdatedAt(iso) {
  try {
    return new Intl.DateTimeFormat('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(new Date(iso))
  } catch {
    return ''
  }
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
            {formatPrice(instrument.price)}
            <span className={`${YF_TEXT_CLASS} ml-1`}>{instrument.unit}</span>
          </p>
        </div>
        <span
          className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${
            up ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {up ? '+' : ''}
          {instrument.changePct.toFixed(2)}%
        </span>
      </div>
      <div className="mt-2 h-[56px] w-full">
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
    </div>
  )
}

export default function HeaderMarketRates() {
  const { open, setOpen, toggle } = useHeaderPopover('market-rates')
  const [tick, setTick] = useState(0)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'end',
    matchWidth: false,
    width: 320,
    offset: 8,
  })

  useEffect(() => {
    if (!open) return undefined
    const id = window.setInterval(() => setTick((n) => n + 1), 15000)
    return () => window.clearInterval(id)
  }, [open])

  const data = useMemo(() => {
    void tick
    return marketRatesLocal()
  }, [tick, open])

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
              className="app-header-dropdown header-popover-panel w-[min(20rem,calc(100vw-1rem))] overflow-hidden"
              data-header-popover="market-rates"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-popover-head !px-3 !py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Döviz & Altın
                  </p>
                  <p className={`${YF_TEXT_CLASS} mt-0.5`}>
                    Güncel · {formatUpdatedAt(data.updatedAt)}
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

              <div className="space-y-2 p-3">
                {data.instruments.map((instrument) => (
                  <RateCard key={instrument.id} instrument={instrument} />
                ))}
                <p className="px-0.5 text-[11px] font-normal leading-snug text-[var(--muted)]">
                  {data.disclaimer}
                </p>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
