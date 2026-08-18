import { createHash, createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto'
import { and, desc, eq, gte, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  eDocumentApiLogs,
  eDocumentConnections,
  eDocumentEvents,
  eDocuments,
  eDocumentSyncLogs,
} from '../../db/schema/index.js'
import { env } from '../../config/env.js'
import { AppError } from '../../shared/errors.js'
import { logActivity } from '../audit/activityService.js'
import { projectJournal } from '../finance/financeService.js'
import { getEDocumentProvider } from './providers/registry.js'
import { confirmNilveraDraft } from './providers/nilvera/NilveraProvider.js'
import {
  toNilveraEArchiveModel,
  toNilveraEInvoiceModel,
  validateInvoicePayload,
  type BachmainInvoicePayload,
} from './providers/nilvera/mapper.js'
import { mapNilveraStatus, UI_STATUS } from './statusMap.js'
import { fingerprintApiKey } from './providers/nilvera/client.js'
import type {
  EDocumentEnvironment,
  ProviderCompanyInfo,
  ProviderInvoiceRow,
} from './providers/types.js'

function encryptionKey() {
  const raw = env.EDOCUMENTS_ENCRYPTION_KEY || env.JWT_ACCESS_SECRET
  return createHash('sha256').update(raw).digest()
}

export function encryptApiKey(plain: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`
}

export function decryptApiKey(payload: string) {
  const [ivB64, tagB64, dataB64] = String(payload || '').split('.')
  if (!ivB64 || !tagB64 || !dataB64)
    throw new AppError('INVALID_SECRET', 'Kayıtlı API anahtarı okunamadı', 500)
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64url'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]).toString('utf8')
}

function publicConnection(row: typeof eDocumentConnections.$inferSelect) {
  return {
    id: row.id,
    companyId: row.companyId,
    branchId: row.branchId,
    provider: row.provider,
    environment: row.environment,
    status: row.status,
    hasApiKey: Boolean(row.encryptedApiKey),
    apiKeyFingerprint: row.apiKeyFingerprint,
    lastTestAt: row.lastTestAt,
    lastSyncAt: row.lastSyncAt,
    lastError: row.lastError,
    companyTitle: row.companyTitle,
    taxNumber: row.taxNumber,
    meta: sanitizeMeta(row.meta),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function sanitizeMeta(meta: Record<string, unknown> | null | undefined) {
  const next = { ...(meta || {}) }
  delete next.apiKey
  delete next.encryptedApiKey
  delete next.Authorization
  return next
}

async function audit(input: Record<string, unknown>) {
  try {
    await (logActivity as (payload: Record<string, unknown>) => Promise<unknown>)(input)
  } catch {
    /* audit must not block e-document operations */
  }
}

async function tryProjectCari(companyId: string, amount: number, memo: string, invoiceId: string) {
  try {
    await (projectJournal as (id: string, input: Record<string, unknown>) => Promise<unknown>)(
      companyId,
      {
        source: 'e-document',
        amount,
        memo,
        invoiceId,
      },
    )
  } catch {
    /* finance journal may require UUID company ids */
  }
}

function companyFields(company: ProviderCompanyInfo | null | undefined) {
  const rec = (company || {}) as ProviderCompanyInfo & { Name?: string; TaxNumber?: string }
  return {
    title: rec.Name || rec.name || null,
    taxNumber: rec.TaxNumber || rec.taxNumber || null,
  }
}

async function writeApiLog(input: {
  companyId: string
  requestType: string
  endpoint: string
  durationMs?: number
  success: boolean
  httpStatus?: number
  externalUuid?: string
  error?: string
}) {
  await db.insert(eDocumentApiLogs).values({
    companyId: input.companyId,
    requestType: input.requestType,
    endpoint: input.endpoint,
    durationMs: input.durationMs ?? null,
    success: input.success,
    httpStatus: input.httpStatus ?? null,
    externalUuid: input.externalUuid ?? null,
    error: input.error ? String(input.error).slice(0, 500) : null,
  })
}

export async function getConnection(companyId: string, environment?: string) {
  const rows = await db
    .select()
    .from(eDocumentConnections)
    .where(
      and(
        eq(eDocumentConnections.companyId, companyId),
        isNull(eDocumentConnections.deletedAt),
        environment ? eq(eDocumentConnections.environment, environment) : undefined,
      ),
    )
    .orderBy(desc(eDocumentConnections.updatedAt))
    .limit(1)
  return rows[0] || null
}

export async function getPublicConnection(companyId: string) {
  const row = await getConnection(companyId)
  return row ? publicConnection(row) : null
}

async function requireLiveConnection(companyId: string) {
  const row = await getConnection(companyId)
  if (!row?.encryptedApiKey) {
    throw new AppError(
      'NILVERA_NOT_CONFIGURED',
      'NİLVERA MANUEL KONFİGÜRASYONU GEREKİYOR: E-Belge Ayarları üzerinden API anahtarı kaydedin.',
      409,
    )
  }
  return {
    row,
    apiKey: decryptApiKey(row.encryptedApiKey),
    environment: (row.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST') as EDocumentEnvironment,
    provider: getEDocumentProvider(row.provider || 'nilvera'),
  }
}

export async function upsertConnection(
  companyId: string,
  input: {
    apiKey?: string
    environment?: EDocumentEnvironment
    branchId?: string | null
    userId?: string | null
    ip?: string
  },
) {
  const environment = input.environment === 'PRODUCTION' ? 'PRODUCTION' : 'TEST'
  const existing = await getConnection(companyId, environment)
  const encryptedApiKey = input.apiKey
    ? encryptApiKey(input.apiKey.trim())
    : existing?.encryptedApiKey
  const apiKeyFingerprint = input.apiKey
    ? fingerprintApiKey(input.apiKey.trim())
    : existing?.apiKeyFingerprint
  const values = {
    companyId,
    branchId: input.branchId || null,
    provider: 'nilvera',
    environment,
    encryptedApiKey: encryptedApiKey || null,
    apiKeyFingerprint: apiKeyFingerprint || null,
    status: encryptedApiKey ? 'configured' : 'disconnected',
    updatedAt: new Date(),
  }
  let row
  if (existing) {
    ;[row] = await db
      .update(eDocumentConnections)
      .set(values)
      .where(eq(eDocumentConnections.id, existing.id))
      .returning()
  } else {
    ;[row] = await db.insert(eDocumentConnections).values(values).returning()
  }
  await audit({
    companyId,
    userId: input.userId,
    action: input.apiKey ? 'edocument.api_key_updated' : 'edocument.connection_updated',
    resource: 'e_document_connection',
    resourceId: row.id,
    ip: input.ip,
    meta: { environment, fingerprint: row.apiKeyFingerprint },
  })
  return publicConnection(row)
}

export async function testConnection(companyId: string, userId?: string | null, ip?: string) {
  const live = await requireLiveConnection(companyId)
  const started = Date.now()
  try {
    const result = await live.provider.testConnection(live.apiKey, live.environment)
    const fields = companyFields(result.company)
    const [row] = await db
      .update(eDocumentConnections)
      .set({
        status: 'connected',
        lastTestAt: new Date(),
        lastError: null,
        companyTitle: fields.title || live.row.companyTitle,
        taxNumber: fields.taxNumber || live.row.taxNumber,
        meta: {
          ...(live.row.meta || {}),
          company: result.company,
          credits: result.credits,
        },
        updatedAt: new Date(),
      })
      .where(eq(eDocumentConnections.id, live.row.id))
      .returning()
    await writeApiLog({
      companyId,
      requestType: 'test_connection',
      endpoint: 'GET /general/Company',
      durationMs: Date.now() - started,
      success: true,
      httpStatus: 200,
    })
    await audit({
      companyId,
      userId,
      action: 'edocument.connection_tested',
      resource: 'e_document_connection',
      resourceId: row.id,
      ip,
      meta: { ok: true, environment: live.environment },
    })
    return {
      ok: true,
      connection: publicConnection(row),
      company: result.company,
      credits: result.credits,
      environment: live.environment,
    }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'Bağlantı testi başarısız.'
    await db
      .update(eDocumentConnections)
      .set({ status: 'error', lastTestAt: new Date(), lastError: message, updatedAt: new Date() })
      .where(eq(eDocumentConnections.id, live.row.id))
    await writeApiLog({
      companyId,
      requestType: 'test_connection',
      endpoint: 'GET /general/Company',
      durationMs: Date.now() - started,
      success: false,
      error: message,
    })
    throw err
  }
}

export async function checkTaxpayer(companyId: string, taxNumber: string) {
  const live = await requireLiveConnection(companyId)
  return live.provider.checkTaxpayer(live.apiKey, live.environment, taxNumber)
}

export async function listCredits(companyId: string) {
  const live = await requireLiveConnection(companyId)
  return live.provider.getCredits(live.apiKey, live.environment)
}

async function assertOwnedDocument(companyId: string, id: string) {
  const [row] = await db
    .select()
    .from(eDocuments)
    .where(
      and(eq(eDocuments.id, id), eq(eDocuments.companyId, companyId), isNull(eDocuments.deletedAt)),
    )
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'E-belge bulunamadı', 404)
  return row
}

export async function listDocuments(
  companyId: string,
  query: {
    direction?: string
    documentType?: string
    status?: string
    search?: string
    limit?: number
  },
) {
  const rows = await db
    .select()
    .from(eDocuments)
    .where(and(eq(eDocuments.companyId, companyId), isNull(eDocuments.deletedAt)))
    .orderBy(desc(eDocuments.createdAt))
    .limit(Math.min(query.limit || 100, 200))
  return rows.filter((row) => {
    if (query.direction && row.direction !== query.direction) return false
    if (query.documentType && row.documentType !== query.documentType) return false
    if (query.status && row.status !== query.status) return false
    if (query.search) {
      const q = query.search.toLowerCase()
      return [row.invoiceNumber, row.partyName, row.partyTaxNumber, row.uuid, row.status].some(
        (v) =>
          String(v || '')
            .toLowerCase()
            .includes(q),
      )
    }
    return true
  })
}

async function appendEvent(input: {
  companyId: string
  eDocumentId: string
  eventType: string
  oldStatus?: string | null
  newStatus?: string | null
  payload?: Record<string, unknown>
  errorMessage?: string | null
}) {
  await db.insert(eDocumentEvents).values({
    companyId: input.companyId,
    eDocumentId: input.eDocumentId,
    eventType: input.eventType,
    oldStatus: input.oldStatus || null,
    newStatus: input.newStatus || null,
    payload: input.payload || {},
    errorMessage: input.errorMessage || null,
  })
}

function payableFromModel(model: unknown) {
  const rec = model as {
    EInvoice?: { InvoiceInfo?: { PayableAmount?: number; KdvTotal?: number } }
    ArchiveInvoice?: { InvoiceInfo?: { PayableAmount?: number; KdvTotal?: number } }
  }
  return {
    amount: String(
      rec.EInvoice?.InvoiceInfo?.PayableAmount ||
        rec.ArchiveInvoice?.InvoiceInfo?.PayableAmount ||
        0,
    ),
    taxAmount: String(
      rec.EInvoice?.InvoiceInfo?.KdvTotal || rec.ArchiveInvoice?.InvoiceInfo?.KdvTotal || 0,
    ),
  }
}

export async function createOrSendDocument(
  companyId: string,
  input: {
    invoiceId?: string
    branchId?: string | null
    asDraft?: boolean
    documentType?: 'e-fatura' | 'e-arsiv' | 'auto'
    payload: BachmainInvoicePayload
    userId?: string | null
    ip?: string
    projectCari?: boolean
  },
) {
  const live = await requireLiveConnection(companyId)
  const errors = validateInvoicePayload(input.payload)
  if (errors.length) {
    throw new AppError('INVOICE_INVALID', errors[0], 400, { errors })
  }

  if (input.invoiceId) {
    const [dup] = await db
      .select()
      .from(eDocuments)
      .where(
        and(
          eq(eDocuments.companyId, companyId),
          eq(eDocuments.invoiceId, input.invoiceId),
          eq(eDocuments.direction, 'outgoing'),
          isNull(eDocuments.deletedAt),
        ),
      )
      .limit(1)
    if (dup && dup.status !== UI_STATUS.DRAFT && dup.status !== UI_STATUS.ERROR) {
      throw new AppError(
        'DUPLICATE_INVOICE',
        'Bu Bachmain faturası için e-belge zaten gönderilmiş.',
        409,
        {
          existingId: dup.id,
          uuid: dup.uuid,
        },
      )
    }
  }

  let documentType = input.documentType || 'auto'
  if (documentType === 'auto') {
    const check = await live.provider.checkTaxpayer(
      live.apiKey,
      live.environment,
      input.payload.customer.taxNumber || '',
    )
    documentType = check.isEInvoiceTaxpayer ? 'e-fatura' : 'e-arsiv'
    input.payload.invoiceProfile =
      documentType === 'e-fatura' ? input.payload.invoiceProfile || 'TICARIFATURA' : 'EARSIVFATURA'
  }

  const uuid = input.payload.uuid || randomUUID()
  input.payload.uuid = uuid
  const model =
    documentType === 'e-arsiv'
      ? toNilveraEArchiveModel(input.payload)
      : toNilveraEInvoiceModel(input.payload)
  const totals = payableFromModel(model)
  const docValues = {
    companyId,
    branchId: input.branchId || null,
    invoiceId: input.invoiceId || null,
    provider: 'nilvera',
    documentType,
    direction: 'outgoing' as const,
    uuid,
    invoiceNumber: input.payload.invoiceNo || null,
    status: input.asDraft ? UI_STATUS.DRAFT : UI_STATUS.PROCESSING,
    currency: input.payload.currency || 'TRY',
    amount: totals.amount,
    taxAmount: totals.taxAmount,
    issueDate: input.payload.issueDate ? new Date(input.payload.issueDate) : new Date(),
    partyName: input.payload.customer.name,
    partyTaxNumber: input.payload.customer.taxNumber,
    metadata: { payload: input.payload, documentType },
  }

  const [existingDraft] = input.invoiceId
    ? await db
        .select()
        .from(eDocuments)
        .where(
          and(
            eq(eDocuments.companyId, companyId),
            eq(eDocuments.invoiceId, input.invoiceId),
            eq(eDocuments.direction, 'outgoing'),
            isNull(eDocuments.deletedAt),
          ),
        )
        .limit(1)
    : []

  let saved
  if (
    existingDraft &&
    (existingDraft.status === UI_STATUS.DRAFT || existingDraft.status === UI_STATUS.ERROR)
  ) {
    ;[saved] = await db
      .update(eDocuments)
      .set({ ...docValues, updatedAt: new Date() })
      .where(and(eq(eDocuments.id, existingDraft.id), eq(eDocuments.companyId, companyId)))
      .returning()
  } else {
    ;[saved] = await db.insert(eDocuments).values(docValues).returning()
  }

  if (!saved) throw new AppError('SAVE_FAILED', 'E-belge kaydı oluşturulamadı', 500)

  try {
    const sent = await live.provider.sendInvoice(live.apiKey, live.environment, {
      uuid,
      documentType,
      asDraft: Boolean(input.asDraft),
      customerAlias: null,
      model: input.payload as unknown as Record<string, unknown>,
    })
    const nextStatus = input.asDraft ? UI_STATUS.DRAFT : UI_STATUS.SENT
    const [updated] = await db
      .update(eDocuments)
      .set({
        uuid: sent.uuid || uuid,
        invoiceNumber: sent.invoiceNumber || saved.invoiceNumber,
        status: nextStatus,
        sentAt: input.asDraft ? null : new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(eDocuments.id, saved.id), eq(eDocuments.companyId, companyId)))
      .returning()
    await appendEvent({
      companyId,
      eDocumentId: saved.id,
      eventType: input.asDraft ? 'draft_created' : 'invoice_sent',
      oldStatus: saved.status,
      newStatus: nextStatus,
      payload: { uuid: sent.uuid, invoiceNumber: sent.invoiceNumber },
    })
    await audit({
      companyId,
      userId: input.userId,
      action: input.asDraft ? 'edocument.draft_created' : 'edocument.invoice_sent',
      resource: 'e_document',
      resourceId: saved.id,
      ip: input.ip,
      meta: { uuid: sent.uuid, documentType },
    })
    if (!input.asDraft && input.projectCari !== false && updated) {
      await tryProjectCari(
        companyId,
        Number(updated.amount || 0),
        `E-belge ${updated.invoiceNumber || updated.uuid}`,
        updated.invoiceId || updated.id,
      )
    }
    return { document: updated, documentType, uuid: sent.uuid }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'Fatura gönderilemedi.'
    await db
      .update(eDocuments)
      .set({
        status: UI_STATUS.ERROR,
        metadata: { ...(saved.metadata || {}), error: message },
        updatedAt: new Date(),
      })
      .where(eq(eDocuments.id, saved.id))
    await appendEvent({
      companyId,
      eDocumentId: saved.id,
      eventType: 'send_error',
      oldStatus: saved.status,
      newStatus: UI_STATUS.ERROR,
      errorMessage: message,
    })
    throw err
  }
}

export async function sendDraft(
  companyId: string,
  id: string,
  userId?: string | null,
  ip?: string,
) {
  const doc = await assertOwnedDocument(companyId, id)
  if (doc.status !== UI_STATUS.DRAFT && doc.status !== UI_STATUS.ERROR) {
    throw new AppError('INVALID_STATE', 'Yalnızca taslak belgeler gönderilebilir.', 409)
  }
  if (!doc.uuid) throw new AppError('MISSING_UUID', 'Taslak UUID eksik.', 409)
  const live = await requireLiveConnection(companyId)
  await confirmNilveraDraft(live.apiKey, live.environment, doc.uuid, doc.documentType)
  const [updated] = await db
    .update(eDocuments)
    .set({ status: UI_STATUS.SENT, sentAt: new Date(), updatedAt: new Date() })
    .where(and(eq(eDocuments.id, doc.id), eq(eDocuments.companyId, companyId)))
    .returning()
  await appendEvent({
    companyId,
    eDocumentId: doc.id,
    eventType: 'draft_sent',
    oldStatus: doc.status,
    newStatus: UI_STATUS.SENT,
  })
  await audit({
    companyId,
    userId,
    action: 'edocument.invoice_sent',
    resource: 'e_document',
    resourceId: doc.id,
    ip,
    meta: { uuid: doc.uuid },
  })
  return updated
}

export async function getDocument(companyId: string, id: string) {
  const doc = await assertOwnedDocument(companyId, id)
  const events = await db
    .select()
    .from(eDocumentEvents)
    .where(eq(eDocumentEvents.eDocumentId, doc.id))
    .orderBy(desc(eDocumentEvents.createdAt))
    .limit(50)
  return { document: doc, events }
}

function upsertFromProviderRow(
  companyId: string,
  direction: string,
  documentType: string,
  row: ProviderInvoiceRow,
) {
  const uuid = String(row.UUID || '')
  if (!uuid) return null
  const status = mapNilveraStatus({
    statusCode: row.StatusCode,
    answerCode: row.AnswerCode,
    isCancel: row.IsCancel,
    direction,
  })
  return {
    companyId,
    provider: 'nilvera',
    documentType,
    direction,
    uuid,
    invoiceNumber: row.InvoiceNumber || null,
    status,
    providerStatus: row.StatusCode || null,
    answerCode: row.AnswerCode || null,
    currency: row.CurrencyCode || 'TRY',
    amount: String(row.PayableAmount || 0),
    taxAmount: String(row.TaxTotalAmount || 0),
    issueDate: row.IssueDate ? new Date(row.IssueDate) : null,
    partyName: (direction === 'incoming' ? row.SenderName : row.ReceiverName) || null,
    partyTaxNumber:
      (direction === 'incoming' ? row.SenderTaxNumber : row.ReceiverTaxNumber) || null,
    receivedAt: direction === 'incoming' ? new Date() : null,
    metadata: { providerRow: row },
    updatedAt: new Date(),
  }
}

async function saveProviderRow(
  companyId: string,
  values: NonNullable<ReturnType<typeof upsertFromProviderRow>>,
) {
  const [existing] = await db
    .select()
    .from(eDocuments)
    .where(
      and(
        eq(eDocuments.companyId, companyId),
        eq(eDocuments.provider, 'nilvera'),
        eq(eDocuments.uuid, values.uuid || ''),
        isNull(eDocuments.deletedAt),
      ),
    )
    .limit(1)
  if (existing) {
    await db
      .update(eDocuments)
      .set({
        status: values.status,
        providerStatus: values.providerStatus,
        answerCode: values.answerCode,
        amount: values.amount,
        taxAmount: values.taxAmount,
        invoiceNumber: values.invoiceNumber,
        metadata: values.metadata,
        updatedAt: new Date(),
      })
      .where(eq(eDocuments.id, existing.id))
    return
  }
  await db.insert(eDocuments).values(values)
}

export async function syncInbox(companyId: string, userId?: string | null) {
  const live = await requireLiveConnection(companyId)
  const started = new Date()
  const [log] = await db
    .insert(eDocumentSyncLogs)
    .values({
      companyId,
      provider: 'nilvera',
      syncType: 'incoming',
      status: 'running',
      startedAt: started,
    })
    .returning()
  try {
    const incoming = await live.provider.listIncoming(live.apiKey, live.environment)
    const outgoing = await live.provider.listOutgoing(live.apiKey, live.environment)
    const archive = await live.provider.listArchive(live.apiKey, live.environment)
    let processed = 0
    for (const row of incoming) {
      const values = upsertFromProviderRow(companyId, 'incoming', 'e-fatura', row)
      if (!values) continue
      await saveProviderRow(companyId, values)
      processed += 1
    }
    for (const row of outgoing) {
      const values = upsertFromProviderRow(companyId, 'outgoing', 'e-fatura', row)
      if (!values) continue
      await saveProviderRow(companyId, values)
      processed += 1
    }
    for (const row of archive) {
      const values = upsertFromProviderRow(companyId, 'outgoing', 'e-arsiv', row)
      if (!values) continue
      await saveProviderRow(companyId, values)
      processed += 1
    }
    await db
      .update(eDocumentSyncLogs)
      .set({ status: 'ok', finishedAt: new Date(), recordsProcessed: processed })
      .where(eq(eDocumentSyncLogs.id, log.id))
    await db
      .update(eDocumentConnections)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(eDocumentConnections.id, live.row.id))
    await audit({
      companyId,
      userId,
      action: 'edocument.inbox_synced',
      resource: 'e_document_sync',
      resourceId: log.id,
      meta: { processed },
    })
    return { ok: true, recordsProcessed: processed }
  } catch (err) {
    const message = err instanceof AppError ? err.message : 'Senkronizasyon başarısız'
    await db
      .update(eDocumentSyncLogs)
      .set({ status: 'error', finishedAt: new Date(), error: message })
      .where(eq(eDocumentSyncLogs.id, log.id))
    throw err
  }
}

export async function downloadDocumentFile(
  companyId: string,
  id: string,
  kind: 'pdf' | 'xml',
  userId?: string | null,
) {
  const doc = await assertOwnedDocument(companyId, id)
  if (!doc.uuid) throw new AppError('MISSING_UUID', 'Belge UUID yok; resmî dosya indirilemez.', 409)
  const live = await requireLiveConnection(companyId)
  const buf =
    kind === 'pdf'
      ? await live.provider.downloadPdf(live.apiKey, live.environment, {
          uuid: doc.uuid,
          documentType: doc.documentType,
          direction: doc.direction,
          draft: doc.status === UI_STATUS.DRAFT,
        })
      : await live.provider.downloadXml(live.apiKey, live.environment, {
          uuid: doc.uuid,
          documentType: doc.documentType,
          direction: doc.direction,
          draft: doc.status === UI_STATUS.DRAFT,
        })
  await audit({
    companyId,
    userId,
    action: 'edocument.downloaded',
    resource: 'e_document',
    resourceId: doc.id,
    meta: { kind, uuid: doc.uuid },
  })
  return { buffer: buf, filename: `${doc.invoiceNumber || doc.uuid}.${kind}`, document: doc }
}

export async function adminOverview() {
  const [connections] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eDocumentConnections)
    .where(isNull(eDocumentConnections.deletedAt))
  const [active] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eDocumentConnections)
    .where(
      and(isNull(eDocumentConnections.deletedAt), eq(eDocumentConnections.status, 'connected')),
    )
  const [error] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eDocumentConnections)
    .where(and(isNull(eDocumentConnections.deletedAt), eq(eDocumentConnections.status, 'error')))
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const [sentToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eDocuments)
    .where(and(eq(eDocuments.direction, 'outgoing'), gte(eDocuments.sentAt, start)))
  const [incomingToday] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eDocuments)
    .where(and(eq(eDocuments.direction, 'incoming'), gte(eDocuments.createdAt, start)))
  const [failed] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(eDocuments)
    .where(and(eq(eDocuments.status, UI_STATUS.ERROR), gte(eDocuments.updatedAt, start)))
  const recentErrors = await db
    .select()
    .from(eDocumentConnections)
    .where(and(isNull(eDocumentConnections.deletedAt), eq(eDocumentConnections.status, 'error')))
    .limit(20)
  return {
    connectedCompanies: connections?.count || 0,
    activeConnections: active?.count || 0,
    errorConnections: error?.count || 0,
    sentToday: sentToday?.count || 0,
    incomingToday: incomingToday?.count || 0,
    failedToday: failed?.count || 0,
    errorRows: recentErrors.map((row) => publicConnection(row)),
  }
}

export async function adminListConnections() {
  const rows = await db
    .select()
    .from(eDocumentConnections)
    .where(isNull(eDocumentConnections.deletedAt))
    .orderBy(desc(eDocumentConnections.updatedAt))
    .limit(500)
  return rows.map(publicConnection)
}

export async function cronSyncAll() {
  const rows = await db
    .select()
    .from(eDocumentConnections)
    .where(
      and(isNull(eDocumentConnections.deletedAt), eq(eDocumentConnections.status, 'connected')),
    )
  const results = []
  for (const row of rows) {
    try {
      results.push({ companyId: row.companyId, ...(await syncInbox(row.companyId)) })
    } catch (err) {
      results.push({
        companyId: row.companyId,
        ok: false,
        error: err instanceof Error ? err.message : 'sync failed',
      })
    }
  }
  return { ok: true, results }
}
