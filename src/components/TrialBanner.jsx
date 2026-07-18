import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

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
 * Trial / renewal / grace notice — footer of the left sidebar.
 */
export default function TrialBanner({
  remainingDays: remainingDaysProp,
  trialEnd: trialEndProp,
  status: statusProp,
  subscriptionStatus: subscriptionStatusProp,
  collapsed = false,
}) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const hideOnPackages = pathname === '/paketler' || pathname.startsWith('/paketler/')

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

  const remainingDays =
    typeof remainingDaysProp === 'number'
      ? remainingDaysProp
      : computeRemainingDays(user)
  const trialEnd =
    trialEndProp || user?.trialEnd || user?.trialEndsAt || user?.licenseExpiry || user?.graceUntil
  const status = statusProp || user?.status || 'trial'
  const subscriptionStatus = subscriptionStatusProp || user?.subscriptionStatus

  if (hideOnPackages || !shouldShowTrialBanner(user || { status, subscriptionStatus, remainingDays, trialEnd })) {
    return null
  }

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

  if (collapsed) {
    if (hidden) return null
    return (
      <div className={`trial-banner-sidebar is-collapsed ${urgent ? 'is-urgent' : ''}`}>
        <Link to={ctaTo} className="trial-banner-sidebar-dot" title={`${cta} · deneme`} aria-label={cta}>
          !
        </Link>
      </div>
    )
  }

  if (hidden) {
    return (
      <div className="trial-banner-sidebar is-compact">
        <button
          type="button"
          onClick={toggleHidden}
          className="trial-banner-sidebar-reveal"
          aria-label="Deneme uyarısını göster"
          title="Deneme uyarısını göster"
        >
          <ChevronUp className="h-3.5 w-3.5" />
          <span>Deneme bilgisi</span>
        </button>
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`trial-banner-sidebar is-minimal ${urgent ? 'is-urgent' : ''}`}
    >
      <div className="trial-banner-sidebar-row">
        <div className="trial-banner-sidebar-copy">
          {mode === 'grace' ? (
            <>
              <span className="font-semibold">Ek süre</span>
              {days !== null ? (
                <>
                  {' '}
                  <DaysPart days={days} urgent />
                </>
              ) : null}
            </>
          ) : null}

          {mode === 'trial' ? (
            <>
              <DaysPart days={days} urgent={urgent} />
              {days === 0 ? null : ' kaldı'}
              {trialEnd ? (
                <span className="trial-banner-date">
                  {' '}
                  · {new Date(trialEnd).toLocaleDateString('tr-TR')}
                </span>
              ) : null}
            </>
          ) : null}

          {mode === 'renew' ? (
            <>
              <span className="font-semibold">Paket</span>{' '}
              <DaysPart days={days} urgent /> kaldı
            </>
          ) : null}
        </div>
        <div className="trial-banner-sidebar-actions">
          <Link to={ctaTo} className="trial-banner-cta">
            <span>{cta}</span>
          </Link>
          <button
            type="button"
            onClick={toggleHidden}
            className="trial-banner-sidebar-hide"
            aria-label="Deneme uyarısını gizle"
            title="Gizle"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
