import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  CheckSquare,
  StickyNote,
} from 'lucide-react'
import { getCrmNotifications } from '../../utils/crmStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'

const kindIcons = {
  task: CheckSquare,
  appointment: Calendar,
  note: StickyNote,
}

function urgencyBadge(item) {
  if (item.urgency === 'overdue') return { label: 'GECİKTİ', className: 'bg-red-500/20 text-red-300' }
  if (item.urgency === 'now') return { label: 'ŞİMDİ', className: 'bg-orange-500/20 text-orange-300' }
  return { label: 'BUGÜN', className: 'bg-blue-500/20 text-blue-300' }
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const { open, setOpen, toggle } = useHeaderPopover('notifications')
  const [notifications, setNotifications] = useState(() => getCrmNotifications())
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    width: 384,
    offset: 8,
  })

  useEffect(() => {
    function refresh() {
      setNotifications(getCrmNotifications())
    }
    window.addEventListener('bach:crm-updated', refresh)
    const interval = setInterval(refresh, 60000)
    return () => {
      window.removeEventListener('bach:crm-updated', refresh)
      clearInterval(interval)
    }
  }, [])

  const count = notifications.length
  const preview = useMemo(() => notifications.slice(0, 8), [notifications])

  function openCrm() {
    setOpen(false)
    navigate('/crm')
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
            <p className="text-sm font-extrabold text-[var(--ink)]">CRM Bildirimleri</p>
            <p className="text-[13px] font-semibold text-[var(--muted)]">
              Zamanı gelen görevler, randevular ve ajanda notları
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {preview.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-bold text-[var(--ink)]">Bildirim yok</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">Bugün veya geciken CRM kaydı bulunmuyor.</p>
              </div>
            ) : (
              preview.map((item) => {
                const Icon = kindIcons[item.kind] || Bell
                const badge = urgencyBadge(item)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={openCrm}
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
                onClick={openCrm}
                className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-black uppercase tracking-wide text-[var(--purple2)] transition-colors hover:bg-white/55"
              >
                CRM merkezine git ({count})
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
