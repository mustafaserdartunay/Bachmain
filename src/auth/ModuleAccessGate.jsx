import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Eye, ShieldOff } from 'lucide-react'
import { useAuth } from '../../auth/AuthContext'
import { canEditPath, canViewPath, moduleCodeForPath } from '../../utils/moduleAccess'

export default function ModuleAccessGate({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const allowed = canViewPath(user, pathname)
  const editable = canEditPath(user, pathname)

  useEffect(() => {
    if (allowed && editable) return undefined
    if (!allowed) return undefined
    function onSubmit(event) {
      if (event.target?.closest?.('[data-allow-readonly]')) return
      event.preventDefault()
      event.stopPropagation()
      window.alert('Bu modül salt okunur. Değişiklik yetkiniz yok.')
    }
    document.addEventListener('submit', onSubmit, true)
    return () => document.removeEventListener('submit', onSubmit, true)
  }, [allowed, editable, pathname])

  if (!allowed) {
    const code = moduleCodeForPath(pathname)
    return (
      <div className="mx-auto max-w-lg space-y-4 p-6">
        <div className="card space-y-3 p-6 text-center">
          <ShieldOff className="mx-auto h-8 w-8 text-rose-300" />
          <h1 className="text-lg font-black text-white">Bu modüle erişiminiz yok</h1>
          <p className="text-sm text-gray-400">
            Yönetici bu alan için yetki tanımlamadı{code ? ` (${code})` : ''}.
          </p>
          <Link to="/" className="btn-primary inline-flex px-4 py-2 text-sm">
            Güncel Duruma dön
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {!editable ? (
        <div
          data-allow-readonly
          className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100"
        >
          <Eye className="h-4 w-4 shrink-0" />
          Salt okunur modül — kayıt ve silme işlemleri kapalı.
        </div>
      ) : null}
      {children}
    </>
  )
}
