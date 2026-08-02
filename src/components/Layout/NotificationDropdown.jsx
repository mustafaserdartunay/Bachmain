import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Calendar,
  CheckSquare,
  CreditCard,
  MessageSquare,
  StickyNote,
} from 'lucide-react'
import { getCrmNotifications } from '../../utils/crmStore'
import { getB2bTicketNotifications } from '../../utils/b2bPortalStore'
import { fetchAccountNotifications } from '../../utils/platformApi'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'

const kindIcons = {
  task: CheckSquare,
  appointment: Calendar,
  note: StickyNote,
  ticket: MessageSquare,
  'ticket-reply': MessageSquare,
  membership: CreditCard,
  trial_extended: CreditCard,
  package_extended: CreditCard,
  account_activated: CreditCard,
  account_suspended: CreditCard,
}

const urgencyRank = { overdue: 0, now: 1, today: 2, membership: 2.5, planned: 3 }

function urgencyBadge(item) {
  if (item.kind === 'ticket') return { label: 'TICKET', className: 'bg-violet-500/20 text-violet-300' }
  if (item.kind === 'ticket-reply') return { label: 'CEVAP', className: 'bg-emerald-500/20 text-emerald-300' }
  if (item.kind === 'membership' || item.type === 'membership') {
    if (item.rawKind === 'account_suspended') {
      return { label: 'ASKI', className: 'bg-red-500/20 text-red-300' }
    }
    if (item.rawKind === 'account_activated') {
      return { label: 'AKTİF', className: 'bg-emerald-500/20 text-emerald-300' }
    }
    return { label: 'ÜYELİK', className: 'bg-sky-500/20 text-sky-300' }
  }
  if (item.urgency === 'overdue') return { label: 'GECİKTİ', className: 'bg-red-500/20 text-red-300' }
  if (item.urgency === 'now') return { label: 'ŞİMDİ', className: 'bg-orange-500/20 text-orange-300' }
  if (item.urgency === 'planned') return { label: 'PLANLI', className: 'bg-slate-500/20 text-slate-300' }
  return { label: 'BUGÜN', className: 'bg-blue-500/20 text-blue-300' }
}

function mapMembershipNotifications(items) {
  if (!Array.isArray(items)) return []
  return items.map((n) => ({
    id: n.id || `membership-${n.createdAt}`,
    kind: 'membership',
    type: 'membership',
    rawKind: n.kind || n.type,
    entityId: n.id,
    title: n.title || 'Üyelik bildirimi',
    subtitle: n.body || '',
    detail: n.endDate ? `Bitiş: ${n.endDate}` : '',
    date: String(n.createdAt || '').slice(0, 10),
    sortAt: n.sortAt || n.createdAt || '',
    urgency: 'membership',
    link: n.link || '/hesap/lisans',
  }))
}

function loadLocalNotifications() {
  const merged = [...getCrmNotifications(), ...getB2bTicketNotifications()]
  return merged.sort((a, b) => {
    const rankDiff = (urgencyRank[a.urgency] ?? 9) - (urgencyRank[b.urgency] ?? 9)
    if (rankDiff !== 0) return rankDiff
    return String(b.sortAt || b.date || '').localeCompare(String(a.sortAt || a.date || ''))
  })
}

function mergeNotifications(localItems, membershipItems) {
  const merged = [...membershipItems, ...localItems]
  return merged.sort((a, b) => {
    const rankDiff = (urgencyRank[a.urgency] ?? 9) - (urgencyRank[b.urgency] ?? 9)
    if (rankDiff !== 0) return rankDiff
    return String(b.sortAt || b.date || '').localeCompare(String(a.sortAt || a.date || ''))
  })
}

export default function NotificationDropdown() {
  const navigate = useNavigate()
  const { open, setOpen, toggle } = useHeaderPopover('notifications')
  const [localItems, setLocalItems] = useState(() => loadLocalNotifications())
  const [membershipItems, setMembershipItems] = useState([])
  const { anchorRef, menuRef, style: menuStyle } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    width: 384,
    offset: 8,
  })

  useEffect(() => {
    let cancelled = false
    async function loadMembership() {
      try {
        const rows = await fetchAccountNotifications()
        if (!cancelled) setMembershipItems(mapMembershipNotifications(rows))
      } catch {
        if (!cancelled) setMembershipItems([])
      }
    }
    function refreshLocal() {
      setLocalItems(loadLocalNotifications())
    }
    refreshLocal()
    loadMembership()
    window.addEventListener('bach:crm-updated', refreshLocal)
    window.addEventListener('erlenbox:b2b-updated', refreshLocal)
    const interval = setInterval(() => {
      refreshLocal()
      loadMembership()
    }, 60000)
    return () => {
      cancelled = true
      window.removeEventListener('bach:crm-updated', refreshLocal)
      window.removeEventListener('erlenbox:b2b-updated', refreshLocal)
      clearInterval(interval)
    }
  }, [])

  const notifications = useMemo(
    () => mergeNotifications(localItems, membershipItems),
    [localItems, membershipItems],
  )
  const count = notifications.length
  const preview = notifications
  const hasTickets = useMemo(
    () => notifications.some((item) => item.kind === 'ticket' || item.kind === 'ticket-reply'),
    [notifications],
  )
  const hasMembership = useMemo(
    () => notifications.some((item) => item.kind === 'membership'),
    [notifications],
  )

  function openItem(item) {
    setOpen(false)
    navigate(item?.link || '/crm')
  }

  function openHub() {
    setOpen(false)
    if (hasMembership && !hasTickets) {
      navigate('/hesap/lisans')
      return
    }
    navigate(hasTickets ? '/yonetici-kontrol' : '/crm')
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
              Üyelik, görevler, ajanda ve B2B ticket cevapları
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {preview.length === 0 ? (
              <div className="px-3 py-8 text-center">
                <p className="text-sm font-bold text-[var(--ink)]">Bildirim yok</p>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  Açık üyelik, görev, ajanda notu veya ticket bulunmuyor.
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
                {hasMembership && !hasTickets
                  ? `Lisans sayfasına git (${count})`
                  : hasTickets
                    ? `Yönetici panele git (${count})`
                    : `CRM merkezine git (${count})`}
              </button>
            </div>
          )}
        </div>,
        document.body,
      )}
    </div>
  )
}
