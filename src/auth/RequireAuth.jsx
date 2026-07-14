import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { computeRemainingDays, isTrialActive } from '../components/TrialBanner'

function isTrialExpired(user) {
  if (!user) return false
  if (user.status === 'expired') return true
  if (user.trialEnded === true) return true
  const days = computeRemainingDays(user)
  if (typeof days === 'number' && days < 0) return true
  if (isTrialActive(user) && user.licenseExpiry) {
    const today = new Date().toISOString().slice(0, 10)
    return user.licenseExpiry < today
  }
  return false
}

function isSuspendedLicense(user) {
  if (!user) return false
  return user.status === 'suspended' || user.status === 'cancelled'
}

function isPaidLicenseExpired(user) {
  if (!user || isTrialActive(user) || user.status === 'expired') return false
  if (!user.licenseExpiry) return false
  const today = new Date().toISOString().slice(0, 10)
  return user.licenseExpiry < today
}

export default function RequireAuth({ children }) {
  const { isAuthenticated, bootstrapped, loading, user } = useAuth()
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
    return <Navigate to="/giris" replace state={{ from: location.pathname }} />
  }

  // Trial expiry → full-screen /deneme-bitti (not license page)
  if (isTrialExpired(user)) {
    if (path !== '/deneme-bitti') {
      return <Navigate to="/deneme-bitti" replace state={{ reason: 'trial_expired' }} />
    }
    return children
  }

  // Suspended / cancelled / paid license expiry → license page
  if ((isSuspendedLicense(user) || isPaidLicenseExpired(user)) && path !== '/hesap/lisans') {
    return <Navigate to="/hesap/lisans" replace state={{ reason: 'license_expired' }} />
  }

  // First-run onboarding (allow /kurulum itself to avoid loops)
  if (user?.onboardingCompleted === false && path !== '/kurulum') {
    return <Navigate to="/kurulum" replace state={{ reason: 'onboarding' }} />
  }

  return children
}
