import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { roleAllowsClient } from '../utils/rolePermissions'

/**
 * Client-side route gate mirroring API role matrix.
 * Always pair with server-side requirePermission — UI alone is not security.
 */
export default function RequirePermission({ anyOf = [], children, fallback = '/' }) {
  const { user } = useAuth()
  const role = user?.role || user?.membershipRole || 'viewer'
  const perms = Array.isArray(user?.perms) ? user.perms : null

  if (anyOf.length === 0) return children

  const ok = perms?.length
    ? anyOf.some((code) => perms.includes(code) || perms.includes('*'))
    : roleAllowsClient(role, ...anyOf)

  if (!ok) {
    return <Navigate to={fallback} replace state={{ reason: 'forbidden', need: anyOf }} />
  }
  return children
}
