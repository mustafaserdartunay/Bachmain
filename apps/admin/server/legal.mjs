/**
 * Legal documents + consent logging (yonetim store SoT).
 */
import { loadStore, withStore, newId } from './store.mjs'
import { sendJson } from './authRoutes.mjs'
import { getAccountFromToken, getBearerOrCookieToken } from './auth.mjs'
import { requireStaffOrReject } from './staffAuth.mjs'
import {
  LAWYER_NOTICE,
  DEFAULT_LEGAL_COMPANY,
  LEGAL_DOC_TYPES,
  CONSENT_PACKS,
  buildDraftBody,
  resolveDocMeta,
  markdownToHtml,
} from './legalCatalog.mjs'

function nowIso() {
  return new Date().toISOString()
}

export function ensureLegalStore(store) {
  if (!store.legal || typeof store.legal !== 'object') store.legal = {}
  if (!store.legal.company || typeof store.legal.company !== 'object') {
    store.legal.company = { ...DEFAULT_LEGAL_COMPANY }
  } else {
    store.legal.company = { ...DEFAULT_LEGAL_COMPANY, ...store.legal.company }
  }
  if (!Array.isArray(store.legal.documents)) store.legal.documents = []
  if (!Array.isArray(store.legal.versions)) store.legal.versions = []
  if (!Array.isArray(store.legal.consents)) store.legal.consents = []
  if (!Array.isArray(store.legal.cookiePreferences)) store.legal.cookiePreferences = []

  const company = store.legal.company
  const publishedAt = store.legal.seededAt || nowIso()
  let seeded = false

  for (const meta of LEGAL_DOC_TYPES) {
    let doc = store.legal.documents.find((d) => d.type === meta.type)
    if (!doc) {
      doc = {
        id: newId('ldoc'),
        type: meta.type,
        slug: meta.slug,
        title: meta.title,
        aliases: meta.aliases || [],
        status: 'published',
        currentVersion: '1.0.0',
        createdAt: publishedAt,
        updatedAt: publishedAt,
      }
      store.legal.documents.push(doc)
      seeded = true
    }
    const hasVersion = store.legal.versions.some(
      (v) => v.documentId === doc.id && v.version === doc.currentVersion,
    )
    if (!hasVersion) {
      const bodyMd = buildDraftBody(meta.type, company)
      store.legal.versions.push({
        id: newId('lver'),
        documentId: doc.id,
        type: meta.type,
        version: doc.currentVersion || '1.0.0',
        title: meta.title,
        bodyMarkdown: bodyMd,
        bodyHtml: markdownToHtml(bodyMd),
        status: 'published',
        publishedAt: publishedAt,
        revisionAt: publishedAt,
        supersedes: null,
        createdAt: publishedAt,
      })
      seeded = true
    }
  }

  if (seeded && !store.legal.seededAt) store.legal.seededAt = publishedAt
  return store.legal
}

function clientMeta(req, body = {}) {
  const ua = String(body.userAgent || req.headers?.['user-agent'] || '')
  const ip =
    String(body.ip || '').trim() ||
    String(req.headers?.['x-forwarded-for'] || '')
      .split(',')[0]
      .trim() ||
    req.socket?.remoteAddress ||
    '—'
  const lang = String(
    body.language || body.lang || req.headers?.['accept-language']?.split(',')[0] || 'tr',
  ).slice(0, 16)

  let browser = '—'
  let os = '—'
  let device = 'desktop'
  const lower = ua.toLowerCase()
  if (/mobile|android|iphone|ipad/.test(lower))
    device = /ipad|tablet/.test(lower) ? 'tablet' : 'mobile'
  if (/edg\//.test(lower)) browser = 'Edge'
  else if (/chrome\//.test(lower)) browser = 'Chrome'
  else if (/safari\//.test(lower) && !/chrome\//.test(lower)) browser = 'Safari'
  else if (/firefox\//.test(lower)) browser = 'Firefox'
  else if (ua) browser = ua.slice(0, 40)
  if (/windows/.test(lower)) os = 'Windows'
  else if (/mac os|macintosh/.test(lower)) os = 'macOS'
  else if (/android/.test(lower)) os = 'Android'
  else if (/iphone|ipad|ios/.test(lower)) os = 'iOS'
  else if (/linux/.test(lower)) os = 'Linux'

  return {
    ip,
    userAgent: ua.slice(0, 500),
    browser: String(body.browser || browser),
    os: String(body.os || os),
    device: String(body.device || device),
    language: lang,
  }
}

function bumpVersion(current) {
  const parts = String(current || '1.0.0')
    .split('.')
    .map((n) => Number(n) || 0)
  while (parts.length < 3) parts.push(0)
  parts[2] += 1
  return parts.join('.')
}

function publishedVersion(store, doc) {
  return (
    store.legal.versions.find(
      (v) =>
        v.documentId === doc.id &&
        v.version === doc.currentVersion &&
        (v.status === 'published' || !v.status),
    ) ||
    store.legal.versions
      .filter((v) => v.documentId === doc.id && (v.status === 'published' || !v.status))
      .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))[0] ||
    null
  )
}

function publicDocPayload(store, doc) {
  const ver = publishedVersion(store, doc)
  return {
    id: doc.id,
    type: doc.type,
    slug: doc.slug,
    title: doc.title,
    aliases: doc.aliases || [],
    status: doc.status,
    version: ver?.version || doc.currentVersion,
    publishedAt: ver?.publishedAt || null,
    revisionAt: ver?.revisionAt || ver?.publishedAt || null,
    bodyMarkdown: ver?.bodyMarkdown || '',
    bodyHtml: ver?.bodyHtml || markdownToHtml(ver?.bodyMarkdown || ''),
    path: `/${doc.slug}`,
  }
}

export function getOutstandingConsents(store, accountId, pack = 'app') {
  ensureLegalStore(store)
  const types = CONSENT_PACKS[pack] || CONSENT_PACKS.app
  const consents = (store.legal.consents || []).filter(
    (c) => c.accountId === accountId && c.accepted,
  )
  const outstanding = []
  for (const type of types) {
    const doc = store.legal.documents.find((d) => d.type === type && d.status === 'published')
    if (!doc) continue
    // Demo users: skip purchase-only docs unless pack asks for them
    const ver = publishedVersion(store, doc)
    if (!ver) continue
    const accepted = consents.find((c) => c.type === type && c.version === ver.version)
    if (!accepted) {
      outstanding.push({
        type,
        slug: doc.slug,
        title: doc.title,
        version: ver.version,
        path: `/${doc.slug}`,
      })
    }
  }
  return outstanding
}

function filterAppPackForAccount(store, account) {
  const packTypes = [...CONSENT_PACKS.app]
  if (account?.role === 'demo_lead') {
    return packTypes.filter((t) => CONSENT_PACKS.demo.includes(t))
  }
  // Paid / registered: don't force demo_terms
  return packTypes.filter((t) => t !== 'demo_terms')
}

export function getOutstandingForAccount(store, account) {
  ensureLegalStore(store)
  const types = filterAppPackForAccount(store, account)
  const consents = (store.legal.consents || []).filter(
    (c) => c.accountId === account.id && c.accepted,
  )
  const outstanding = []
  for (const type of types) {
    const doc = store.legal.documents.find((d) => d.type === type && d.status === 'published')
    if (!doc) continue
    const ver = publishedVersion(store, doc)
    if (!ver) continue
    const accepted = consents.find((c) => c.type === type && c.version === ver.version)
    if (!accepted) {
      outstanding.push({
        type,
        slug: doc.slug,
        title: doc.title,
        version: ver.version,
        path: `/${doc.slug}`,
        bodyMarkdown: ver.bodyMarkdown,
        bodyHtml: ver.bodyHtml || markdownToHtml(ver.bodyMarkdown || ''),
      })
    }
  }
  return outstanding
}

function recordConsents(store, { accountId, customerId, items, context, meta, email }) {
  ensureLegalStore(store)
  const saved = []
  const at = nowIso()
  for (const item of items) {
    const type = String(item.type || '').trim()
    const version = String(item.version || '').trim()
    if (!type || !version) {
      const err = new Error('Sözleşme türü ve versiyon zorunludur')
      err.code = 'INVALID_CONSENT'
      err.status = 400
      throw err
    }
    const doc = store.legal.documents.find((d) => d.type === type)
    if (!doc || doc.status !== 'published') {
      const err = new Error(`Yayında sözleşme bulunamadı: ${type}`)
      err.code = 'DOC_NOT_FOUND'
      err.status = 400
      throw err
    }
    const ver = publishedVersion(store, doc)
    if (!ver || ver.version !== version) {
      const err = new Error(
        `Geçersiz veya güncel olmayan versiyon: ${doc.title} (beklenen ${ver?.version || '—'})`,
      )
      err.code = 'VERSION_MISMATCH'
      err.status = 400
      throw err
    }
    if (!item.accepted) {
      const err = new Error(`${doc.title} kabul edilmeden devam edilemez`)
      err.code = 'NOT_ACCEPTED'
      err.status = 400
      throw err
    }

    const row = {
      id: newId('lcon'),
      accountId: accountId || null,
      customerId: customerId || null,
      email: email || null,
      type,
      documentId: doc.id,
      version: ver.version,
      title: doc.title,
      context: context || 'general',
      accepted: true,
      ip: meta.ip,
      userAgent: meta.userAgent,
      browser: meta.browser,
      os: meta.os,
      device: meta.device,
      language: meta.language,
      acceptedAt: at,
      date: at.slice(0, 10),
      time: at.slice(11, 19),
    }
    store.legal.consents.unshift(row)
    saved.push(row)
  }
  store.legal.consents = store.legal.consents.slice(0, 20000)
  return saved
}

function validatePackAccepted(store, pack, items) {
  const required = CONSENT_PACKS[pack] || []
  const map = new Map((items || []).map((i) => [i.type, i]))
  for (const type of required) {
    const item = map.get(type)
    if (!item?.accepted) {
      const meta = LEGAL_DOC_TYPES.find((d) => d.type === type)
      const err = new Error(`${meta?.title || type} kabul edilmelidir`)
      err.code = 'CONSENT_REQUIRED'
      err.status = 400
      throw err
    }
    const doc = store.legal.documents.find((d) => d.type === type)
    const ver = doc ? publishedVersion(store, doc) : null
    if (!ver || item.version !== ver.version) {
      const err = new Error(`${meta?.title || type} için güncel versiyon kabul edilmelidir`)
      err.code = 'VERSION_MISMATCH'
      err.status = 400
      throw err
    }
  }
}

export function recordConsentBatch(store, opts) {
  return recordConsents(store, opts)
}

export function assertPackConsents(store, pack, items) {
  ensureLegalStore(store)
  validatePackAccepted(store, pack, items)
}

/**
 * Handle /api/legal/* — returns true if handled.
 */
export async function handleLegalApi(req, res, path, body = {}) {
  if (!path.startsWith('legal')) return false
  const method = req.method
  const parts = path.split('/').filter(Boolean)
  // legal | legal/documents | legal/documents/:slug | ...

  if (method === 'GET' && (path === 'legal' || path === 'legal/documents')) {
    const store = await loadStore()
    ensureLegalStore(store)
    const docs = store.legal.documents
      .filter((d) => d.status === 'published')
      .map((d) => {
        const payload = publicDocPayload(store, d)
        return {
          id: payload.id,
          type: payload.type,
          slug: payload.slug,
          title: payload.title,
          version: payload.version,
          publishedAt: payload.publishedAt,
          revisionAt: payload.revisionAt,
          path: payload.path,
        }
      })
    return sendJson(req, res, 200, {
      ok: true,
      lawyerNotice: LAWYER_NOTICE,
      company: store.legal.company,
      documents: docs,
      packs: CONSENT_PACKS,
    })
  }

  if (method === 'GET' && parts[0] === 'legal' && parts[1] === 'documents' && parts[2]) {
    const store = await loadStore()
    ensureLegalStore(store)
    const key = parts[2]
    const doc =
      store.legal.documents.find((d) => d.slug === key || d.type === key) ||
      store.legal.documents.find((d) => (d.aliases || []).includes(key)) ||
      (() => {
        const meta = resolveDocMeta(key)
        return meta ? store.legal.documents.find((d) => d.type === meta.type) : null
      })()
    if (!doc || doc.status !== 'published') {
      return sendJson(req, res, 404, {
        ok: false,
        error: 'NOT_FOUND',
        message: 'Sözleşme bulunamadı',
      })
    }
    return sendJson(req, res, 200, {
      ok: true,
      lawyerNotice: LAWYER_NOTICE,
      company: store.legal.company,
      document: publicDocPayload(store, doc),
    })
  }

  if (method === 'GET' && path === 'legal/pack') {
    let pack = 'purchase'
    try {
      const url = new URL(String(req.url || ''), 'http://localhost')
      pack = url.searchParams.get('pack') || pack
    } catch {
      /* ignore */
    }
    if (req.query?.pack) pack = String(req.query.pack)
    const store = await loadStore()
    ensureLegalStore(store)
    const types = CONSENT_PACKS[pack] || []
    const documents = types
      .map((type) => store.legal.documents.find((d) => d.type === type))
      .filter(Boolean)
      .map((d) => publicDocPayload(store, d))
    return sendJson(req, res, 200, {
      ok: true,
      pack,
      lawyerNotice: LAWYER_NOTICE,
      documents,
    })
  }

  if (method === 'GET' && path === 'legal/required') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    ensureLegalStore(store)
    const session = getAccountFromToken(store, token)
    if (!session) {
      return sendJson(req, res, 401, {
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Oturum bulunamadı',
      })
    }
    const outstanding = getOutstandingForAccount(store, session.account)
    return sendJson(req, res, 200, {
      ok: true,
      mustAccept: outstanding.length > 0,
      outstanding,
      lawyerNotice: LAWYER_NOTICE,
    })
  }

  if (method === 'GET' && path === 'legal/consents/me') {
    const token = getBearerOrCookieToken(req)
    const store = await loadStore()
    ensureLegalStore(store)
    const session = getAccountFromToken(store, token)
    if (!session) {
      return sendJson(req, res, 401, {
        ok: false,
        error: 'UNAUTHORIZED',
        message: 'Oturum bulunamadı',
      })
    }
    const rows = store.legal.consents.filter((c) => c.accountId === session.account.id)
    return sendJson(req, res, 200, { ok: true, consents: rows })
  }

  if (method === 'POST' && path === 'legal/consents') {
    const meta = clientMeta(req, body)
    const pack = String(body.pack || '').trim()
    const items = Array.isArray(body.consents) ? body.consents : []
    try {
      const result = await withStore((store) => {
        ensureLegalStore(store)
        const token = getBearerOrCookieToken(req)
        const session = token ? getAccountFromToken(store, token) : null
        let accountId = session?.account?.id || body.accountId || null
        let customerId = session?.account?.customerId || body.customerId || null
        const email =
          session?.account?.email ||
          String(body.email || '')
            .trim()
            .toLowerCase() ||
          null

        if (pack === 'purchase' || pack === 'demo' || pack === 'register') {
          validatePackAccepted(store, pack, items)
        }

        // Pre-auth register/demo: allow email-bound consents without session
        if (!accountId && !email && !body.allowAnonymous) {
          const err = new Error('Onay kaydı için oturum veya e-posta gerekli')
          err.code = 'UNAUTHORIZED'
          err.status = 401
          throw err
        }

        const saved = recordConsents(store, {
          accountId,
          customerId,
          email,
          items: items.map((i) => ({
            type: i.type,
            version: i.version,
            accepted: Boolean(i.accepted),
          })),
          context: body.context || pack || 'general',
          meta,
        })
        return {
          saved,
          outstanding: accountId ? getOutstandingForAccount(store, session.account) : [],
        }
      })
      return sendJson(req, res, 200, {
        ok: true,
        consents: result.saved,
        mustAccept: (result.outstanding || []).length > 0,
        outstanding: result.outstanding || [],
      })
    } catch (err) {
      return sendJson(req, res, err.status || 400, {
        ok: false,
        error: err.code || 'CONSENT_FAILED',
        message: err.message,
      })
    }
  }

  if (method === 'POST' && path === 'legal/cookies') {
    const meta = clientMeta(req, body)
    const prefs = {
      necessary: true,
      preferences: Boolean(body.preferences),
      statistics: Boolean(body.statistics),
      marketing: Boolean(body.marketing),
    }
    try {
      const row = await withStore((store) => {
        ensureLegalStore(store)
        const token = getBearerOrCookieToken(req)
        const session = token ? getAccountFromToken(store, token) : null
        const entry = {
          id: newId('lcook'),
          accountId: session?.account?.id || null,
          visitorId: String(body.visitorId || '').slice(0, 64) || null,
          ...prefs,
          ip: meta.ip,
          userAgent: meta.userAgent,
          language: meta.language,
          updatedAt: nowIso(),
        }
        store.legal.cookiePreferences.unshift(entry)
        store.legal.cookiePreferences = store.legal.cookiePreferences.slice(0, 5000)
        return entry
      })
      return sendJson(req, res, 200, { ok: true, preferences: row })
    } catch (err) {
      return sendJson(req, res, 400, {
        ok: false,
        error: err.code || 'COOKIE_FAILED',
        message: err.message,
      })
    }
  }

  // ——— Staff admin ———
  if (parts[1] === 'admin') {
    const gate = requireStaffOrReject(req, path, method)
    if (!gate.ok) {
      return sendJson(req, res, gate.status || 401, {
        ok: false,
        error: gate.error || 'UNAUTHORIZED',
        message: gate.message || 'Yetkisiz',
      })
    }

    if (method === 'GET' && path === 'legal/admin/company') {
      const store = await loadStore()
      ensureLegalStore(store)
      return sendJson(req, res, 200, {
        ok: true,
        company: store.legal.company,
        lawyerNotice: LAWYER_NOTICE,
      })
    }

    if (method === 'PUT' && path === 'legal/admin/company') {
      const updated = await withStore((store) => {
        ensureLegalStore(store)
        store.legal.company = {
          ...store.legal.company,
          legalName: String(body.legalName || store.legal.company.legalName).trim(),
          brandName: String(body.brandName || store.legal.company.brandName).trim(),
          location: String(body.location || store.legal.company.location).trim(),
          country: String(body.country || store.legal.company.country).trim(),
          contactEmail: String(body.contactEmail || store.legal.company.contactEmail).trim(),
          supportEmail: String(body.supportEmail || store.legal.company.supportEmail).trim(),
          kvkkEmail: String(body.kvkkEmail || store.legal.company.kvkkEmail).trim(),
          webUrl: String(body.webUrl || store.legal.company.webUrl).trim(),
          appUrl: String(body.appUrl || store.legal.company.appUrl).trim(),
          updatedAt: nowIso(),
        }
        return store.legal.company
      })
      return sendJson(req, res, 200, { ok: true, company: updated, lawyerNotice: LAWYER_NOTICE })
    }

    if (method === 'GET' && path === 'legal/admin/documents') {
      const store = await loadStore()
      ensureLegalStore(store)
      const documents = store.legal.documents.map((d) => {
        const versions = store.legal.versions
          .filter((v) => v.documentId === d.id)
          .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
          .map((v) => ({
            id: v.id,
            version: v.version,
            status: v.status,
            publishedAt: v.publishedAt,
            revisionAt: v.revisionAt,
            supersedes: v.supersedes,
          }))
        return {
          ...d,
          versions,
          current: publicDocPayload(store, d),
        }
      })
      return sendJson(req, res, 200, {
        ok: true,
        lawyerNotice: LAWYER_NOTICE,
        company: store.legal.company,
        documents,
      })
    }

    if (
      method === 'GET' &&
      parts[0] === 'legal' &&
      parts[1] === 'admin' &&
      parts[2] === 'documents' &&
      parts[3]
    ) {
      const store = await loadStore()
      ensureLegalStore(store)
      const doc = store.legal.documents.find(
        (d) => d.id === parts[3] || d.slug === parts[3] || d.type === parts[3],
      )
      if (!doc) {
        return sendJson(req, res, 404, { ok: false, error: 'NOT_FOUND' })
      }
      const versions = store.legal.versions
        .filter((v) => v.documentId === doc.id)
        .sort((a, b) => String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')))
      return sendJson(req, res, 200, {
        ok: true,
        lawyerNotice: LAWYER_NOTICE,
        document: doc,
        versions,
        current: publicDocPayload(store, doc),
      })
    }

    if (
      method === 'PUT' &&
      parts[0] === 'legal' &&
      parts[1] === 'admin' &&
      parts[2] === 'documents' &&
      parts[3] &&
      !parts[4]
    ) {
      try {
        const updated = await withStore((store) => {
          ensureLegalStore(store)
          const doc = store.legal.documents.find(
            (d) => d.id === parts[3] || d.slug === parts[3] || d.type === parts[3],
          )
          if (!doc) {
            const err = new Error('Sözleşme bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          if (body.title) doc.title = String(body.title).trim()
          if (body.status === 'published' || body.status === 'draft') doc.status = body.status
          doc.updatedAt = nowIso()

          // Save draft body without publishing if publish !== true
          if (body.bodyMarkdown != null) {
            const draftVersion = String(body.draftVersion || bumpVersion(doc.currentVersion))
            const existingDraft = store.legal.versions.find(
              (v) => v.documentId === doc.id && v.version === draftVersion && v.status === 'draft',
            )
            const md = String(body.bodyMarkdown)
            if (existingDraft) {
              existingDraft.bodyMarkdown = md
              existingDraft.bodyHtml = markdownToHtml(md)
              existingDraft.revisionAt = nowIso()
              existingDraft.title = doc.title
            } else if (!body.publish) {
              store.legal.versions.push({
                id: newId('lver'),
                documentId: doc.id,
                type: doc.type,
                version: draftVersion,
                title: doc.title,
                bodyMarkdown: md,
                bodyHtml: markdownToHtml(md),
                status: 'draft',
                publishedAt: null,
                revisionAt: nowIso(),
                supersedes: doc.currentVersion,
                createdAt: nowIso(),
              })
            }
          }

          if (body.publish) {
            const nextVer = String(body.version || bumpVersion(doc.currentVersion))
            const md =
              body.bodyMarkdown != null
                ? String(body.bodyMarkdown)
                : publishedVersion(store, doc)?.bodyMarkdown ||
                  buildDraftBody(doc.type, store.legal.company)
            const at = nowIso()
            store.legal.versions.push({
              id: newId('lver'),
              documentId: doc.id,
              type: doc.type,
              version: nextVer,
              title: doc.title,
              bodyMarkdown: md,
              bodyHtml: markdownToHtml(md),
              status: 'published',
              publishedAt: at,
              revisionAt: at,
              supersedes: doc.currentVersion,
              createdAt: at,
            })
            doc.currentVersion = nextVer
            doc.status = 'published'
            doc.updatedAt = at
          }

          return {
            document: doc,
            current: publicDocPayload(store, doc),
            versions: store.legal.versions.filter((v) => v.documentId === doc.id),
          }
        })
        return sendJson(req, res, 200, { ok: true, lawyerNotice: LAWYER_NOTICE, ...updated })
      } catch (err) {
        return sendJson(req, res, err.status || 400, {
          ok: false,
          error: err.code || 'UPDATE_FAILED',
          message: err.message,
        })
      }
    }

    if (
      method === 'POST' &&
      parts[0] === 'legal' &&
      parts[1] === 'admin' &&
      parts[2] === 'documents' &&
      parts[3] &&
      parts[4] === 'publish'
    ) {
      try {
        const updated = await withStore((store) => {
          ensureLegalStore(store)
          const doc = store.legal.documents.find(
            (d) => d.id === parts[3] || d.slug === parts[3] || d.type === parts[3],
          )
          if (!doc) {
            const err = new Error('Sözleşme bulunamadı')
            err.status = 404
            err.code = 'NOT_FOUND'
            throw err
          }
          const nextVer = String(body.version || bumpVersion(doc.currentVersion))
          const md =
            body.bodyMarkdown != null
              ? String(body.bodyMarkdown)
              : publishedVersion(store, doc)?.bodyMarkdown ||
                buildDraftBody(doc.type, store.legal.company)
          const at = nowIso()
          store.legal.versions.push({
            id: newId('lver'),
            documentId: doc.id,
            type: doc.type,
            version: nextVer,
            title: doc.title,
            bodyMarkdown: md,
            bodyHtml: markdownToHtml(md),
            status: 'published',
            publishedAt: at,
            revisionAt: at,
            supersedes: doc.currentVersion,
            createdAt: at,
          })
          doc.currentVersion = nextVer
          doc.status = 'published'
          doc.updatedAt = at
          return { document: doc, current: publicDocPayload(store, doc) }
        })
        return sendJson(req, res, 200, { ok: true, lawyerNotice: LAWYER_NOTICE, ...updated })
      } catch (err) {
        return sendJson(req, res, err.status || 400, {
          ok: false,
          error: err.code || 'PUBLISH_FAILED',
          message: err.message,
        })
      }
    }

    if (method === 'GET' && path === 'legal/admin/consents') {
      const store = await loadStore()
      ensureLegalStore(store)
      let rows = [...store.legal.consents]
      const q = body // unused; query via req
      const query = {}
      try {
        const url = new URL(String(req.url || ''), 'http://localhost')
        for (const [k, v] of url.searchParams.entries()) query[k] = v
      } catch {
        /* ignore */
      }
      if (req.query && typeof req.query === 'object') {
        for (const [k, v] of Object.entries(req.query)) {
          if (k === 'path') continue
          query[k] = Array.isArray(v) ? v[0] : v
        }
      }
      if (query.accountId) rows = rows.filter((r) => r.accountId === query.accountId)
      if (query.customerId) rows = rows.filter((r) => r.customerId === query.customerId)
      if (query.type) rows = rows.filter((r) => r.type === query.type)
      if (query.email) {
        const e = String(query.email).toLowerCase()
        rows = rows.filter((r) =>
          String(r.email || '')
            .toLowerCase()
            .includes(e),
        )
      }
      if (query.q) {
        const s = String(query.q).toLowerCase()
        rows = rows.filter(
          (r) =>
            String(r.email || '')
              .toLowerCase()
              .includes(s) ||
            String(r.accountId || '')
              .toLowerCase()
              .includes(s) ||
            String(r.ip || '').includes(s) ||
            String(r.title || '')
              .toLowerCase()
              .includes(s),
        )
      }
      const limit = Math.min(Number(query.limit) || 200, 1000)
      rows = rows.slice(0, limit)
      return sendJson(req, res, 200, {
        ok: true,
        lawyerNotice: LAWYER_NOTICE,
        total: store.legal.consents.length,
        consents: rows,
      })
    }

    return sendJson(req, res, 404, {
      ok: false,
      error: 'NOT_FOUND',
      message: 'Legal admin route yok',
    })
  }

  return sendJson(req, res, 404, { ok: false, error: 'NOT_FOUND', message: 'Legal route yok' })
}

export { LAWYER_NOTICE, CONSENT_PACKS, LEGAL_DOC_TYPES }
