import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ClipboardList, CreditCard, Factory, FileText, MessageSquare, ShoppingCart } from 'lucide-react'
import {
  getB2bTicketNotifications,
  readAllB2bOrders,
  readB2bTickets,
} from '../../utils/b2bPortalStore'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'

const STAFF_INBOX_KEY = 'erlenbox-b2b-staff-inbox'
const MESSAGES_KEY = 'erlenbox-b2b-messages'
const NOTIFICATIONS_KEY = 'erlenbox-b2b-notifications'
const ACCESS_KEY = 'erlenbox-b2b-access'
const READ_KEY = 'bach:header-b2b-read-v1'
const SAMPLE_ORDER_ID = 'b2b-header-sample-order'

function readB2bMessages() {
  try {
    const parsed = JSON.parse(localStorage.getItem(MESSAGES_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function readPortalNotifications() {
  try {
    const parsed = JSON.parse(localStorage.getItem(NOTIFICATIONS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function resolveCustomerName(customerId, fallback = '') {
  if (!customerId) return fallback
  try {
    const access = JSON.parse(localStorage.getItem(ACCESS_KEY) || '{}')
    const entry = access[customerId]
    if (entry?.customerName) return entry.customerName
    if (entry?.name) return entry.name
  } catch {
    /* ignore */
  }
  return fallback
}

function portalNotificationKind(type = '') {
  const value = String(type).toLowerCase()
  if (value.includes('message')) return 'message'
  if (value.includes('quote')) return 'quote'
  if (value.includes('order')) return 'order'
  if (value.includes('payment') || value.includes('invoice')) return 'payment'
  if (
    value.includes('production') ||
    value.includes('shipment') ||
    value.includes('process') ||
    value.includes('uretim') ||
    value.includes('sevkiyat')
  ) {
    return 'process'
  }
  return 'other'
}

function portalNotificationLink(item) {
  const view = item?.linkView
  if (view === 'quotes') return '/teklifler'
  if (view === 'process' || view === 'production') return '/uretim'
  if (view === 'invoices' || view === 'payments' || view === 'payment-plan') return '/finans'
  if (view === 'messages') return '/yonetici-kontrol'
  return '/yonetici-kontrol'
}

function readStaffInbox() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STAFF_INBOX_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeStaffInbox(items) {
  localStorage.setItem(STAFF_INBOX_KEY, JSON.stringify(items.slice(0, 80)))
}

/** Örnek sipariş bildirimi — gerçek B2B akışı yokken paneli göstermek için. */
function ensureSampleOrderNotification() {
  const inbox = readStaffInbox()
  if (inbox.some((item) => item.id === SAMPLE_ORDER_ID)) return
  inbox.unshift({
    id: SAMPLE_ORDER_ID,
    type: 'b2b_order',
    title: 'Yeni B2B sipariş · SIP-DEMO-001',
    subtitle: 'Wagon Ambalaj · 24.500 ₺ · Havale',
    customerName: 'Wagon Ambalaj',
    link: '/siparisler',
    at: new Date().toISOString(),
  })
  writeStaffInbox(inbox)
}

function loadReadMap() {
  try {
    const parsed = JSON.parse(localStorage.getItem(READ_KEY) || '{}')
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function persistReadMap(map) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(iso).slice(0, 16)
  }
}

function kindMeta(kind) {
  if (kind === 'message' || kind === 'ticket') {
    return { icon: MessageSquare, tone: 'text-sky-500 bg-sky-500/10' }
  }
  if (kind === 'quote') {
    return { icon: FileText, tone: 'text-violet-500 bg-violet-500/10' }
  }
  if (kind === 'order') {
    return { icon: ShoppingCart, tone: 'text-emerald-500 bg-emerald-500/10' }
  }
  if (kind === 'payment') {
    return { icon: CreditCard, tone: 'text-amber-600 bg-amber-500/10' }
  }
  if (kind === 'process') {
    return { icon: Factory, tone: 'text-blue-600 bg-blue-500/10' }
  }
  return { icon: ClipboardList, tone: 'text-[var(--ds-primary,#203375)] bg-[var(--ds-primary,#203375)]/10' }
}

function collectB2bStaffNotifications() {
  const items = []
  const seen = new Set()

  function push(item) {
    if (!item?.id || seen.has(item.id)) return
    seen.add(item.id)
    items.push(item)
  }

  getB2bTicketNotifications().forEach((note) => {
    push({
      id: note.id,
      kind: note.kind === 'ticket-reply' ? 'message' : 'ticket',
      title: note.title || 'B2B Canlı Not',
      subtitle: note.subtitle || note.detail || '',
      customerName: note.detail || note.title || '',
      link: note.link || '/yonetici-kontrol',
      sortAt: note.sortAt || note.date || '',
    })
  })

  readB2bTickets().forEach((ticket) => {
    if (ticket.status !== 'Açık') return
    push({
      id: `ticket-open-${ticket.id}`,
      kind: 'ticket',
      title: 'Açık B2B mesaj',
      subtitle: ticket.message,
      customerName: ticket.customerName || '',
      link: '/yonetici-kontrol',
      sortAt: ticket.createdAt || '',
    })
  })

  readB2bMessages()
    .filter((msg) => msg.author === 'customer' && !msg.readByStaff)
    .slice(-40)
    .forEach((msg) => {
      push({
        id: `msg-${msg.id}`,
        kind: 'message',
        title: 'Yeni B2B mesaj',
        subtitle: msg.text,
        customerName: msg.customerName || msg.authorName || '',
        link: '/yonetici-kontrol',
        sortAt: msg.createdAt || '',
      })
    })

  const recentCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
  readAllB2bOrders()
    .filter((order) => {
      const at = order.createdAt ? new Date(order.createdAt).getTime() : 0
      return Number.isFinite(at) && at >= recentCutoff
    })
    .slice(0, 20)
    .forEach((order) => {
      const paymentNote = order.paymentPlan?.label || order.paymentMethod || ''
      push({
        id: `order-${order.id}`,
        kind: 'order',
        title: `Yeni sipariş · ${order.id}`,
        subtitle: [
          order.customerName || 'Müşteri',
          `${Number(order.total || 0).toLocaleString('tr-TR')} ₺`,
          paymentNote,
        ]
          .filter(Boolean)
          .join(' · '),
        customerName: order.customerName || '',
        link: '/siparisler',
        sortAt: order.createdAt || '',
      })
    })

  // Tüm müşterilerin teklifleri
  try {
    const quotes = JSON.parse(localStorage.getItem('erlenbox-b2b-quotes') || '[]')
    if (Array.isArray(quotes)) {
      quotes
        .filter((q) => q.status === 'Bekliyor' || q.status === 'Açık')
        .slice(0, 20)
        .forEach((quote) => {
          push({
            id: `quote-${quote.id}`,
            kind: 'quote',
            title: `Teklif talebi · ${quote.id}`,
            subtitle: quote.note || quote.customerName || 'Yeni teklif talebi',
            customerName: quote.customerName || '',
            link: '/teklifler',
            sortAt: quote.createdAt || '',
          })
        })
    }
  } catch {
    /* ignore */
  }

  readPortalNotifications()
    .slice(0, 40)
    .forEach((note) => {
      push({
        id: `portal-${note.id}`,
        kind: portalNotificationKind(note.type),
        title: note.title || 'B2B portal bildirimi',
        subtitle: note.body || '',
        customerName: resolveCustomerName(note.customerId),
        link: portalNotificationLink(note),
        sortAt: note.createdAt || '',
      })
    })

  readStaffInbox().forEach((event) => {
    push({
      id: event.id,
      kind:
        event.type === 'b2b_message' || event.type === 'b2b_ticket'
          ? 'message'
          : event.type === 'b2b_quote'
            ? 'quote'
            : event.type === 'b2b_order'
              ? 'order'
              : event.type === 'b2b_payment'
                ? 'payment'
                : event.type === 'b2b_process'
                  ? 'process'
                  : 'other',
      title: event.title || 'B2B bildirimi',
      subtitle: event.subtitle || '',
      customerName: event.customerName || '',
      link: event.link || '/yonetici-kontrol',
      sortAt: event.at || '',
    })
  })

  return items.sort((a, b) => String(b.sortAt || '').localeCompare(String(a.sortAt || '')))
}

/**
 * Bachmain header B2B ikonu — müşteri portalından gelen tüm bildirimler.
 */
export default function HeaderB2BBadge() {
  const navigate = useNavigate()
  const { open, setOpen, toggle } = useHeaderPopover('b2b-center')
  const [items, setItems] = useState(() => collectB2bStaffNotifications())
  const [readMap, setReadMap] = useState(() => loadReadMap())
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    width: 380,
    offset: 8,
  })

  const refresh = useCallback(() => {
    setItems(collectB2bStaffNotifications())
  }, [])

  useEffect(() => {
    ensureSampleOrderNotification()
    refresh()

    function onStaffNotify(event) {
      const detail = event.detail || {}
      const inbox = readStaffInbox()
      inbox.unshift({
        id: `staff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: detail.type || 'b2b',
        title:
          detail.type === 'b2b_message'
            ? 'Yeni B2B mesaj'
            : detail.type === 'b2b_quote'
              ? 'Yeni teklif talebi'
              : detail.type === 'b2b_order'
                ? 'Yeni B2B sipariş'
                : detail.type === 'b2b_ticket'
                  ? 'Yeni B2B canlı not'
                  : detail.type === 'b2b_payment'
                    ? 'B2B ödeme bildirimi'
                    : detail.type === 'b2b_process'
                      ? 'B2B süreç güncellemesi'
                      : 'B2B bildirimi',
        subtitle: detail.message || detail.body || detail.customerName || detail.orderId || detail.quoteId || '',
        customerName: detail.customerName || '',
        link:
          detail.type === 'b2b_order'
            ? '/siparisler'
            : detail.type === 'b2b_quote'
              ? '/teklifler'
              : detail.type === 'b2b_payment'
                ? '/finans'
                : detail.type === 'b2b_process'
                  ? '/uretim'
                  : '/yonetici-kontrol',
        at: new Date().toISOString(),
      })
      writeStaffInbox(inbox)
      refresh()
    }

    window.addEventListener('erlenbox:b2b-updated', refresh)
    window.addEventListener('bach:b2b-staff-notify', onStaffNotify)
    window.addEventListener('storage', refresh)
    const timer = setInterval(refresh, 12000)
    return () => {
      window.removeEventListener('erlenbox:b2b-updated', refresh)
      window.removeEventListener('bach:b2b-staff-notify', onStaffNotify)
      window.removeEventListener('storage', refresh)
      clearInterval(timer)
    }
  }, [refresh])

  const unread = useMemo(
    () => items.filter((item) => !readMap[item.id]),
    [items, readMap],
  )
  const count = unread.length

  function markRead(id) {
    setReadMap((current) => {
      const next = { ...current, [id]: { readAt: new Date().toISOString() } }
      persistReadMap(next)
      return next
    })
  }

  function markAllRead() {
    setReadMap((current) => {
      const next = { ...current }
      items.forEach((item) => {
        next[item.id] = { readAt: new Date().toISOString() }
      })
      persistReadMap(next)
      return next
    })
  }

  return (
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        data-header-popover-trigger="b2b-center"
        onClick={toggle}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label={
          count > 0 ? `B2B Bildirimleri · ${count} okunmamış` : 'B2B Bildirimleri'
        }
        title="B2B Müşteri Bildirimleri"
      >
        <span className="icon-wrap">
          <span className="header-b2b-label select-none text-[10px] font-black leading-none tracking-tight">
            B2B
          </span>
        </span>
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-black text-white shadow-[0_0_10px_rgba(255,59,48,0.55)]">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={
                menuStyle ?? {
                  position: 'fixed',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 10000,
                }
              }
              className="app-header-dropdown header-popover-panel overflow-hidden"
              data-header-popover="b2b-center"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-popover-head !px-3 !py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  B2B Müşteri Bildirimleri
                </p>
                <div className="flex items-center gap-2">
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={markAllRead}
                      className="shrink-0 px-1.5 py-1 text-[12px] font-normal text-[var(--muted)] transition hover:text-[var(--ink)]"
                    >
                      Okundu
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      navigate('/musteriler')
                    }}
                    className="shrink-0 px-1.5 py-1 text-[12px] font-normal text-[#2563eb] transition-transform hover:-translate-y-0.5"
                  >
                    Müşteriler
                  </button>
                </div>
              </div>

              <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
                {items.length === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-[var(--muted)]">
                    Müşterilerden gelen B2B bildirimi yok.
                  </p>
                )}
                {items.map((item) => {
                  const meta = kindMeta(item.kind)
                  const Icon = meta.icon
                  const isUnread = !readMap[item.id]
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        markRead(item.id)
                        setOpen(false)
                        navigate(item.link || '/yonetici-kontrol')
                      }}
                      className={`flex w-full items-start gap-2.5 border-b border-[var(--border)] px-3 py-2.5 text-left transition hover:bg-[var(--surface-muted)] ${
                        isUnread ? 'bg-[var(--ds-primary,#203375)]/[0.04]' : ''
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${meta.tone}`}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-[var(--ink)]">{item.title}</span>
                          {isUnread && (
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#ff3b30]" />
                          )}
                        </span>
                        {item.customerName ? (
                          <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--ds-primary,#203375)]">
                            {item.customerName}
                          </span>
                        ) : null}
                        <span className="mt-0.5 line-clamp-2 block text-[11px] text-[var(--muted)]">
                          {item.subtitle}
                        </span>
                        <span className="mt-1 block text-[10px] font-semibold text-[var(--muted)]">
                          {formatWhen(item.sortAt)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
