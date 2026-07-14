import { Link } from 'react-router-dom'

const TRIAL_STATUSES = new Set(['trial', 'trialing'])

export function computeRemainingDays(user) {
  if (!user) return null
  if (typeof user.remainingDays === 'number' && Number.isFinite(user.remainingDays)) {
    return user.remainingDays
  }
  const endRaw = user.trialEnd || user.trialEndsAt || user.licenseExpiry
  if (!endRaw) return null
  const end = new Date(endRaw)
  if (Number.isNaN(end.getTime())) return null
  const endMs = new Date(end)
  endMs.setHours(23, 59, 59, 999)
  return Math.ceil((endMs.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function isTrialActive(user) {
  if (!user) return false
  return TRIAL_STATUSES.has(user.status)
}

/**
 * Apple-style glass trial countdown bar (fixed top, 36px).
 * Props: remainingDays (0–7), trialEnd optional, status optional.
 */
export default function TrialBanner({ remainingDays, trialEnd, status = 'trial' }) {
  const days =
    typeof remainingDays === 'number' && Number.isFinite(remainingDays)
      ? remainingDays
      : trialEnd
        ? computeRemainingDays({ trialEnd, remainingDays })
        : null

  if (days === null || days < 0) return null
  if (!TRIAL_STATUSES.has(status)) return null

  const label =
    days === 0
      ? 'Ücretsiz deneme: son gün'
      : `Ücretsiz deneme: ${days} gün kaldı`

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[80] flex h-9 items-center justify-center border-b border-white/40 bg-white/55 px-3 text-[#0b1f3a] shadow-[0_1px_0_rgba(11,31,58,0.06)] backdrop-blur-xl backdrop-saturate-150"
      style={{ height: 36 }}
    >
      <div className="flex max-w-5xl items-center gap-3 text-[13px] leading-none tracking-tight">
        <span className="font-medium tabular-nums">{label}</span>
        {trialEnd ? (
          <span className="hidden text-slate-500 sm:inline">
            · {new Date(trialEnd).toLocaleDateString('tr-TR')}
          </span>
        ) : null}
        <Link
          to="/hesap/lisans"
          className="font-semibold text-[#1d4ed8] transition hover:text-[#1e40af] hover:underline"
        >
          Yükselt
        </Link>
      </div>
    </div>
  )
}
