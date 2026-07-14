import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'

const TRIAL_STATUSES = new Set(['trial', 'trialing'])
const BANNER_HIDDEN_KEY = 'bach-trial-banner-hidden'
/** Kalan gün bu eşik ve altında kırmızı yanıp söner */
const URGENT_DAYS = 7

export function computeRemainingDays(user) {
  if (!user) return null
  if (typeof user.remainingDays === 'number' && Number.isFinite(user.remainingDays)) {
    return user.remainingDays
  }
  const endRaw = user.graceUntil || user.trialEnd || user.trialEndsAt || user.licenseExpiry
  if (!endRaw) return null
  const end = new Date(endRaw)
  if (Number.isNaN(end.getTime())) return null
  const endMs = new Date(end)
  endMs.setHours(23, 59, 59, 999)
  return Math.ceil((endMs.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
}

export function isTrialActive(user) {
  if (!user) return false
  return TRIAL_STATUSES.has(user.status) || user.subscriptionStatus === 'trialing'
}

export function shouldShowTrialBanner(user) {
  const remainingDays = computeRemainingDays(user)
  return (
    (isTrialActive(user) && typeof remainingDays === 'number' && remainingDays >= 0) ||
    user?.subscriptionStatus === 'grace' ||
    (typeof remainingDays === 'number' && remainingDays >= 0 && remainingDays <= 7 && !isTrialActive(user))
  )
}

function DaysPart({ days, urgent }) {
  if (days === null || days < 0) return null
  if (days === 0) {
    return <span className={urgent ? 'trial-banner-days is-urgent' : 'trial-banner-days'}>son gün</span>
  }
  return (
    <span className={urgent ? 'trial-banner-days is-urgent' : 'trial-banner-days'}>
      {days} gün
    </span>
  )
}

function resolveBanner(status, subscriptionStatus, days) {
  const sub = subscriptionStatus || status
  if (sub === 'grace') {
    return { mode: 'grace', ctaTo: '/paketler', cta: 'Yenile' }
  }
  if (TRIAL_STATUSES.has(status) || sub === 'trialing') {
    if (days === null || days < 0) return null
    return { mode: 'trial', ctaTo: '/paketler', cta: 'Yükselt' }
  }
  if (typeof days === 'number' && days >= 0 && days <= 7) {
    return { mode: 'renew', ctaTo: '/paketler', cta: 'Yenile' }
  }
  return null
}

/**
 * Trial / renewal / grace strip — sits in the content rail (shared shell gaps), not over sidebars.
 */
export default function TrialBanner({
  remainingDays,
  trialEnd,
  status = 'trial',
  subscriptionStatus,
}) {
  const [hidden, setHidden] = useState(() => {
    try {
      return sessionStorage.getItem(BANNER_HIDDEN_KEY) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      if (hidden) sessionStorage.setItem(BANNER_HIDDEN_KEY, '1')
      else sessionStorage.removeItem(BANNER_HIDDEN_KEY)
    } catch {
      /* ignore */
    }
  }, [hidden])

  const days =
    typeof remainingDays === 'number' && Number.isFinite(remainingDays)
      ? remainingDays
      : trialEnd
        ? computeRemainingDays({ trialEnd, remainingDays })
        : null

  const resolved = resolveBanner(status, subscriptionStatus, days)
  if (!resolved) return null

  const { mode, ctaTo, cta } = resolved
  const urgent = typeof days === 'number' && days >= 0 && days <= URGENT_DAYS

  function toggleHidden() {
    setHidden((v) => !v)
  }

  if (hidden) {
    return (
      <div className="trial-banner-reveal">
        <button
          type="button"
          onClick={toggleHidden}
          className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 items-center justify-center rounded-xl"
          aria-label="Deneme uyarısını göster"
          title="Deneme uyarısını göster"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`trial-banner app-header-banner ${urgent ? 'is-urgent' : ''}`}
    >
      <div className="trial-banner-inner">
        <div className="trial-banner-copy">
          {mode === 'grace' ? (
            <>
              <span className="font-medium">Aboneliğiniz sona erdi.</span>
              {days !== null ? (
                <>
                  {' '}
                  <DaysPart days={days} urgent />
                  {' '}ek kullanım süreniz kaldı.
                </>
              ) : (
                <span> Ek kullanım süreniz devam ediyor.</span>
              )}
              <span> Lütfen aboneliğinizi yenileyin.</span>
            </>
          ) : null}

          {mode === 'trial' ? (
            <>
              <span className="font-medium">Ücretsiz deneme:</span>{' '}
              <DaysPart days={days} urgent={urgent} />
              {days === 0 ? null : ' kaldı'}
              {trialEnd ? (
                <span className="trial-banner-date">
                  · {new Date(trialEnd).toLocaleDateString('tr-TR')}
                </span>
              ) : null}
            </>
          ) : null}

          {mode === 'renew' ? (
            <>
              <span className="font-medium">Paketinizin bitmesine</span>{' '}
              <DaysPart days={days} urgent /> kaldı.
              <span> Kesintisiz kullanım için aboneliğinizi yenileyebilirsiniz.</span>
            </>
          ) : null}

          <Link to={ctaTo} className="trial-banner-cta">
            {cta}
          </Link>
        </div>

        <button
          type="button"
          onClick={toggleHidden}
          className="glass-sidebar-toggle glass-sidebar-collapse trial-banner-hide flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
          aria-label="Deneme uyarısını gizle"
          title="Deneme uyarısını gizle"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
