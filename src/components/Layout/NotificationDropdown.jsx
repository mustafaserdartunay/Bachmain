import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { Bell, CreditCard } from 'lucide-react'
import { fetchAccountNotifications } from '../../utils/platformApi'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'

const kindIcons = {
  membership: CreditCard,
  trial_extended: CreditCard,
  package_extended: CreditCard,
  account_activated: CreditCard,
  account_suspended: CreditCard,
}

function urgencyBadge(item) {
  if (item.rawKind === 'account_suspended') {
    return { label: 'ASKI', className: 'bg-red-500/20 text-red-300' }
  }
  if (item.rawKind === 'account_activated') {
    return { label: 'AKTİF', className: 'bg-emerald-500/20 text-emerald-300' }
  }
  if (item.rawKind === 'trial_extended' || item.rawKind === 'package_extended') {
    return { label: 'UZATMA', className: 'bg-sky-500/20 text-sky-300' }
  }
  return { label: 'YÖNETİCİ', className: 'bg-sky-500/20 text-sky-300' }
}

function mapAdminNotifications(items) {
  if (!Array.isArray(items)) return []
  return items
    .map((n) => ({
      id: n.id || `admin-${n.createdAt}`,
      kind: 'membership',
      type: 'membership',
      rawKind: n.kind || n.type,
      entityId: n.id,
      title: n.title || 'Yönetici bildirimi',
      subtitle: n.body || '',
      detail: n.endDate ? `Bitiş: ${n.endDate}` : '',
      date: String(n.createdAt || '').slice(0, 10),
      sortAt: n.sortAt || n.createdAt || '',
      urgency: 'membership',
      link: n.link || '/hesap/lisans',
    }))
    .sort((a, b) => String(b.sortAt || b.date || '').localeCompare(String(a.sortAt || a.date || '')))
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const { open, setOpen, toggle } = useHeaderPopover('notifications')
  const [adminItems, setAdminItems] = useState([])
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    width: 384,
    offset: 8,
  })

  useEffect(() => {
    let cancelled = false
    async function loadAdmin() {
      try {
        const rows = await fetchAccountNotifications()
        if (!cancelled) setAdminItems(mapAdminNotifications(rows))
      } catch {
        if (!cancelled) setAdminItems([])
      }
    }
    loadAdmin()
    const interval = setInterval(loadAdmin, 60000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const notifications = useMemo(() => adminItems, [adminItems])
  const count = notifications.length
  const preview = notifications

  function openItem(item) {
    setOpen(false)
    navigate(item?.link || '/hesap/lisans')
  }

  function openHub() {
    setOpen(false)
    navigate('/hesap/lisans')
  }

  return (
    <div className="relative flex items-center" ref={anchorRef} onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        data-header-popover-trigger="notifications"
        onClick={toggle}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label="Bildirimler"
      >
        <span className="icon-wrap">
          <Bell className="h-4 w-4 shrink-0" />
        </span>
        {count > 0 && (
          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[11px] font-black text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && createPortal(
        <div
          ref={menuRef}
          style={menuStyle ?? { position: 'fixed', visibility: 'hidden', pointerEvents: 'none', zIndex: 10000 }}
          className="app-header-dropdown w-96 overflow-hidden"
          data-header-popover="notifications"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="border-b border-[rgba(140,145,165,0.14)] px-4 py-3">
            <p className="text-sm font-extrabold text-[var(--ink)]">Bildirimler</p>
            <p className="text-[13px] font-semibold text-[var(--muted)]">
              Yalnızca yöneticiden gelen üyelik ve hesap bildirimleri
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {preview.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-bold text-[var(--ink)]">Bildirim yok</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  Yöneticiden yeni bildirim bulunmuyor.
                </p>
              </div>
            ) : (
              preview.map((item) => {
                const Icon = kindIcons[item.rawKind] || kindIcons[item.kind] || Bell
                const badge = urgencyBadge(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className="mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-white/55"
                  >
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${badge.className}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-xs font-black text-[var(--ink)]">{item.title}</span>
                        <span className={`rounded px-1.5 py-0.5 text-[11px] font-black uppercase ${badge.className}`}>
                          {badge.label}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[12px] font-bold text-[var(--muted)]">{item.subtitle}</span>
                      {item.detail && (
                        <span className="mt-0.5 block truncate text-[12px] font-medium text-[var(--muted)]">{item.detail}</span>
                      )}
                    </span>
                  </button>
                )
              })
            )}
          </div>

          {count > 0 && (
            <div className="border-t border-[rgba(140,145,165,0.14)] p-2">
              <button
                type="button"
                onClick={openHub}
                className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wide text-[var(--purple2)] transition-colors hover:bg-white/55"
              >
                {`Lisans sayfasına git (${count})`}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
