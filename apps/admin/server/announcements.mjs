/**
 * Platform updates: features (versioned changelog), training videos, package notices.
 * Admin publishes → CRM /duyurular, /egitim, /paketler + header unread badges.
 */
import { loadStore, saveStore, withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { requireStaffOrReject } from './staffAuth.mjs'

export const ANNOUNCEMENT_BADGES = ['Yeni', 'Güncelleme', 'Duyuru', 'Özellik', 'Fiyat']
export const ANNOUNCEMENT_CHANNELS = ['feature', 'training', 'package']

const INITIAL_VERSION = '2.1.0'

const SEED_ANNOUNCEMENTS = [
  {
    id: 'ann_seed_1',
    channel: 'feature',
    code: 'BM-2.1.0',
    version: '2.1.0',
    title: 'Müşteri Ekstre PDF Yenilendi',
    detail:
      'Cari hareketler sayfasından gönderilen ekstre PDF artık firma logonuz, IBAN bilgileriniz ve modern renk tonlarıyla oluşturuluyor.',
    body: 'Cari hareketler sayfasından gönderilen ekstre PDF artık firma logonuz, IBAN bilgileriniz ve modern renk tonlarıyla oluşturuluyor.\n\nNe değişti?\n• PDF üst bilgisinde şirket logosu\n• IBAN ve unvan bloğu otomatik dolar\n• Yazdırma ve e-posta gönderiminde aynı şablon kullanılır',
    badge: 'Yeni',
    status: 'published',
    publishedAt: '2026-06-05T10:00:00.000Z',
    createdAt: '2026-06-05T10:00:00.000Z',
    updatedAt: '2026-06-05T10:00:00.000Z',
  },
  {
    id: 'ann_seed_2',
    channel: 'feature',
    code: 'BM-2.0.9',
    version: '2.0.9',
    title: 'Tahsilat ve Ödeme Modülü',
    detail:
      'Müşteri detayında tahsilat ve ödeme işlemleri kasa/banka seçimiyle cari hareketlere işleniyor.',
    body: 'Müşteri detayında tahsilat ve ödeme işlemleri kasa/banka seçimiyle cari hareketlere işleniyor. İşlem yeri kolonu eklendi.\n\nNasıl kullanılır?\n1. Müşteri kartından Tahsilat Ekle veya Ödeme Ekle\n2. Nakit için kasa, banka için hesap seçin\n3. Kayıt cari bakiyeye ve kasa hareketlerine yansır',
    badge: 'Güncelleme',
    status: 'published',
    publishedAt: '2026-06-04T10:00:00.000Z',
    createdAt: '2026-06-04T10:00:00.000Z',
    updatedAt: '2026-06-04T10:00:00.000Z',
  },
  {
    id: 'ann_seed_3',
    channel: 'feature',
    code: 'BM-2.0.8',
    version: '2.0.8',
    title: 'Profil ve Müşteri Numarası',
    detail: 'Her firma için benzersiz müşteri numarası otomatik oluşturuluyor.',
    body: 'Her firma için benzersiz müşteri numarası otomatik oluşturuluyor. Yönetici kontrol panelinden destek ekibi erişebilir.\n\nMüşteri numarası 5 haneli rakamdır ve profil başlığında görünür.',
    badge: 'Duyuru',
    status: 'published',
    publishedAt: '2026-06-03T10:00:00.000Z',
    createdAt: '2026-06-03T10:00:00.000Z',
    updatedAt: '2026-06-03T10:00:00.000Z',
  },
  {
    id: 'ann_seed_4',
    channel: 'feature',
    code: 'BM-2.0.7',
    version: '2.0.7',
    title: 'Düzenlenebilir Açılır Menüler',
    detail: 'Tip, temsilci, puantaj, kategori ve kasa/banka listelerine yeni seçenek ekleyebilirsiniz.',
    body: 'Tip, temsilci, puantaj, kategori ve kasa/banka listelerine yeni seçenek ekleyebilir, düzenleyebilir ve silebilirsiniz.\n\nListeler tüm ekipte ortak çalışır; bir kez eklenen seçenek diğer kayıtlarda da görünür.',
    badge: 'Özellik',
    status: 'published',
    publishedAt: '2026-06-02T10:00:00.000Z',
    createdAt: '2026-06-02T10:00:00.000Z',
    updatedAt: '2026-06-02T10:00:00.000Z',
  },
  {
    id: 'ann_seed_edu_1',
    channel: 'training',
    code: 'EDU-0001',
    title: 'Teklif listesi ve müşteri sütunları',
    detail: 'Teklifler sayfasında liste, filtre ve müşteri adı sütununun kullanımı.',
    body: 'Bu eğitimde teklif listesini, durum filtresini ve müşteri adının nasıl okunacağını adım adım gösteriyoruz.\n\nVideo eklendiğinde bildirim rozeti Eğitim menüsünde görünür.',
    videoUrl: '',
    videoTitle: 'Teklif listesi eğitimi',
    badge: 'Yeni',
    status: 'published',
    publishedAt: '2026-08-15T10:00:00.000Z',
    createdAt: '2026-08-15T10:00:00.000Z',
    updatedAt: '2026-08-15T10:00:00.000Z',
  },
  {
    id: 'ann_seed_pkg_1',
    channel: 'package',
    code: 'PKG-0001',
    title: 'Professional paket fiyat güncellemesi',
    detail: 'Professional aylık paket fiyatı güncellendi. Mevcut abonelikler dönem sonuna kadar eski fiyattan devam eder.',
    body: 'Professional aylık paket fiyatı güncellendi.\n\n• Eski fiyat: ₺4.900 / ay\n• Yeni fiyat: ₺5.400 / ay\n• Yıllık planda 2 ay hediye kuralı aynıdır.\n\nMevcut abonelikler yenileme tarihine kadar eski fiyattan faturalanır. Yeni satın almalar güncel katalog fiyatını görür.',
    planName: 'Professional',
    priceFrom: 4900,
    priceTo: 5400,
    priceNote: 'Mevcut abonelikler dönem sonuna kadar eski fiyattan devam eder.',
    badge: 'Fiyat',
    status: 'published',
    publishedAt: '2026-08-10T10:00:00.000Z',
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
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

function normalizeChannel(value) {
  const channel = String(value || 'feature').toLowerCase()
  return ANNOUNCEMENT_CHANNELS.includes(channel) ? channel : 'feature'
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

function bumpPatch(version) {
  const parts = String(version || INITIAL_VERSION)
    .split('.')
    .map((part) => Number(part) || 0)
  while (parts.length < 3) parts.push(0)
  parts[2] += 1
  return parts.slice(0, 3).join('.')
}

function padCode(prefix, n) {
  return `${prefix}-${String(n).padStart(4, '0')}`
}

function nextCounter(store, key) {
  store.updateCounters = store.updateCounters || { feature: 0, training: 0, package: 0 }
  store.updateCounters[key] = Number(store.updateCounters[key] || 0) + 1
  return store.updateCounters[key]
}

export function ensureAnnouncementsStore(store) {
  if (!Array.isArray(store.announcements)) store.announcements = []
  if (!store.platformVersion) store.platformVersion = INITIAL_VERSION
  if (!store.updateCounters) {
    store.updateCounters = { feature: 4, training: 1, package: 1 }
  }
  let seeded = false
  if (store.announcements.length === 0) {
    store.announcements = SEED_ANNOUNCEMENTS.map((row) => ({ ...row }))
    store.platformVersion = INITIAL_VERSION
    seeded = true
  } else {
    const existingChannels = new Set(
      store.announcements.map((row) => row.channel || 'feature'),
    )
    SEED_ANNOUNCEMENTS.forEach((seed) => {
      if (existingChannels.has(seed.channel)) return
      store.announcements.push({ ...seed })
      seeded = true
    })
  }
  store.announcements.forEach((row, index) => {
    if (!row.channel) row.channel = 'feature'
    if (!row.body) row.body = row.detail || ''
    if (!row.version && row.channel === 'feature') row.version = store.platformVersion || INITIAL_VERSION
    if (!row.code) {
      if (row.channel === 'training') row.code = padCode('EDU', index + 1)
      else if (row.channel === 'package') row.code = padCode('PKG', index + 1)
      else row.code = `BM-${row.version || store.platformVersion || INITIAL_VERSION}`
    }
  })
  return { items: store.announcements, seeded }
}

async function loadAnnouncements({ persistSeed = false } = {}) {
  const store = await loadStore()
  const { items, seeded } = ensureAnnouncementsStore(store)
  if (persistSeed && seeded) await saveStore(store)
  return { items, version: store.platformVersion || INITIAL_VERSION, counters: store.updateCounters }
}

function sortByPublishedDesc(a, b) {
  return String(b.publishedAt || b.createdAt || '').localeCompare(
    String(a.publishedAt || a.createdAt || ''),
  )
}

function toPublicItem(row) {
  return {
    id: row.id,
    channel: row.channel || 'feature',
    code: row.code || '',
    version: row.version || '',
    title: row.title,
    detail: row.detail,
    body: row.body || row.detail || '',
    badge: row.badge,
    date: formatDisplayDate(row.publishedAt || row.createdAt),
    publishedAt: row.publishedAt || row.createdAt || null,
    videoUrl: row.videoUrl || '',
    videoTitle: row.videoTitle || '',
    planName: row.planName || '',
    priceFrom: row.priceFrom ?? null,
    priceTo: row.priceTo ?? null,
    priceNote: row.priceNote || '',
  }
}

function toAdminItem(row) {
  return {
    ...toPublicItem(row),
    status: row.status,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function parseBodyFields(body = {}) {
  const title = String(body.title || '').trim()
  const detail = String(body.detail || body.body || '').trim()
  const longBody = String(body.body || body.detail || '').trim()
  const badge = normalizeBadge(body.badge)
  const status = normalizeStatus(body.status)
  const channel = normalizeChannel(body.channel)
  let publishedAt = body.publishedAt ? String(body.publishedAt) : null
  if (status === 'published' && !publishedAt) publishedAt = nowIso()
  if (status !== 'published') publishedAt = publishedAt || null
  return {
    title,
    detail: detail || longBody,
    body: longBody || detail,
    badge,
    status,
    channel,
    publishedAt,
    videoUrl: String(body.videoUrl || '').trim(),
    videoTitle: String(body.videoTitle || '').trim(),
    planName: String(body.planName || '').trim(),
    priceFrom: body.priceFrom === '' || body.priceFrom == null ? null : Number(body.priceFrom),
    priceTo: body.priceTo === '' || body.priceTo == null ? null : Number(body.priceTo),
    priceNote: String(body.priceNote || '').trim(),
  }
}

function assignPublishCodes(store, row, fields, { wasPublished = false } = {}) {
  if (fields.channel === 'training' && !row.code) {
    row.code = padCode('EDU', nextCounter(store, 'training'))
  }
  if (fields.channel === 'package' && !row.code) {
    row.code = padCode('PKG', nextCounter(store, 'package'))
  }
  if (fields.channel !== 'feature' || fields.status !== 'published') return
  if (!wasPublished) {
    store.platformVersion = bumpPatch(store.platformVersion || INITIAL_VERSION)
    row.version = store.platformVersion
    row.code = `BM-${store.platformVersion}`
    nextCounter(store, 'feature')
    return
  }
  if (!row.code) {
    row.version = store.platformVersion || INITIAL_VERSION
    row.code = `BM-${row.version}`
  }
}

function applyFields(row, fields) {
  row.title = fields.title
  row.detail = fields.detail
  row.body = fields.body
  row.badge = fields.badge
  row.channel = fields.channel
  row.videoUrl = fields.videoUrl
  row.videoTitle = fields.videoTitle
  row.planName = fields.planName
  row.priceFrom = Number.isFinite(fields.priceFrom) ? fields.priceFrom : null
  row.priceTo = Number.isFinite(fields.priceTo) ? fields.priceTo : null
  row.priceNote = fields.priceNote
}

/**
 * @returns {Promise<boolean>} true if handled
 */
export async function handleAnnouncementsApi(req, res, path, body = {}) {
  if (!path || !path.startsWith('announcements')) return false

  const method = req.method
  const parts = path.split('/').filter(Boolean)
  const url = new URL(req.url || `http://local/${path}`, 'http://local')
  const channelFilter = normalizeChannel(url.searchParams.get('channel') || body.channel || '')
  const hasChannelQuery = Boolean(url.searchParams.get('channel') || body.channel)

  if (method === 'GET' && (path === 'announcements' || path === 'announcements/meta')) {
    const { items, version } = await loadAnnouncements({ persistSeed: true })
    const published = items.filter((row) => row.status === 'published')
    const filtered = hasChannelQuery
      ? published.filter((row) => (row.channel || 'feature') === channelFilter)
      : published
    const counts = {
      feature: published.filter((row) => (row.channel || 'feature') === 'feature').length,
      training: published.filter((row) => row.channel === 'training').length,
      package: published.filter((row) => row.channel === 'package').length,
    }
    if (path === 'announcements/meta') {
      return sendJson(req, res, 200, { ok: true, version, counts })
    }
    return sendJson(req, res, 200, {
      ok: true,
      version,
      counts,
      items: filtered.slice().sort(sortByPublishedDesc).map(toPublicItem),
    })
  }

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
      const { items, version, counters } = await loadAnnouncements({ persistSeed: true })
      const filtered = hasChannelQuery
        ? items.filter((row) => (row.channel || 'feature') === channelFilter)
        : items
      return sendJson(req, res, 200, {
        ok: true,
        version,
        counters,
        badges: ANNOUNCEMENT_BADGES,
        channels: ANNOUNCEMENT_CHANNELS,
        items: filtered.slice().sort(sortByPublishedDesc).map(toAdminItem),
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
        const item = await withStore((store) => {
          ensureAnnouncementsStore(store)
          const row = {
            id: newId('ann'),
            status: 'draft',
            createdAt: nowIso(),
            updatedAt: nowIso(),
          }
          applyFields(row, fields)
          row.status = fields.status
          assignPublishCodes(store, row, fields, { wasPublished: false })
          if (fields.status === 'published') {
            row.publishedAt = fields.publishedAt || nowIso()
          }
          row.updatedAt = nowIso()
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
            const err = new Error('Kayıt bulunamadı')
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
            const err = new Error('Kayıt bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          const fields = {
            ...parseBodyFields(row),
            channel: row.channel || 'feature',
            status: 'published',
          }
          assignPublishCodes(store, row, fields, { wasPublished: row.status === 'published' })
          row.status = 'published'
          row.publishedAt = row.publishedAt || nowIso()
          row.updatedAt = nowIso()
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
            const err = new Error('Kayıt bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          const wasPublished = row.status === 'published'
          applyFields(row, fields)
          assignPublishCodes(store, row, { ...fields, status: fields.status }, { wasPublished })
          row.status = fields.status
          if (fields.status === 'published') {
            row.publishedAt = fields.publishedAt || row.publishedAt || nowIso()
          }
          row.updatedAt = nowIso()
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
