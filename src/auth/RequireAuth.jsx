import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { computeRemainingDays, isTrialActive } from '../components/TrialBanner'
import LegalConsentGate from '../components/Legal/LegalConsentGate'
import {
  isLocalDevHost,
  MARKETING_LOGIN_URL,
  redirectToMarketingLogin,
} from '../utils/marketingLogin'

const BILLING_PATHS = new Set([
  '/hesap/lisans',
  '/deneme-bitti',
  '/profil/paketim',
  '/profil/paket-satin-al',
  '/profil/odeme',
  '/paketler',
  '/kurulum',
])

function isTrialExpired(user) {
  if (!user) return false
  if (user.subscriptionStatus === 'grace') return false
  if (user.subscriptionStatus === 'expired' && (user.status === 'trial' || isTrialActive(user)))
    return true
  if (user.status === 'expired' && isTrialActive({ status: 'trial', ...user })) {
    // paid expired handled separately
  }
  if (
    user.status === 'expired' &&
    (user.subscriptionStatus === 'trialing' || !user.subscriptionStatus)
  )
    return true
  if (user.trialEnded === true) return true
  const days = computeRemainingDays(user)
  if (isTrialActive(user) && typeof days === 'number' && days < 0) return true
  if (isTrialActive(user) && user.licenseExpiry) {
    const today = new Date().toISOString().slice(0, 10)
    return user.licenseExpiry < today && user.subscriptionStatus !== 'grace'
  }
  return false
}

function isSuspendedLicense(user) {
  if (!user) return false
  return user.status === 'suspended' || user.status === 'cancelled'
}

function isSubscriptionExpired(user) {
  if (!user) return false
  if (user.subscriptionStatus === 'grace') return false
  if (user.subscriptionStatus === 'expired') return true
  if (user.status === 'expired' && !isTrialActive(user)) return true
  return false
}

function isPaidLicenseExpired(user) {
  if (!user || isTrialActive(user) || user.status === 'expired') return false
  if (user.subscriptionStatus === 'grace' || user.subscriptionStatus === 'expired') return false
  if (!user.licenseExpiry) return false
  const today = new Date().toISOString().slice(0, 10)
  return user.licenseExpiry < today
}

function MarketingLoginRedirect({ from }) {
  useEffect(() => {
    redirectToMarketingLogin(from)
  }, [from])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center text-sm text-slate-600">
      <p>Giriş sayfasına yönlendiriliyorsunuz…</p>
      <a className="font-semibold text-[#1d4ed8] hover:underline" href={MARKETING_LOGIN_URL}>
        Giriş Yap
      </a>
    </div>
  )
}

export default function RequireAuth({ children }) {
  const { isAuthenticated, bootstrapped, loading, user, refreshUser } = useAuth()
  const location = useLocation()
  const path = location.pathname

  if (!bootstrapped || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Oturum kontrol ediliyor…
      </div>
    )
  }

  if (!isAuthenticated) {
    if (!isLocalDevHost()) {
      return <MarketingLoginRedirect from={location.pathname} />
    }
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }

  if (isTrialExpired(user)) {
    if (path !== '/deneme-bitti' && !BILLING_PATHS.has(path)) {
      return <Navigate to="/deneme-bitti" replace state={{ reason: 'trial_expired' }} />
    }
    return children
  }

  if (isSubscriptionExpired(user) && !BILLING_PATHS.has(path)) {
    return <Navigate to="/hesap/lisans" replace state={{ reason: 'subscription_expired' }} />
  }

  if (
    (isSuspendedLicense(user) || isPaidLicenseExpired(user)) &&
    path !== '/hesap/lisans' &&
    !BILLING_PATHS.has(path)
  ) {
    return <Navigate to="/hesap/lisans" replace state={{ reason: 'license_expired' }} />
  }

  if (user?.onboardingCompleted === false && path !== '/kurulum') {
    return <Navigate to="/kurulum" replace state={{ reason: 'onboarding' }} />
  }

  return (
    <LegalConsentGate
      user={user}
      onAccepted={async () => {
        try {
          await refreshUser?.()
        } catch {
          /* ignore */
        }
      }}
    >
      {children}
    </LegalConsentGate>
  )
}
