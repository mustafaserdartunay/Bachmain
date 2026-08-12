/**
 * Staff-only admin alerts for yönetim.bachmain.com + admin@bachmain.com mail.
 * Never fan out to tenant CRM bells — audience is always 'staff'.
 */
import { newId } from './store.mjs'
import { MAIL_BRAND } from './mail/mailConfig.mjs'
import { sendTemplateMail } from './mail/mailService.mjs'

export function staffAdminEmail() {
  return String(process.env.ADMIN_EMAIL || 'admin@bachmain.com')
    .trim()
    .toLowerCase()
}

/** Build table rows from a plain object (only provided keys). */
export function rowsFromFields(fields = {}) {
  const rows = []
  for (const [label, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue
    rows.push({ label, value: String(value) })
  }
  return rows
}

/**
 * Persist a staff-scoped in-app notification + dashboard activity.
 * Tenant CRM (`auth/notifications`) never receives these.
 */
export function pushStaffNotification(
  store,
  {
    type,
    title,
    body,
    rows = [],
    customerId = null,
    accountId = null,
    link = null,
    meta = {},
  } = {},
) {
  if (!Array.isArray(store.notifications)) store.notifications = []
  const createdAt = new Date().toISOString()
  const notification = {
    id: newId('ntf'),
    audience: 'staff',
    type: type || 'staff_alert',
    title: title || 'Yönetim bildirimi',
    body: body || '',
    rows: Array.isArray(rows) ? rows : [],
    customerId: customerId || null,
    accountId: accountId || null,
    link: link || null,
    meta: meta && typeof meta === 'object' ? meta : {},
    createdAt,
  }
  store.notifications.unshift(notification)
  store.notifications = store.notifications.slice(0, 2000)

  if (!store.dashboard) store.dashboard = {}
  if (!Array.isArray(store.dashboard.recentActivities)) store.dashboard.recentActivities = []
  store.dashboard.recentActivities.unshift({
    id: newId('a'),
    title: notification.title,
    description: notification.body,
    date: createdAt,
    type: 'info',
    user: 'Sistem',
    customerId: notification.customerId,
    accountId: notification.accountId,
    notificationId: notification.id,
  })
  store.dashboard.recentActivities = store.dashboard.recentActivities.slice(0, 40)

  return notification
}

/**
 * Staff panel row + branded HTML mail to admin@bachmain.com.
 * `rows` must contain ONLY this event’s own form/checkout fields.
 */
export async function notifyStaffAdmin(
  store,
  {
    type,
    title,
    body,
    rows = [],
    customerId = null,
    accountId = null,
    link = null,
    ctaLabel = 'Yönetim panelinde aç',
    eventLabel = null,
    intro = null,
    meta = {},
  } = {},
) {
  const notification = pushStaffNotification(store, {
    type,
    title,
    body,
    rows,
    customerId,
    accountId,
    link: link || `${MAIL_BRAND.adminUrl()}/uyeler`,
    meta,
  })

  try {
    await sendTemplateMail(store, {
      to: staffAdminEmail(),
      template: 'admin_event_alert',
      type: type || 'staff_alert',
      immediate: true,
      customerId: customerId || undefined,
      accountId: accountId || undefined,
      data: {
        title: title || 'Yönetim bildirimi',
        preview: body || title || '',
        intro:
          intro ||
          'BACHMAIN yönetim paneline yeni bir işlem düştü. Aşağıdaki tablo yalnızca bu işlemin kendi bilgileridir.',
        eventType: eventLabel || type || 'Bildirim',
        rows: notification.rows,
        ctaUrl: notification.link || `${MAIL_BRAND.adminUrl()}/uyeler`,
        ctaLabel,
      },
      meta: { ...(meta || {}), notificationId: notification.id, audience: 'staff' },
    })
  } catch (err) {
    console.error('[staffNotify] admin mail failed:', err?.message || err)
  }

  return notification
}
