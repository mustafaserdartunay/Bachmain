/**
 * Production e-document API for yonetim.bachmain.com/api.
 * Tenant-scoped Nilvera proxy. API keys never leave the server.
 */
import crypto from 'node:crypto'
import { getSql, hasDatabase } from './db.mjs'
import { sendJson } from './authRoutes.mjs'
import { getBearerOrCookieToken, getAccountFromToken } from './auth.mjs'
import { loadStore } from './store.mjs'
import { getStaffSession, staffAuthEnabled } from './staffAuth.mjs'

const BASE = {
  TEST: 'https://apitest.nilvera.com',
  PRODUCTION: 'https://api.nilvera.com',
}

function sanitizeApiKey(raw) {
  let value = String(raw || '').trim()
  value = value.replace(/^Bearer\s+/i, '').trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value.replace(/\s+/g, '')
}

function encKey() {
  const raw =
    process.env.EDOCUMENTS_ENCRYPTION_KEY || process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET
  if (!raw)
    throw Object.assign(new Error('EDOCUMENTS_ENCRYPTION_KEY veya JWT_SECRET gerekli'), {
      status: 500,
    })
  return crypto.createHash('sha256').update(raw).digest()
}

function encryptApiKey(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', encKey(), iv)
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

function decryptApiKey(payload) {
  const [ivB64, tagB64, dataB64] = String(payload || '').split('.')
  if (!ivB64 || !tagB64 || !dataB64)
    throw Object.assign(new Error('Kayıtlı anahtar okunamadı'), { status: 500 })
  const decipher = crypto.createDecipheriv('aes-256-gcm', encKey(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

function fingerprint(apiKey) {
  const raw = sanitizeApiKey(apiKey)
  if (raw.length < 8) return '****'
  return `${raw.slice(0, 4)}…${raw.slice(-4)}`
}

function userError(status, body) {
  if (status === 401) {
    return 'Nilvera API anahtarı geçersiz. Portal şifresi değil, API Tanımları’ndan üretilen anahtarı yapıştırın. TEST anahtarı yalnızca Test ortamında, canlı anahtar yalnızca Canlı ortamda çalışır.'
  }
  if (status === 403) {
    return 'API anahtarının Company / e-Fatura yetkisi yok. Nilvera Portal → API Tanımları’nda yetkileri açıp yeni anahtar üretin.'
  }
  if (status === 404) return 'Belge veya kayıt Nilvera üzerinde bulunamadı.'
  if (status === 409)
    return 'Bu fatura daha önce gönderilmiş olabilir. Yinelenen gönderim engellendi.'
  if (status === 422) {
    return 'Fatura bilgileri iş kurallarına uymuyor. Vergi numarası, satırlar ve tutarlar kontrol edilmelidir.'
  }
  if (status === 400) {
    const msg = Array.isArray(body) ? body.slice(0, 3).join(' ') : body?.Message || body?.message
    return msg
      ? `Fatura gönderilemedi. Nedeni: ${String(msg).slice(0, 280)}`
      : 'Fatura gönderilemedi. Nedeni: Vergi numarası veya fatura bilgileri kontrol edilmelidir.'
  }
  return 'Nilvera servisine şu anda ulaşılamıyor. Lütfen tekrar deneyin.'
}

async function nilveraFetch({ apiKey, environment, method = 'GET', path, query, body, binary }) {
  const key = sanitizeApiKey(apiKey)
  const url = new URL(path.replace(/^\//, ''), `${BASE[environment] || BASE.TEST}/`)
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  const retries = method === 'GET' ? 3 : 1
  let last
  for (let i = 1; i <= retries; i += 1) {
    try {
      const res = await fetch(url.toString(), {
        method,
        headers: {
          Authorization: `Bearer ${key}`,
          Accept: binary ? 'application/octet-stream' : 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (binary) {
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          const err = new Error(userError(res.status, text))
          err.status = res.status
          throw err
        }
        return Buffer.from(await res.arrayBuffer())
      }
      const text = await res.text()
      let parsed = text
      try {
        parsed = text ? JSON.parse(text) : null
      } catch {
        parsed = text
      }
      if (!res.ok) {
        const err = new Error(userError(res.status, parsed))
        err.status = res.status
        throw err
      }
      return parsed
    } catch (err) {
      last = err
      if (method !== 'GET' || i === retries || (err.status >= 400 && err.status < 500)) break
      await new Promise((r) => setTimeout(r, 250 * i))
    }
  }
  throw last
}

async function ensureEdocSchema() {
  const sql = getSql()
  if (!sql) return false
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto`
  } catch {
    /* Neon often already has gen_random_uuid() */
  }
  await sql`CREATE TABLE IF NOT EXISTS e_document_connections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL,
    branch_id text,
    provider text NOT NULL DEFAULT 'nilvera',
    environment text NOT NULL DEFAULT 'TEST',
    encrypted_api_key text,
    api_key_fingerprint text,
    status text NOT NULL DEFAULT 'disconnected',
    last_test_at timestamptz,
    last_sync_at timestamptz,
    last_error text,
    company_title text,
    tax_number text,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
  )`
  await sql`CREATE TABLE IF NOT EXISTS e_documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL,
    branch_id text,
    invoice_id text,
    provider text NOT NULL DEFAULT 'nilvera',
    document_type text NOT NULL,
    direction text NOT NULL DEFAULT 'outgoing',
    external_id text,
    uuid text,
    invoice_number text,
    status text NOT NULL DEFAULT 'DRAFT',
    provider_status text,
    answer_code text,
    currency text NOT NULL DEFAULT 'TRY',
    amount numeric(18,2) NOT NULL DEFAULT 0,
    tax_amount numeric(18,2) NOT NULL DEFAULT 0,
    issue_date timestamptz,
    sent_at timestamptz,
    received_at timestamptz,
    party_name text,
    party_tax_number text,
    pdf_url text,
    xml_url text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
  )`
  await sql`CREATE TABLE IF NOT EXISTS e_document_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    e_document_id uuid,
    company_id text NOT NULL,
    event_type text NOT NULL,
    old_status text,
    new_status text,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`
  await sql`CREATE TABLE IF NOT EXISTS e_document_sync_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL,
    provider text NOT NULL DEFAULT 'nilvera',
    sync_type text NOT NULL,
    status text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    finished_at timestamptz,
    records_processed integer NOT NULL DEFAULT 0,
    error text
  )`
  await sql`CREATE TABLE IF NOT EXISTS e_document_api_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id text NOT NULL,
    provider text NOT NULL DEFAULT 'nilvera',
    request_type text NOT NULL,
    endpoint text NOT NULL,
    duration_ms integer,
    success boolean NOT NULL DEFAULT false,
    http_status integer,
    external_uuid text,
    error text,
    created_at timestamptz NOT NULL DEFAULT now()
  )`
  await sql`CREATE INDEX IF NOT EXISTS e_doc_conn_company_idx ON e_document_connections (company_id, status)`
  await sql`CREATE INDEX IF NOT EXISTS e_docs_company_status_idx ON e_documents (company_id, status, created_at)`
  await sql`CREATE INDEX IF NOT EXISTS e_docs_company_uuid_idx ON e_documents (company_id, uuid)`
  await sql`CREATE TABLE IF NOT EXISTS e_document_platform (
    id text PRIMARY KEY,
    encrypted_api_key_test text,
    encrypted_api_key_live text,
    fingerprint_test text,
    fingerprint_live text,
    status text NOT NULL DEFAULT 'disconnected',
    last_test_at timestamptz,
    last_error text,
    company_title text,
    tax_number text,
    meta jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
  )`
  return true
}

function normalizeTax(value) {
  return String(value || '').replace(/\D/g, '')
}

const NILVERA_TEST_PARTIES = {
  sender: {
    code: 'test01',
    name: 'Test Kurum Bir',
    taxNumber: '1234567801',
    aliasPk: 'urn:mail:defaultpk@nilvera.com',
    aliasGb: 'urn:mail:defaultgb@nilvera.com',
  },
  receiver: {
    code: 'test02',
    name: 'Test Kurum İki',
    taxNumber: '1234567802',
    aliasPk: 'urn:mail:defaultpk@nilvera.com',
    aliasGb: 'urn:mail:defaultgb@nilvera.com',
  },
}

function publicPlatform(row) {
  const parties = { testParties: NILVERA_TEST_PARTIES }
  if (!row) {
    return {
      configured: false,
      hasTestKey: false,
      hasLiveKey: false,
      status: 'disconnected',
      ...parties,
    }
  }
  return {
    configured: Boolean(row.encrypted_api_key_test || row.encrypted_api_key_live),
    hasTestKey: Boolean(row.encrypted_api_key_test),
    hasLiveKey: Boolean(row.encrypted_api_key_live),
    fingerprintTest: row.fingerprint_test,
    fingerprintLive: row.fingerprint_live,
    status: row.status,
    lastTestAt: row.last_test_at,
    lastError: row.last_error,
    companyTitle: row.company_title,
    taxNumber: row.tax_number,
    ...parties,
  }
}

function publicConn(row, platform = null) {
  if (!row) {
    return {
      status: 'disconnected',
      platformReady: Boolean(platform?.encrypted_api_key_test || platform?.encrypted_api_key_live),
      nextStep:
        'Firma bilgilerinizi kaydedin. Nilvera API anahtarı üye paneline girilmez; bağlantı yönetim sistemindedir.',
    }
  }
  const meta = { ...(row.meta || {}) }
  delete meta.apiKey
  delete meta.certificatePassword
  const env = row.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
  const platformReady = Boolean(
    env === 'PRODUCTION' ? platform?.encrypted_api_key_live : platform?.encrypted_api_key_test,
  )
  const signatureDeclared = Boolean(meta.signatureDeclared)
  return {
    id: row.id,
    companyId: row.company_id,
    provider: row.provider,
    environment: row.environment,
    status: row.status,
    lastTestAt: row.last_test_at,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    companyTitle: row.company_title,
    taxNumber: row.tax_number,
    taxOffice: meta.taxOffice || '',
    address: meta.address || '',
    district: meta.district || '',
    city: meta.city || '',
    postalCode: meta.postalCode || '',
    phone: meta.phone || '',
    email: meta.email || '',
    signatureType: meta.signatureType || '',
    signatureDeclared,
    nilveraMatched: Boolean(meta.nilveraMatched),
    platformReady,
    hasAssignedKey: Boolean(row.encrypted_api_key),
    nextStep: tenantNextStep(row, platformReady),
    meta,
  }
}

function tenantNextStep(row, platformReady) {
  if (!platformReady) {
    return 'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Yönetim paneli henüz Bachmain Nilvera bağlantısını yapmadı.'
  }
  if (!normalizeTax(row?.tax_number) || !row?.company_title) {
    return 'VKN/TCKN ve resmi unvanı kaydedin, mali mühür / e-imza / mobil imza beyanını işaretleyin, ardından Nilvera kontrolünü çalıştırın.'
  }
  if (!row?.meta?.signatureDeclared) {
    return 'e-Fatura için mali mühür (tüzel) veya e-imza / mobil imza (şahıs) sizin tarafınızdan alınır. Bachmain satmaz. Beyanı işaretleyip kontrol edin.'
  }
  if (row.status === 'connected') {
    return 'Nilvera kontrolü geçti. e-Fatura / e-Arşiv bu şirkette kullanılabilir.'
  }
  return (
    row.last_error ||
    'Nilvera kontrolü henüz tamamlanmadı. Kontrolü çalıştırın; eşleşme yoksa yönetim Nilvera portalında firmayı açar.'
  )
}

function mapStatus({ statusCode, answerCode, isCancel, direction }) {
  if (isCancel) return 'CANCELLED'
  const status = String(statusCode || '').toLowerCase()
  const answer = String(answerCode || '').toLowerCase()
  if (status === 'error') return 'ERROR'
  if (answer === 'rejected') return 'REJECTED'
  if (answer === 'approved' || answer === 'documentansweredautomatically') return 'ACCEPTED'
  if (status === 'waiting' || answer === 'waitingforapproval') return 'PROCESSING'
  if (status === 'succeed' || status === 'succeeded')
    return direction === 'incoming' ? 'RECEIVED' : 'SENT'
  return 'PROCESSING'
}

async function tenantSession(req) {
  const token = getBearerOrCookieToken(req)
  const store = await loadStore()
  const session = getAccountFromToken(store, token)
  if (!session?.user?.tenantCode) {
    const err = new Error('Üye oturumu gerekli')
    err.status = 401
    throw err
  }
  return session
}

async function getConn(companyId) {
  const sql = getSql()
  const rows = await sql`SELECT * FROM e_document_connections
    WHERE company_id = ${companyId} AND deleted_at IS NULL
    ORDER BY updated_at DESC LIMIT 1`
  return rows[0] || null
}

async function getPlatform() {
  const sql = getSql()
  const rows = await sql`SELECT * FROM e_document_platform WHERE id = 'nilvera' LIMIT 1`
  if (!rows[0]) {
    await sql`INSERT INTO e_document_platform (id) VALUES ('nilvera') ON CONFLICT (id) DO NOTHING`
  }
  const testEnv = sanitizeApiKey(
    process.env.NILVERA_PLATFORM_API_KEY_TEST || process.env.NILVERA_PLATFORM_API_KEY || '',
  )
  const liveEnv = sanitizeApiKey(process.env.NILVERA_PLATFORM_API_KEY_LIVE || '')
  if (testEnv.length >= 16 || liveEnv.length >= 16) {
    const current =
      (await sql`SELECT * FROM e_document_platform WHERE id = 'nilvera' LIMIT 1`)[0] || {}
    if (testEnv.length >= 16 && !current.encrypted_api_key_test) {
      const enc = encryptApiKey(testEnv)
      const fp = fingerprint(testEnv)
      await sql`UPDATE e_document_platform SET encrypted_api_key_test = ${enc}, fingerprint_test = ${fp}, updated_at = now() WHERE id = 'nilvera'`
      try {
        const company = await fetchCompanyInfo({ apiKey: testEnv, environment: 'TEST' })
        await sql`UPDATE e_document_platform SET
          status = 'connected', last_test_at = now(), last_error = null,
          company_title = ${company?.Name || null}, tax_number = ${company?.TaxNumber || null},
          updated_at = now() WHERE id = 'nilvera'`
      } catch (err) {
        await sql`UPDATE e_document_platform SET status = 'error', last_test_at = now(), last_error = ${err.message}, updated_at = now() WHERE id = 'nilvera'`
      }
    }
    if (liveEnv.length >= 16 && !current.encrypted_api_key_live) {
      const enc = encryptApiKey(liveEnv)
      const fp = fingerprint(liveEnv)
      await sql`UPDATE e_document_platform SET encrypted_api_key_live = ${enc}, fingerprint_live = ${fp}, updated_at = now() WHERE id = 'nilvera'`
    }
  }
  const again = await sql`SELECT * FROM e_document_platform WHERE id = 'nilvera' LIMIT 1`
  return again[0] || null
}

async function getPlatformKey(environment) {
  const row = await getPlatform()
  const env = environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
  const enc = env === 'PRODUCTION' ? row?.encrypted_api_key_live : row?.encrypted_api_key_test
  if (!enc) return null
  return {
    row,
    apiKey: sanitizeApiKey(decryptApiKey(enc)),
    environment: env,
  }
}

async function requireLive(companyId) {
  const row = await getConn(companyId)
  const environment = row?.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
  if (row?.encrypted_api_key) {
    return {
      row,
      apiKey: sanitizeApiKey(decryptApiKey(row.encrypted_api_key)),
      environment,
      source: 'assigned',
    }
  }
  const platform = await getPlatformKey(environment)
  if (!platform) {
    const err = new Error(
      'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Yönetim paneli → E-Dönüşüm üzerinden Bachmain Nilvera bağlantısı yapılmalı.',
    )
    err.status = 409
    err.code = 'NILVERA_NOT_CONFIGURED'
    throw err
  }
  if (row?.status !== 'connected') {
    const err = new Error(
      row?.last_error ||
        'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: E-Belge Ayarları’na firma bilgilerinizi girip Nilvera kontrolünden geçin.',
    )
    err.status = 409
    err.code = 'NILVERA_NOT_CONFIGURED'
    throw err
  }
  const platformTax = normalizeTax(platform.row?.tax_number)
  const tenantTax = normalizeTax(row.tax_number)
  if (!platformTax || platformTax !== tenantTax) {
    const err = new Error(
      'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Bu VKN, Bachmain Nilvera hesabının kendi firması değil. Yönetim, Nilvera portalında firmayı açıp bu üyeye özel anahtar atamalı.',
    )
    err.status = 409
    err.code = 'NILVERA_NOT_CONFIGURED'
    throw err
  }
  return { row, apiKey: platform.apiKey, environment, source: 'platform' }
}

async function matchTenantToNilvera(companyId) {
  const sql = getSql()
  const row = await getConn(companyId)
  const tax = normalizeTax(row?.tax_number)
  if (!row || tax.length < 10 || !row.company_title) {
    const err = new Error('VKN/TCKN (10 veya 11 hane) ve resmi unvan zorunludur.')
    err.status = 400
    throw err
  }
  const environment = row.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
  const platform = await getPlatformKey(environment)
  if (!platform) {
    const err = new Error(
      'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Yönetim paneli henüz Bachmain Nilvera API anahtarını kaydetmedi.',
    )
    err.status = 409
    err.code = 'NILVERA_NOT_CONFIGURED'
    throw err
  }

  let assignedCompany = null
  if (row.encrypted_api_key) {
    assignedCompany = await fetchCompanyInfo({
      apiKey: sanitizeApiKey(decryptApiKey(row.encrypted_api_key)),
      environment,
    })
  }

  const self = await fetchCompanyInfo({
    apiKey: platform.apiKey,
    environment,
  }).catch(() => null)
  let list = []
  try {
    list = asList(
      await nilveraFetch({
        apiKey: platform.apiKey,
        environment,
        path: '/general/Company/List',
      }),
    ).map((item) => pickCompany(item))
  } catch {
    list = []
  }

  const assignedTax = normalizeTax(assignedCompany?.TaxNumber)
  const selfTax = normalizeTax(self?.TaxNumber)
  const listHit = list.find((item) => normalizeTax(item?.TaxNumber) === tax)
  const signatureDeclared = Boolean(row.meta?.signatureDeclared)
  const signatureType = row.meta?.signatureType || ''

  let certificates = []
  const keyForCerts = row.encrypted_api_key
    ? sanitizeApiKey(decryptApiKey(row.encrypted_api_key))
    : selfTax === tax
      ? platform.apiKey
      : null
  if (keyForCerts) {
    certificates = asList(
      await nilveraFetch({
        apiKey: keyForCerts,
        environment,
        path: '/general/Company/Certificate',
      }).catch(() => []),
    )
  }

  const certOk = certificates.some((c) =>
    ['MALIMUHUR', 'EIMZA', 'HSM'].includes(String(c.Type || c.type || '').toUpperCase()),
  )

  let status = 'pending'
  let lastError = null
  let matched = false
  let title = row.company_title

  if (assignedTax && assignedTax === tax) {
    matched = true
    title = assignedCompany?.Name || title
    status = certOk || signatureDeclared ? 'connected' : 'pending'
    if (status === 'pending') {
      lastError =
        'Firma anahtarı eşleşti ancak Nilvera’da mali mühür / e-imza sertifikası görünmüyor. Sertifika portalda tanımlanmalı.'
    }
  } else if (selfTax && selfTax === tax) {
    matched = true
    title = self?.Name || title
    status = certOk || signatureDeclared ? 'connected' : 'pending'
    if (status === 'pending') {
      lastError =
        'Bachmain Nilvera firması bu VKN ile eşleşti; sertifika henüz Nilvera’da yok. Mali mühür / e-imza / mobil imza GİB sürecini tamamlayın.'
    }
  } else if (listHit) {
    matched = true
    title = listHit.Name || title
    status = 'pending'
    lastError =
      'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: VKN Nilvera Company/List içinde görünüyor. Gönderim bu firmanın GİB kimliğiyle olmalı; yönetim o firmaya özel API anahtarını E-Dönüşüm’den atamalı.'
  } else {
    status = 'pending'
    lastError =
      'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Bu VKN Nilvera’da yok. Çözüm ortağı portalında firma açılmalı, GİB e-Fatura/e-Arşiv aktivasyonu ve mali mühür veya e-imza / mobil imza tamamlanmalı.'
  }

  if (!signatureDeclared && status === 'connected') {
    status = 'pending'
    lastError =
      'Mali mühür / e-imza / mobil imza beyanı işaretlenmeden e-belge açılmaz. Bachmain bu imzayı satmaz.'
  }

  const meta = JSON.stringify({
    ...(row.meta || {}),
    nilveraMatched: matched,
    nilveraCompany: assignedCompany || self || listHit || null,
    certificates: certificates.map((c) => ({
      Type: c.Type || c.type,
      SerialNo: c.SerialNo || c.serialNo,
      EndDate: c.EndDate || c.endDate,
    })),
    signatureType,
    signatureDeclared,
    lastCheckAt: new Date().toISOString(),
  })

  await sql`UPDATE e_document_connections SET
    status = ${status},
    last_test_at = now(),
    last_error = ${lastError},
    company_title = ${title},
    meta = ${meta}::jsonb,
    updated_at = now()
    WHERE id = ${row.id}`

  return publicConn(await getConn(companyId), await getPlatform())
}

function asList(data) {
  if (Array.isArray(data)) return data
  return data?.Content || data?.content || data?.Companies || data?.companies || []
}

function pickCompany(data) {
  if (!data) return null
  if (Array.isArray(data)) return pickCompany(data[0])
  const nested = data.Content || data.content || data.Companies || data.companies
  if (Array.isArray(nested) && nested[0] && !data.Name && !data.TaxNumber) {
    return pickCompany(nested[0])
  }
  if (typeof data !== 'object') return null
  return {
    ...data,
    Name: data.Name || data.name || data.Title || data.title || null,
    TaxNumber: data.TaxNumber || data.taxNumber || data.VKN || null,
  }
}

async function fetchCompanyInfo({ apiKey, environment }) {
  try {
    return pickCompany(
      await nilveraFetch({
        apiKey,
        environment,
        path: '/general/Company',
      }),
    )
  } catch (err) {
    if (err.status === 401) throw err
    return pickCompany(
      await nilveraFetch({
        apiKey,
        environment,
        path: '/general/Company/List',
      }),
    )
  }
}

function toModel(payload, kind) {
  const uuid = payload.uuid || crypto.randomUUID()
  const lines = payload.lines || []
  const lineExtension = lines.reduce(
    (s, l) =>
      s +
      Math.max(
        0,
        (Number(l.quantity) || 0) * (Number(l.price) || 0) - (Number(l.allowanceTotal) || 0),
      ),
    0,
  )
  const kdv = lines.reduce((s, l) => {
    const net = Math.max(
      0,
      (Number(l.quantity) || 0) * (Number(l.price) || 0) - (Number(l.allowanceTotal) || 0),
    )
    return s + (l.kdvTotal != null ? Number(l.kdvTotal) : net * ((Number(l.kdvPercent) || 0) / 100))
  }, 0)
  const party = (p = {}) => ({
    TaxNumber: p.taxNumber || '',
    Name: p.name || '',
    TaxOffice: p.taxOffice || null,
    Address: p.address || null,
    District: p.district || null,
    City: p.city || 'İstanbul',
    Country: p.country || 'Türkiye',
    PostalCode: p.postalCode || null,
    Phone: p.phone || null,
    Mail: p.email || null,
  })
  const invoice = {
    InvoiceInfo: {
      UUID: uuid,
      InvoiceType: payload.invoiceType || 'SATIS',
      InvoiceSerieOrNumber: payload.invoiceNo || null,
      IssueDate: payload.issueDate || new Date().toISOString(),
      CurrencyCode: payload.currency || 'TRY',
      InvoiceProfile:
        kind === 'e-arsiv' ? 'EARSIVFATURA' : payload.invoiceProfile || 'TICARIFATURA',
      LineExtensionAmount: Math.round(lineExtension * 100) / 100,
      PayableAmount: Math.round((lineExtension + kdv) * 100) / 100,
      KdvTotal: Math.round(kdv * 100) / 100,
    },
    CompanyInfo: party(payload.company),
    CustomerInfo: party(payload.customer),
    InvoiceLines: lines.map((l, i) => ({
      Index: String(i + 1),
      Name: l.name,
      Quantity: Number(l.quantity) || 0,
      UnitType: l.unitType || 'C62',
      Price: Number(l.price) || 0,
      AllowanceTotal: Number(l.allowanceTotal) || 0,
      KDVPercent: Number(l.kdvPercent) || 0,
      KDVTotal: l.kdvTotal,
    })),
    Notes: Array.isArray(payload.notes) ? payload.notes : payload.notes ? [payload.notes] : [],
  }
  return kind === 'e-arsiv'
    ? {
        ArchiveInvoice: invoice,
        uuid,
        amount: invoice.InvoiceInfo.PayableAmount,
        tax: invoice.InvoiceInfo.KdvTotal,
      }
    : {
        EInvoice: invoice,
        CustomerAlias: null,
        uuid,
        amount: invoice.InvoiceInfo.PayableAmount,
        tax: invoice.InvoiceInfo.KdvTotal,
      }
}

async function logApi(companyId, requestType, endpoint, ok, extra = {}) {
  const sql = getSql()
  await sql`INSERT INTO e_document_api_logs (company_id, request_type, endpoint, success, http_status, error, duration_ms, external_uuid)
    VALUES (${companyId}, ${requestType}, ${endpoint}, ${ok}, ${extra.httpStatus || null}, ${extra.error || null}, ${extra.durationMs || null}, ${extra.uuid || null})`
}

function cronAuthorized(req, query = {}) {
  const secret = process.env.EDOCUMENTS_CRON_SECRET || process.env.CRON_SECRET
  if (!secret) return false
  const header = String(req.headers?.authorization || '')
  const alt = String(req.headers?.['x-cron-secret'] || query.secret || '')
  return header === `Bearer ${secret}` || alt === secret
}

async function syncInboxForCompany(companyId) {
  const sql = getSql()
  const live = await requireLive(companyId)
  const incoming = asList(
    await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      path: '/einvoice/Purchase',
      query: { Page: 1, PageSize: 50, SortColumn: 'IssueDate', SortType: 'DESC' },
    }),
  )
  const outgoing = asList(
    await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      path: '/einvoice/Sale',
      query: { Page: 1, PageSize: 50, SortColumn: 'IssueDate', SortType: 'DESC' },
    }),
  )
  const archive = asList(
    await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      path: '/earchive/Invoices',
      query: { Page: 1, PageSize: 50, SortColumn: 'IssueDate', SortType: 'DESC' },
    }),
  )
  let processed = 0
  const all = [
    ...incoming.map((r) => ({ r, direction: 'incoming', documentType: 'e-fatura' })),
    ...outgoing.map((r) => ({ r, direction: 'outgoing', documentType: 'e-fatura' })),
    ...archive.map((r) => ({ r, direction: 'outgoing', documentType: 'e-arsiv' })),
  ]
  for (const item of all) {
    const uuid = item.r.UUID
    if (!uuid) continue
    const status = mapStatus({
      statusCode: item.r.StatusCode,
      answerCode: item.r.AnswerCode,
      isCancel: item.r.IsCancel,
      direction: item.direction,
    })
    const partyName = item.direction === 'incoming' ? item.r.SenderName : item.r.ReceiverName
    const partyTax =
      item.direction === 'incoming' ? item.r.SenderTaxNumber : item.r.ReceiverTaxNumber
    const existing =
      await sql`SELECT id FROM e_documents WHERE company_id = ${companyId} AND uuid = ${uuid} LIMIT 1`
    if (existing[0]) {
      await sql`UPDATE e_documents SET status = ${status}, provider_status = ${item.r.StatusCode || null},
        invoice_number = ${item.r.InvoiceNumber || null}, amount = ${item.r.PayableAmount || 0},
        tax_amount = ${item.r.TaxTotalAmount || 0}, updated_at = now() WHERE id = ${existing[0].id}`
    } else {
      const meta = JSON.stringify({ providerRow: item.r })
      await sql`INSERT INTO e_documents (company_id, provider, document_type, direction, uuid, invoice_number, status, provider_status, currency, amount, tax_amount, issue_date, party_name, party_tax_number, received_at, metadata)
        VALUES (${companyId}, 'nilvera', ${item.documentType}, ${item.direction}, ${uuid}, ${item.r.InvoiceNumber || null}, ${status}, ${item.r.StatusCode || null}, ${item.r.CurrencyCode || 'TRY'}, ${item.r.PayableAmount || 0}, ${item.r.TaxTotalAmount || 0}, ${item.r.IssueDate || null}, ${partyName || null}, ${partyTax || null}, ${item.direction === 'incoming' ? new Date().toISOString() : null}, ${meta}::jsonb)`
    }
    processed += 1
  }
  await sql`UPDATE e_document_connections SET last_sync_at = now(), updated_at = now() WHERE company_id = ${companyId}`
  await sql`INSERT INTO e_document_sync_logs (company_id, sync_type, status, records_processed, finished_at)
    VALUES (${companyId}, 'inbox', 'ok', ${processed}, now())`
  return { ok: true, recordsProcessed: processed }
}

async function handleTenantOp(req, res, session, op, body, query) {
  const companyId = session.user.tenantCode
  const sql = getSql()

  if (op === 'connection' && req.method === 'GET') {
    return sendJson(req, res, 200, {
      ok: true,
      connection: publicConn(await getConn(companyId), await getPlatform()),
      platform: publicPlatform(await getPlatform()),
    })
  }

  if (op === 'connection' && (req.method === 'PUT' || req.method === 'POST')) {
    const environment = body.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
    const existing = await getConn(companyId)
    const taxNumber = normalizeTax(body.taxNumber)
    const companyTitle = String(body.companyTitle || body.name || '').trim()
    const signatureType = ['MALIMUHUR', 'EIMZA', 'MOBIL_IMZA'].includes(body.signatureType)
      ? body.signatureType
      : existing?.meta?.signatureType || ''
    const signatureDeclared = Boolean(body.signatureDeclared)
    if (taxNumber && taxNumber.length !== 10 && taxNumber.length !== 11) {
      return sendJson(req, res, 400, {
        ok: false,
        message: 'VKN 10, TCKN 11 haneli olmalıdır.',
      })
    }
    const meta = JSON.stringify({
      ...(existing?.meta || {}),
      taxOffice: body.taxOffice || '',
      address: body.address || '',
      district: body.district || '',
      city: body.city || '',
      postalCode: body.postalCode || '',
      phone: body.phone || '',
      email: body.email || '',
      signatureType,
      signatureDeclared,
    })
    if (existing) {
      await sql`UPDATE e_document_connections SET
        environment = ${environment},
        company_title = ${companyTitle || existing.company_title},
        tax_number = ${taxNumber || existing.tax_number},
        status = ${existing.status === 'connected' ? 'connected' : 'submitted'},
        meta = ${meta}::jsonb,
        updated_at = now()
        WHERE id = ${existing.id}`
    } else {
      await sql`INSERT INTO e_document_connections (company_id, provider, environment, company_title, tax_number, status, meta)
        VALUES (${companyId}, 'nilvera', ${environment}, ${companyTitle || null}, ${taxNumber || null}, 'submitted', ${meta}::jsonb)`
    }
    return sendJson(req, res, 200, {
      ok: true,
      connection: publicConn(await getConn(companyId), await getPlatform()),
    })
  }

  if (op === 'test' || op === 'onboard') {
    try {
      const connection = await matchTenantToNilvera(companyId)
      await logApi(
        companyId,
        'nilvera_check',
        'GET /general/Company',
        connection.status === 'connected',
      )
      return sendJson(req, res, 200, {
        ok: connection.status === 'connected',
        connection,
        environment: connection.environment,
      })
    } catch (err) {
      const existing = await getConn(companyId)
      if (existing) {
        await sql`UPDATE e_document_connections SET status = 'error', last_test_at = now(), last_error = ${err.message}, updated_at = now() WHERE id = ${existing.id}`
      }
      await logApi(companyId, 'nilvera_check', 'GET /general/Company', false, {
        error: err.message,
      })
      return sendJson(req, res, err.status || 400, {
        ok: false,
        error: err.code || 'CONNECTION_FAILED',
        message: err.message,
        connection: publicConn(await getConn(companyId), await getPlatform()),
      })
    }
  }

  if (op === 'taxpayer') {
    const taxNumber = String(query.taxNumber || body.taxNumber || '').replace(/\D/g, '')
    let live
    try {
      live = await requireLive(companyId)
    } catch {
      const row = await getConn(companyId)
      const env = row?.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
      live = await getPlatformKey(env)
    }
    if (!live) {
      return sendJson(req, res, 409, {
        ok: false,
        error: 'NILVERA_NOT_CONFIGURED',
        message:
          'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Yönetim paneli Bachmain Nilvera bağlantısını yapmalı.',
      })
    }
    const rows = await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      path: `/general/GlobalCompany/Check/TaxNumber/${taxNumber}`,
      query: { globalUserType: 'Invoice' },
    })
    const list = Array.isArray(rows) ? rows : []
    return sendJson(req, res, 200, {
      ok: true,
      isEInvoiceTaxpayer: list.length > 0,
      taxNumber,
      title: list[0]?.Title || list[0]?.Name || null,
      aliases: list.map((r) => r.Alias || r.Name).filter(Boolean),
      suggestedType: list.length > 0 ? 'e-fatura' : 'e-arsiv',
    })
  }

  if (op === 'credits') {
    const live = await requireLive(companyId)
    const credits = await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      path: '/general/Credits',
    })
    return sendJson(req, res, 200, { ok: true, credits: asList(credits) })
  }

  if (op === 'list') {
    const direction = query.direction || ''
    const documentType = query.documentType || ''
    const status = query.status || ''
    const search = String(query.search || '').toLowerCase()
    const rows =
      await sql`SELECT * FROM e_documents WHERE company_id = ${companyId} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 200`
    const filtered = rows.filter((row) => {
      if (direction && row.direction !== direction) return false
      if (documentType && row.document_type !== documentType) return false
      if (status && row.status !== status) return false
      if (search) {
        return [
          row.invoice_number,
          row.party_name,
          row.party_tax_number,
          row.uuid,
          row.status,
        ].some((v) =>
          String(v || '')
            .toLowerCase()
            .includes(search),
        )
      }
      return true
    })
    return sendJson(req, res, 200, { ok: true, rows: filtered })
  }

  if (op === 'get') {
    const id = query.id || body.id
    const rows =
      await sql`SELECT * FROM e_documents WHERE id = ${id} AND company_id = ${companyId} AND deleted_at IS NULL LIMIT 1`
    if (!rows[0]) return sendJson(req, res, 404, { ok: false, message: 'E-belge bulunamadı' })
    const events =
      await sql`SELECT * FROM e_document_events WHERE e_document_id = ${id} AND company_id = ${companyId} ORDER BY created_at DESC LIMIT 50`
    return sendJson(req, res, 200, { ok: true, document: rows[0], events })
  }

  if (op === 'create' || op === 'send') {
    const payload = body.payload || body
    const invoiceId = body.invoiceId || payload.invoiceId
    if (invoiceId) {
      const dup = await sql`SELECT id, uuid, status FROM e_documents
        WHERE company_id = ${companyId} AND invoice_id = ${invoiceId} AND direction = 'outgoing' AND deleted_at IS NULL
        AND status NOT IN ('DRAFT','ERROR') LIMIT 1`
      if (dup[0]) {
        return sendJson(req, res, 409, {
          ok: false,
          error: 'DUPLICATE_INVOICE',
          message: 'Bu Bachmain faturası için e-belge zaten gönderilmiş.',
          existingId: dup[0].id,
          uuid: dup[0].uuid,
        })
      }
    }
    if (!payload?.customer?.taxNumber || !payload?.customer?.name || !payload?.lines?.length) {
      return sendJson(req, res, 400, {
        ok: false,
        message:
          'Fatura gönderilemedi. Nedeni: Vergi numarası veya fatura bilgileri kontrol edilmelidir.',
      })
    }
    const live = await requireLive(companyId)
    let documentType = body.documentType || 'auto'
    if (documentType === 'auto') {
      const rows = await nilveraFetch({
        apiKey: live.apiKey,
        environment: live.environment,
        path: `/general/GlobalCompany/Check/TaxNumber/${String(payload.customer.taxNumber).replace(/\D/g, '')}`,
        query: { globalUserType: 'Invoice' },
      })
      documentType = Array.isArray(rows) && rows.length ? 'e-fatura' : 'e-arsiv'
    }
    const asDraft = Boolean(body.asDraft)
    const mapped = toModel(payload, documentType)
    const path = asDraft
      ? documentType === 'e-arsiv'
        ? '/earchive/Draft/Create'
        : '/einvoice/Draft/Create'
      : documentType === 'e-arsiv'
        ? '/earchive/Send/Model'
        : '/einvoice/Send/Model'
    const bodyToSend =
      documentType === 'e-arsiv'
        ? { ArchiveInvoice: mapped.ArchiveInvoice }
        : { EInvoice: mapped.EInvoice, CustomerAlias: null }
    try {
      const sent = await nilveraFetch({
        apiKey: live.apiKey,
        environment: live.environment,
        method: 'POST',
        path,
        body: bodyToSend,
      })
      const uuid = sent?.UUID || mapped.uuid
      const invoiceNumber = sent?.InvoiceNumber || payload.invoiceNo || null
      const status = asDraft ? 'DRAFT' : 'SENT'
      const meta = JSON.stringify({ payload, documentType })
      const inserted = await sql`INSERT INTO e_documents (
        company_id, invoice_id, provider, document_type, direction, uuid, invoice_number, status, currency, amount, tax_amount, issue_date, sent_at, party_name, party_tax_number, metadata
      ) VALUES (
        ${companyId}, ${invoiceId || null}, 'nilvera', ${documentType}, 'outgoing', ${uuid}, ${invoiceNumber}, ${status}, ${payload.currency || 'TRY'},
        ${mapped.amount}, ${mapped.tax}, ${payload.issueDate || new Date().toISOString()}, ${asDraft ? null : new Date().toISOString()},
        ${payload.customer.name}, ${payload.customer.taxNumber}, ${meta}::jsonb
      ) RETURNING *`
      const eventPayload = JSON.stringify({ uuid, invoiceNumber })
      await sql`INSERT INTO e_document_events (e_document_id, company_id, event_type, new_status, payload)
        VALUES (${inserted[0].id}, ${companyId}, ${asDraft ? 'draft_created' : 'invoice_sent'}, ${status}, ${eventPayload}::jsonb)`
      await logApi(companyId, asDraft ? 'draft' : 'send', `POST ${path}`, true, { uuid })
      return sendJson(req, res, 200, { ok: true, document: inserted[0], documentType, uuid })
    } catch (err) {
      await logApi(companyId, 'send', `POST ${path}`, false, { error: err.message })
      return sendJson(req, res, err.status || 400, { ok: false, message: err.message })
    }
  }

  if (op === 'confirm') {
    const id = query.id || body.id
    const rows =
      await sql`SELECT * FROM e_documents WHERE id = ${id} AND company_id = ${companyId} LIMIT 1`
    const doc = rows[0]
    if (!doc) return sendJson(req, res, 404, { ok: false, message: 'E-belge bulunamadı' })
    if (doc.status !== 'DRAFT' && doc.status !== 'ERROR') {
      return sendJson(req, res, 409, {
        ok: false,
        message: 'Yalnızca taslak belgeler gönderilebilir.',
      })
    }
    const live = await requireLive(companyId)
    const path =
      doc.document_type === 'e-arsiv'
        ? '/earchive/Draft/ConfirmAndSend'
        : '/einvoice/Draft/ConfirmAndSend'
    await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      method: 'POST',
      path,
      body: [{ UUID: doc.uuid, Alias: null }],
    })
    const updated =
      await sql`UPDATE e_documents SET status = 'SENT', sent_at = now(), updated_at = now()
      WHERE id = ${doc.id} AND company_id = ${companyId} RETURNING *`
    return sendJson(req, res, 200, { ok: true, document: updated[0] })
  }

  if (op === 'sync') {
    const result = await syncInboxForCompany(companyId)
    return sendJson(req, res, 200, result)
  }

  if (op === 'pdf' || op === 'xml') {
    const id = query.id || body.id
    const rows =
      await sql`SELECT * FROM e_documents WHERE id = ${id} AND company_id = ${companyId} LIMIT 1`
    const doc = rows[0]
    if (!doc?.uuid) return sendJson(req, res, 404, { ok: false, message: 'Resmî belge UUID yok.' })
    const live = await requireLive(companyId)
    let path
    if (doc.status === 'DRAFT') {
      path = `${doc.document_type === 'e-arsiv' ? '/earchive' : '/einvoice'}/Draft/${doc.uuid}/${op}`
    } else if (doc.document_type === 'e-arsiv') {
      path = `/earchive/Invoices/${doc.uuid}/${op}`
    } else {
      path = `/einvoice/${doc.direction === 'incoming' ? 'Purchase' : 'Sale'}/${doc.uuid}/${op}`
    }
    const buf = await nilveraFetch({
      apiKey: live.apiKey,
      environment: live.environment,
      path,
      binary: true,
    })
    return sendJson(req, res, 200, {
      ok: true,
      filename: `${doc.invoice_number || doc.uuid}.${op}`,
      mime: op === 'pdf' ? 'application/pdf' : 'application/xml',
      base64: Buffer.from(buf).toString('base64'),
      official: true,
    })
  }

  return sendJson(req, res, 400, {
    ok: false,
    error: 'UNKNOWN_OP',
    message: `Bilinmeyen işlem: ${op}`,
  })
}

async function handleAdminOp(req, res, op, body = {}, query = {}) {
  const sql = getSql()
  if (op === 'admin-overview') {
    const connected =
      await sql`SELECT count(*)::int AS c FROM e_document_connections WHERE deleted_at IS NULL`
    const active =
      await sql`SELECT count(*)::int AS c FROM e_document_connections WHERE deleted_at IS NULL AND status = 'connected'`
    const errors =
      await sql`SELECT count(*)::int AS c FROM e_document_connections WHERE deleted_at IS NULL AND status = 'error'`
    const sentToday =
      await sql`SELECT count(*)::int AS c FROM e_documents WHERE direction = 'outgoing' AND sent_at >= date_trunc('day', now())`
    const incomingToday =
      await sql`SELECT count(*)::int AS c FROM e_documents WHERE direction = 'incoming' AND created_at >= date_trunc('day', now())`
    const failedToday =
      await sql`SELECT count(*)::int AS c FROM e_documents WHERE status = 'ERROR' AND updated_at >= date_trunc('day', now())`
    const errorRows =
      await sql`SELECT id, company_id, environment, status, last_error, last_test_at, last_sync_at, company_title, tax_number, api_key_fingerprint
      FROM e_document_connections WHERE deleted_at IS NULL AND status = 'error' LIMIT 20`
    return sendJson(req, res, 200, {
      ok: true,
      connectedCompanies: connected[0]?.c || 0,
      activeConnections: active[0]?.c || 0,
      errorConnections: errors[0]?.c || 0,
      sentToday: sentToday[0]?.c || 0,
      incomingToday: incomingToday[0]?.c || 0,
      failedToday: failedToday[0]?.c || 0,
      platform: publicPlatform(await getPlatform()),
      errorRows: errorRows.map((r) => ({
        id: r.id,
        companyId: r.company_id,
        environment: r.environment,
        status: r.status,
        lastError: r.last_error,
        lastTestAt: r.last_test_at,
        companyTitle: r.company_title,
        taxNumber: r.tax_number,
        apiKeyFingerprint: r.api_key_fingerprint,
      })),
    })
  }
  if (op === 'admin-connections') {
    const rows =
      await sql`SELECT id, company_id, environment, status, last_error, last_test_at, last_sync_at, company_title, tax_number, encrypted_api_key, created_at, meta
      FROM e_document_connections WHERE deleted_at IS NULL ORDER BY updated_at DESC LIMIT 500`
    return sendJson(req, res, 200, {
      ok: true,
      rows: rows.map((r) => ({
        id: r.id,
        companyId: r.company_id,
        environment: r.environment,
        status: r.status,
        lastError: r.last_error,
        lastTestAt: r.last_test_at,
        lastSyncAt: r.last_sync_at,
        companyTitle: r.company_title,
        taxNumber: r.tax_number,
        hasAssignedKey: Boolean(r.encrypted_api_key),
        signatureType: r.meta?.signatureType || '',
        signatureDeclared: Boolean(r.meta?.signatureDeclared),
        nilveraMatched: Boolean(r.meta?.nilveraMatched),
      })),
    })
  }
  if (op === 'admin-platform') {
    if (req.method === 'GET') {
      return sendJson(req, res, 200, { ok: true, platform: publicPlatform(await getPlatform()) })
    }
    const environment = body.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
    const nextKey = body.apiKey ? sanitizeApiKey(body.apiKey) : ''
    if (body.apiKey && nextKey.length < 16) {
      return sendJson(req, res, 400, {
        ok: false,
        message:
          'API anahtarı çok kısa. portaltest.nilvera.com / portal.nilvera.com → API Tanımları.',
      })
    }
    const row = await getPlatform()
    if (!row) {
      return sendJson(req, res, 500, { ok: false, message: 'Platform kaydı oluşturulamadı' })
    }
    const fp = nextKey ? fingerprint(nextKey) : null
    const enc = nextKey ? encryptApiKey(nextKey) : null
    if (environment === 'PRODUCTION') {
      await sql`UPDATE e_document_platform SET
        encrypted_api_key_live = COALESCE(${enc}, encrypted_api_key_live),
        fingerprint_live = COALESCE(${fp}, fingerprint_live),
        updated_at = now()
        WHERE id = 'nilvera'`
    } else {
      await sql`UPDATE e_document_platform SET
        encrypted_api_key_test = COALESCE(${enc}, encrypted_api_key_test),
        fingerprint_test = COALESCE(${fp}, fingerprint_test),
        updated_at = now()
        WHERE id = 'nilvera'`
    }
    return sendJson(req, res, 200, { ok: true, platform: publicPlatform(await getPlatform()) })
  }
  if (op === 'admin-platform-test') {
    const environment = body.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
    const live = await getPlatformKey(environment)
    if (!live) {
      return sendJson(req, res, 409, {
        ok: false,
        error: 'NILVERA_NOT_CONFIGURED',
        message:
          'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: Bu ortam için Bachmain API anahtarı kaydedilmedi.',
      })
    }
    try {
      const company = await fetchCompanyInfo({
        apiKey: live.apiKey,
        environment,
      })
      const meta = JSON.stringify({ company })
      await sql`UPDATE e_document_platform SET
        status = 'connected',
        last_test_at = now(),
        last_error = null,
        company_title = ${company?.Name || null},
        tax_number = ${company?.TaxNumber || null},
        meta = ${meta}::jsonb,
        updated_at = now()
        WHERE id = 'nilvera'`
      return sendJson(req, res, 200, {
        ok: true,
        company,
        platform: publicPlatform(await getPlatform()),
      })
    } catch (err) {
      await sql`UPDATE e_document_platform SET status = 'error', last_test_at = now(), last_error = ${err.message}, updated_at = now() WHERE id = 'nilvera'`
      return sendJson(req, res, err.status || 400, {
        ok: false,
        error: 'CONNECTION_FAILED',
        message: err.message,
        platform: publicPlatform(await getPlatform()),
      })
    }
  }
  if (op === 'admin-recheck' || op === 'admin-retest') {
    const companyId = body.companyId || query.companyId
    if (!companyId) {
      return sendJson(req, res, 400, { ok: false, message: 'companyId gerekli' })
    }
    const connection = await matchTenantToNilvera(companyId)
    return sendJson(req, res, 200, { ok: true, connection })
  }
  if (op === 'admin-assign-key') {
    const companyId = body.companyId
    const nextKey = sanitizeApiKey(body.apiKey || '')
    if (!companyId || nextKey.length < 16) {
      return sendJson(req, res, 400, {
        ok: false,
        message: 'Üye companyId ve o firmanın Nilvera API anahtarı gerekli.',
      })
    }
    const existing = await getConn(companyId)
    if (!existing) {
      return sendJson(req, res, 404, {
        ok: false,
        message: 'Üye e-belge kaydı yok. Önce üye panelinden firma bilgisi girmeli.',
      })
    }
    const enc = encryptApiKey(nextKey)
    const fp = fingerprint(nextKey)
    await sql`UPDATE e_document_connections SET
      encrypted_api_key = ${enc},
      api_key_fingerprint = ${fp},
      updated_at = now()
      WHERE id = ${existing.id}`
    const connection = await matchTenantToNilvera(companyId)
    return sendJson(req, res, 200, { ok: true, connection })
  }
  return false
}

function parseOp(path, query) {
  if (query.op) return String(query.op)
  if (path === 'edocuments' || path === 'v1/edocuments') return 'list'
  if (path === 'edocuments/connection' || path === 'v1/edocuments/connection') return 'connection'
  if (path === 'edocuments/connection/test' || path === 'v1/edocuments/connection/test')
    return 'test'
  if (path === 'edocuments/taxpayer' || path === 'v1/edocuments/taxpayer') return 'taxpayer'
  if (path === 'edocuments/credits' || path === 'v1/edocuments/credits') return 'credits'
  if (path === 'edocuments/sync' || path === 'v1/edocuments/sync') return 'sync'
  if (path === 'v1/admin/edocuments/overview' || path === 'edocuments/admin/overview')
    return 'admin-overview'
  if (path === 'v1/admin/edocuments/connections' || path === 'edocuments/admin/connections')
    return 'admin-connections'
  if (path === 'edocuments/admin/platform' || path === 'v1/admin/edocuments/platform')
    return 'admin-platform'
  const file = path.match(/edocuments\/([^/]+)\/(pdf|xml)$/)
  if (file) return file[2]
  const send = path.match(/edocuments\/([^/]+)\/send$/)
  if (send) return 'confirm'
  const one = path.match(/^(?:v1\/)?edocuments\/([^/]+)$/)
  if (one) return 'get'
  if (path === 'edocuments/cron/sync' || path === 'v1/edocuments/cron/sync') return 'cron'
  if (path === 'edocuments/webhooks/nilvera' || path === 'v1/edocuments/webhooks/nilvera')
    return 'webhook'
  return null
}

export async function handleEdocumentsApi(req, res, path, body = {}, query = {}) {
  const isEdoc =
    path === 'edocuments' ||
    path.startsWith('edocuments/') ||
    path.startsWith('v1/edocuments') ||
    path.startsWith('v1/admin/edocuments')
  if (!isEdoc) return false

  if (!hasDatabase()) {
    sendJson(req, res, 503, {
      ok: false,
      error: 'DATABASE_REQUIRED',
      message: 'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: DATABASE_URL tanımlı değil.',
    })
    return true
  }

  try {
    await ensureEdocSchema()
    await getPlatform()
    const op = parseOp(path, query) || (req.method === 'POST' ? 'create' : 'list')
    const idMatch = String(path).match(/edocuments\/([0-9a-f-]{16,})/i)
    if (idMatch && !query.id) query.id = idMatch[1]

    if (op === 'cron') {
      if (!cronAuthorized(req, query)) {
        sendJson(req, res, 401, { ok: false, message: 'Cron yetkisi yok' })
        return true
      }
      const sql = getSql()
      const conns =
        await sql`SELECT company_id FROM e_document_connections WHERE deleted_at IS NULL AND status = 'connected'`
      const results = []
      for (const c of conns) {
        try {
          results.push({ companyId: c.company_id, ...(await syncInboxForCompany(c.company_id)) })
        } catch (err) {
          results.push({ companyId: c.company_id, ok: false, error: err.message })
        }
      }
      sendJson(req, res, 200, { ok: true, results })
      return true
    }

    if (op === 'webhook') {
      sendJson(req, res, 200, {
        ok: true,
        message:
          'Nilvera resmi dokümantasyonunda genel amaçlı durum webhook’u yok. Gelen belgeler cron/polling ile senkronize edilir.',
      })
      return true
    }

    if (
      [
        'admin-overview',
        'admin-connections',
        'admin-retest',
        'admin-platform',
        'admin-platform-test',
        'admin-recheck',
        'admin-assign-key',
      ].includes(op)
    ) {
      const staff = getStaffSession(req)
      if (!staff && staffAuthEnabled() && process.env.STAFF_AUTH_REQUIRED !== '0') {
        sendJson(req, res, 401, { ok: false, message: 'Staff oturumu gerekli' })
        return true
      }
      await handleAdminOp(req, res, op, body, query)
      return true
    }

    const session = await tenantSession(req)
    await handleTenantOp(req, res, session, op, body, query)
    return true
  } catch (err) {
    sendJson(req, res, err.status || 500, {
      ok: false,
      error: err.code || 'EDOCUMENT_ERROR',
      message: err.message || 'E-belge işlemi başarısız',
    })
    return true
  }
}
