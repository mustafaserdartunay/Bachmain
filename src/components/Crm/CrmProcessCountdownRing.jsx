import { useEffect, useMemo, useState } from 'react'

const SIZE = 72
const STROKE = 3.5
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function formatRemainingLabel(ms) {
  if (ms <= 0) return { primary: '00:00', secondary: 'bitti' }

  const totalSeconds = Math.max(0, Math.ceil(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (days > 0) {
    return { primary: `${days}g ${hours}s`, secondary: 'kaldı' }
  }
  if (hours > 0) {
    return {
      primary: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`,
      secondary: 'saat',
    }
  }
  return {
    primary: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    secondary: 'dk:sn',
  }
}

export default function CrmProcessCountdownRing({ window, completed = false }) {
  const [now, setNow] = useState(() => Date.now())

  const state = useMemo(() => {
    if (!window) {
      return { primary: '—', secondary: '', remainingRatio: 0, tickMs: 60000 }
    }

    const { start, end } = window
    const total = end.getTime() - start.getTime()
    const remaining = end.getTime() - now
    const remainingRatio = Math.min(1, Math.max(0, remaining / total))

    if (completed) {
      return {
        primary: 'Bitti',
        secondary: '✓',
        remainingRatio: 1,
        tickMs: 60000,
      }
    }

    if (now < start.getTime()) {
      const { primary, secondary } = formatRemainingLabel(start.getTime() - now)
      return {
        primary,
        secondary: 'başlayacak',
        remainingRatio: 1,
        tickMs: remaining < 3600000 ? 1000 : 30000,
      }
    }

    if (remaining <= 0) {
      return {
        primary: 'Gecikti',
        secondary: '',
        remainingRatio: 1,
        tickMs: 60000,
      }
    }

    const { primary, secondary } = formatRemainingLabel(remaining)
    const urgent = remaining < 86400000
    const tickMs = remaining < 3600000 ? 1000 : urgent ? 10000 : 30000

    return {
      primary,
      secondary,
      remainingRatio,
      tickMs,
    }
  }, [window, now, completed])

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), state.tickMs)
    return () => clearInterval(timer)
  }, [state.tickMs])

  const dashOffset = CIRCUMFERENCE * (1 - state.remainingRatio)
  const isOverdue = state.primary === 'Gecikti'
  const ringClassName = [
    'crm-countdown-ring',
    'relative flex h-[72px] w-[72px] shrink-0 items-center justify-center',
    completed ? 'crm-countdown-ring--completed' : '',
    isOverdue ? 'crm-countdown-ring--overdue' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={ringClassName}
      title={window ? `${window.start.toLocaleString('tr-TR')} → ${window.end.toLocaleString('tr-TR')}` : ''}
    >
      <svg width={SIZE} height={SIZE} className="absolute inset-0 -rotate-90" aria-hidden>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          className="crm-countdown-ring__track"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          className="crm-countdown-ring__progress transition-[stroke-dashoffset] duration-1000 ease-linear"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
        />
      </svg>

      <div className="crm-countdown-ring__inner absolute inset-[8px] flex flex-col items-center justify-center rounded-full leading-none">
        <span className="crm-countdown-ring__primary text-[11px] font-black tabular-nums tracking-tight">
          {state.primary}
        </span>
        {state.secondary && (
          <span className="crm-countdown-ring__secondary mt-0.5 text-[7px] font-bold uppercase tracking-wide">
            {state.secondary}
          </span>
        )}
      </div>
    </div>
  )
}
