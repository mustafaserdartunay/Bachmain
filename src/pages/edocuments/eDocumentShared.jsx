import { NavLink } from 'react-router-dom'
import { eDocumentsSubMenus } from '../../data/eDocumentsMenu'

export function formatEdocError(err) {
  const code = err?.code || ''
  const message = String(err?.message || '')
  if (err?.status === 401 || code === 'UNAUTHORIZED') {
    return message.includes('Nilvera')
      ? message
      : 'Oturum gerekli. Uygulama.bachmain.com üzerinden tekrar giriş yapın.'
  }
  if (code === 'NO_API' || message === 'NO_API') {
    return 'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Platform API bağlı değil. Canlıda uygulama.bachmain.com üzerinden yonetim API’sine gider; yerelde VITE_PLATFORM_API_URL gerekir.'
  }
  if (code === 'FEATURE_LOCKED') return 'E-Fatura paketinizde etkin değil.'
  if (code === 'CONNECTION_FAILED' || code === 'INVALID_API_KEY') return message
  if (code === 'NILVERA_NOT_CONFIGURED' || message.includes('NİLVERA MANUEL')) {
    return message
  }
  return message || 'E-belge işlemi başarısız.'
}

export function docField(row, camel, snake) {
  if (!row) return ''
  return row[camel] ?? row[snake] ?? ''
}

export function EDocumentsSubnav() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {eDocumentsSubMenus.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/e-belgeler'}
          className={({ isActive }) =>
            `inline-flex min-h-10 items-center rounded-xl border px-2.5 text-[11px] font-black uppercase tracking-wide ${
              isActive
                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                : 'border-dark-500/30 text-[var(--muted)] hover:border-dark-500/60'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  )
}

export function EdocAlert({ tone = 'rose', children }) {
  if (!children) return null
  const cls =
    tone === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : tone === 'amber'
        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
  return (
    <div className={`mb-4 whitespace-pre-wrap rounded-xl border px-3 py-2 text-sm ${cls}`}>
      {children}
    </div>
  )
}

export function connectionStatusLabel(connection) {
  if (!connection) return 'Nilvera bağlı değil'
  if (connection.status === 'connected') return `Bağlı · ${connection.environment || 'TEST'}`
  if (connection.status === 'error') return `Hata · ${connection.lastError || 'test başarısız'}`
  if (connection.hasApiKey) return `Anahtar kayıtlı · ${connection.environment || 'TEST'}`
  return 'Nilvera bağlı değil'
}
