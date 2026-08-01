/**
 * Platform announcements / changelog (admin blog → CRM /duyurular).
 */
import { loadStore, saveStore, withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { requireStaffOrReject } from './staffAuth.mjs'

export const ANNOUNCEMENT_BADGES = ['Yeni', 'Güncelleme', 'Duyuru', 'Özellik']

const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann_seed_1',
    title: 'Müşteri Ekstre PDF Yenilendi',
    detail:
      'Cari hareketler sayfasından gönderilen ekstre PDF artık firma logonuz, IBAN bilgileriniz ve modern renk tonlarıyla oluşturuluyor.',
    badge: 'Yeni',
    status: 'published',
    publishedAt: '2026-06-05T10:00:00.000Z',
    createdAt: '2026-06-05T10:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z',
  },
  {
    id: 'ann_seed_2',
    title: 'Tahsilat ve Ödeme Modülü',
    detail:
      'Müşteri detayında tahsilat ve ödeme işlemleri kasa/banka seçimiyle cari hareketlere işleniyor. İşlem yeri kolonu eklendi.',
    badge: 'Güncelleme',
    status: 'published',
    publishedAt: '2026-06-04T10:00:00.000Z',
    createdAt: '2026-06-04T10:00:00.000Z',
    updatedAt: '2026-06-04T10:00:00.000Z',
  },
  {
    id: 'ann_seed_3',
    title: 'Profil ve Müşteri Numarası',
    detail:
      'Her firma için benzersiz müşteri numarası otomatik oluşturuluyor. Yönetici kontrol panelinden destek ekibi erişebilir.',
    badge: 'Duyuru',
    status: 'published',
    publishedAt: '2026-06-03T10:00:00.000Z',
    createdAt: '2026-06-03T10:00:00.000Z',
    updatedAt: '2026-06-03T10:00:00.000Z',
  },
  {
    id: 'ann_seed_4',
    title: 'Düzenlenebilir Açılır Menüler',
    detail:
      'Tip, temsilci, puantaj, kategori ve kasa/banka listelerine yeni seçenek ekleyebilir, düzenleyebilir ve silebilirsiniz.',
    badge: 'Özellik',
    status: 'published',
    publishedAt: '2026-06-02T10:00:00.000Z',
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
  },
]

function nowIso() {
  return new Date().toISOString()
}

function formatDisplayDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 10)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

export function ensureAnnouncementsStore(store) {
  if (!Array.isArray(store.announcements)) store.announcements = []
  let seeded = false
  if (store.announcements.length === 0) {
    store.announcements = SEED_ANNOUNCEMENTS.map((row) => ({ ...row }))
    seeded = true
  }
  return { items: store.announcements, seeded }
}

async function loadAnnouncements({ persistSeed = false } = {}) {
  const store = await loadStore()
  const { items, seeded } = ensureAnnouncementsStore(store)
  if (persistSeed && seeded) await saveStore(store)
  return items
}

function normalizeBadge(value) {
  const badge = String(value || 'Duyuru').trim()
  return ANNOUNCEMENT_BADGES.includes(badge) ? badge : 'Duyuru'
}

function normalizeStatus(value) {
  const status = String(value || 'draft').toLowerCase()
  if (status === 'published' || status === 'draft' || status === 'archived') return status
  return 'draft'
}

function sortByPublishedDesc(a, b) {
  return String(b.publishedAt || b.createdAt || '').localeCompare(
    String(a.publishedAt || a.createdAt || ''),
  )
}

function toPublicItem(row) {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    badge: row.badge,
    date: formatDisplayDate(row.publishedAt || row.createdAt),
    publishedAt: row.publishedAt || row.createdAt || null,
  }
}

function toAdminItem(row) {
  return {
    ...row,
    date: formatDisplayDate(row.publishedAt || row.createdAt),
  }
}

function parseBodyFields(body = {}) {
  const title = String(body.title || '').trim()
  const detail = String(body.detail || body.body || '').trim()
  const badge = normalizeBadge(body.badge)
  const status = normalizeStatus(body.status)
  let publishedAt = body.publishedAt ? String(body.publishedAt) : null
  if (status === 'published' && !publishedAt) publishedAt = nowIso()
  if (status !== 'published') publishedAt = publishedAt || null
  return { title, detail, badge, status, publishedAt }
}

/**
 * @returns {Promise<boolean>} true if handled
 */
export async function handleAnnouncementsApi(req, res, path, body = {}) {
  if (!path || !path.startsWith('announcements')) return false

  const method = req.method
  const parts = path.split('/').filter(Boolean)

  // Public: GET /api/announcements
  if (method === 'GET' && path === 'announcements') {
    const rows = await loadAnnouncements({ persistSeed: true })
    const items = rows
      .filter((row) => row.status === 'published')
      .slice()
      .sort(sortByPublishedDesc)
      .map(toPublicItem)
    return sendJson(req, res, 200, { ok: true, items })
  }

  // Staff admin routes
  if (parts[1] === 'admin') {
    const gate = requireStaffOrReject(req, path, method)
    if (!gate.ok) {
      return sendJson(req, res, gate.status || 401, {
        ok: false,
        ...(gate.body || {
          error: gate.error || 'UNAUTHORIZED',
          message: gate.message || 'Yetkisiz',
        }),
      })
    }

    if (method === 'GET' && path === 'announcements/admin') {
      const rows = await loadAnnouncements({ persistSeed: true })
      const items = rows.slice().sort(sortByPublishedDesc).map(toAdminItem)
      return sendJson(req, res, 200, {
        ok: true,
        badges: ANNOUNCEMENT_BADGES,
        items,
      })
    }

    if (method === 'POST' && path === 'announcements/admin') {
      try {
        const fields = parseBodyFields(body)
        if (!fields.title) {
          return sendJson(req, res, 400, {
            ok: false,
            error: 'MISSING_TITLE',
            message: 'Başlık gerekli',
          })
        }
        if (!fields.detail) {
          return sendJson(req, res, 400, {
            ok: false,
            error: 'MISSING_DETAIL',
            message: 'İçerik gerekli',
          })
        }
        const at = nowIso()
        const item = await withStore((store) => {
          ensureAnnouncementsStore(store)
          const row = {
            id: newId('ann'),
            title: fields.title,
            detail: fields.detail,
            badge: fields.badge,
            status: fields.status,
            publishedAt: fields.status === 'published' ? fields.publishedAt || at : null,
            createdAt: at,
            updatedAt: at,
          }
          store.announcements.unshift(row)
          return row
        })
        return sendJson(req, res, 201, { ok: true, item: toAdminItem(item) })
      } catch (err) {
        return sendJson(req, res, 400, {
          ok: false,
          error: err.code || 'CREATE_FAILED',
          message: err.message,
        })
      }
    }

    const id = parts[2]
    if (id && parts[3] === 'delete' && method === 'POST') {
      try {
        const removed = await withStore((store) => {
          ensureAnnouncementsStore(store)
          const idx = store.announcements.findIndex((row) => row.id === id)
          if (idx < 0) {
            const err = new Error('Duyuru bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          const [row] = store.announcements.splice(idx, 1)
          return row
        })
        return sendJson(req, res, 200, { ok: true, item: toAdminItem(removed) })
      } catch (err) {
        return sendJson(req, res, err.status || 400, {
          ok: false,
          error: err.code || 'DELETE_FAILED',
          message: err.message,
        })
      }
    }

    if (id && parts[3] === 'publish' && method === 'POST') {
      try {
        const item = await withStore((store) => {
          ensureAnnouncementsStore(store)
          const row = store.announcements.find((r) => r.id === id)
          if (!row) {
            const err = new Error('Duyuru bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          const at = nowIso()
          row.status = 'published'
          row.publishedAt = row.publishedAt || at
          row.updatedAt = at
          return row
        })
        return sendJson(req, res, 200, { ok: true, item: toAdminItem(item) })
      } catch (err) {
        return sendJson(req, res, err.status || 400, {
          ok: false,
          error: err.code || 'PUBLISH_FAILED',
          message: err.message,
        })
      }
    }

    if (id && method === 'PUT') {
      try {
        const fields = parseBodyFields(body)
        if (!fields.title) {
          return sendJson(req, res, 400, {
            ok: false,
            error: 'MISSING_TITLE',
            message: 'Başlık gerekli',
          })
        }
        if (!fields.detail) {
          return sendJson(req, res, 400, {
            ok: false,
            error: 'MISSING_DETAIL',
            message: 'İçerik gerekli',
          })
        }
        const item = await withStore((store) => {
          ensureAnnouncementsStore(store)
          const row = store.announcements.find((r) => r.id === id)
          if (!row) {
            const err = new Error('Duyuru bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          const at = nowIso()
          row.title = fields.title
          row.detail = fields.detail
          row.badge = fields.badge
          row.status = fields.status
          if (fields.status === 'published') {
            row.publishedAt = fields.publishedAt || row.publishedAt || at
          } else if (body.clearPublishedAt) {
            row.publishedAt = null
          }
          row.updatedAt = at
          return row
        })
        return sendJson(req, res, 200, { ok: true, item: toAdminItem(item) })
      } catch (err) {
        return sendJson(req, res, err.status || 400, {
          ok: false,
          error: err.code || 'UPDATE_FAILED',
          message: err.message,
        })
      }
    }

    return sendJson(req, res, 404, {
      ok: false,
      error: 'NOT_FOUND',
      message: 'Announcements admin route yok',
    })
  }

  return sendJson(req, res, 404, {
    ok: false,
    error: 'NOT_FOUND',
    message: 'Announcements route yok',
  })
}

export { SEED_ANNOUNCEMENTS }
