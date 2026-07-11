import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

function isLicenseExpired(user) {
  if (!user) return false
  if (user.status === 'suspended' || user.status === 'cancelled') return true
  if (!user.licenseExpiry) return false
  const today = new Date().toISOString().slice(0, 10)
  return user.licenseExpiry < today
}

export default function RequireAuth({ children }) {
  const { isAuthenticated, bootstrapped, loading, user } = useAuth()
  const location = useLocation()

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

  if (isLicenseExpired(user) && location.pathname !== '/hesap/lisans') {
    return <Navigate to="/hesap/lisans" replace state={{ reason: 'license_expired' }} />
  }

  return children
}
