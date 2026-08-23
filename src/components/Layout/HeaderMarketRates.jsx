import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CandlestickChart, Loader2, X } from 'lucide-react'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import { YF_TEXT_CLASS, YFB_TEXT_CLASS } from '../../utils/dashboardDesign'
import { pushMarketSeriesPoint } from '../../markets/localStore'

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
    'min-w-0 flex-1 bg-transparent py-0.5 text-[13px] font-normal tabular-nums text-[var(--ink)] outline-none placeholder:text-[var(--muted)]'

  return (
    <div className="mt-1.5 flex items-center gap-1.5 border-t border-[rgba(140,145,165,0.1)] pt-1.5">
      <input
        type="text"
        inputMode="decimal"
        value={foreign}
        onChange={(e) => onForeignChange(e.target.value)}
        className={inputClass}
        aria-label="Döviz veya gram tutarı"
      />
      <span className={`${YF_TEXT_CLASS} shrink-0 text-[12px]`}>{foreignUnit}</span>
      <span className={`${YF_TEXT_CLASS} shrink-0 text-[12px]`}>=</span>
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

function RateRow({ instrument }) {
  const up = instrument.changePct >= 0
  return (
    <div className="py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-2">
        <p className={`${YF_TEXT_CLASS}`}>{instrument.label}</p>
        <div className="flex items-baseline gap-2">
          <p className={`${YFB_TEXT_CLASS} tabular-nums text-[var(--ink)]`}>
            {formatPrice(instrument.price, instrument.id === 'GOLD' ? 2 : 4)}
            <span className={`${YF_TEXT_CLASS} ml-1`}>₺</span>
          </p>
          <span
            className={`text-[12px] font-normal tabular-nums ${
              up ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {up ? '+' : ''}
            {Number(instrument.changePct || 0).toFixed(2)}%
          </span>
        </div>
      </div>
      <TryConverter rate={instrument.price} foreignUnit={instrument.foreignUnit} />
    </div>
  )
}

export default function HeaderMarketRates() {
  const { open, setOpen, toggle } = useHeaderPopover('market-rates')
  const { rates, loading } = useExchangeRates()
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'end',
    matchWidth: false,
    width: 280,
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
  }, [rates.USD, rates.EUR, rates.GOLD, rates.updatedAt])

  const instruments = useMemo(
    () => [
      {
        id: 'USD',
        label: 'Dolar',
        foreignUnit: '$',
        price: rates.USD,
        changePct: rates.change?.USD ?? 0,
      },
      {
        id: 'EUR',
        label: 'Euro',
        foreignUnit: '€',
        price: rates.EUR,
        changePct: rates.change?.EUR ?? 0,
      },
      {
        id: 'GOLD',
        label: 'Gram Altın',
        foreignUnit: 'gr',
        price: rates.GOLD,
        changePct: rates.change?.GOLD ?? 0,
      },
    ],
    [rates],
  )

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
              className="app-header-dropdown header-popover-panel w-[min(17.5rem,calc(100vw-1rem))] overflow-hidden"
              data-header-popover="market-rates"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <p className={`${YF_TEXT_CLASS} flex min-w-0 items-center gap-1.5`}>
                  {loading ? <Loader2 className="h-3 w-3 shrink-0 animate-spin" /> : null}
                  <span className="truncate">{rates.updatedAt || 'Kurlar'}</span>
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-white/45"
                  aria-label="Kapat"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="divide-y divide-[rgba(140,145,165,0.12)] px-3 pb-2">
                {instruments.map((instrument) => (
                  <RateRow key={instrument.id} instrument={instrument} />
                ))}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
