import { and, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  customers,
  mdmMergeJobs,
  mdmRecordHistory,
  mdmTags,
  products,
  suppliers,
  warehouses,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'

export type MdmEntityType = 'customer' | 'product' | 'supplier' | 'warehouse'

function normalizeTax(v?: string | null) {
  return String(v || '')
    .replace(/\D/g, '')
    .trim()
}

function normalizePhone(v?: string | null) {
  return String(v || '')
    .replace(/\D/g, '')
    .replace(/^90/, '')
    .trim()
}

function normalizeEmail(v?: string | null) {
  return String(v || '')
    .trim()
    .toLowerCase()
}

function normalizeName(v?: string | null) {
  return String(v || '')
    .toLowerCase()
    .replace(/\b(ltd|limited|a\.?\s*ş\.?|as|sanayi|ticaret|tic)\b/gi, '')
    .replace(/[^a-z0-9ğüşıöç\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Simple Dice coefficient on character bigrams */
function similarity(a: string, b: string) {
  if (!a || !b) return 0
  if (a === b) return 1
  const bigrams = (s: string) => {
    const out = new Map<string, number>()
    for (let i = 0; i < s.length - 1; i += 1) {
      const g = s.slice(i, i + 2)
      out.set(g, (out.get(g) || 0) + 1)
    }
    return out
  }
  const A = bigrams(a)
  const B = bigrams(b)
  let inter = 0
  for (const [g, c] of A) inter += Math.min(c, B.get(g) || 0)
  return (2 * inter) / (a.length + b.length - 2 || 1)
}

export async function recordMdmHistory(input: {
  companyId: string
  entityType: MdmEntityType
  entityId: string
  version: number
  changedBy?: string | null
  field?: string
  oldValue?: unknown
  newValue?: unknown
  snapshot?: Record<string, unknown>
}) {
  await db.insert(mdmRecordHistory).values({
    companyId: input.companyId,
    entityType: input.entityType,
    entityId: input.entityId,
    version: input.version,
    changedBy: input.changedBy || null,
    field: input.field || null,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
    snapshot: input.snapshot || {},
  })
}

export async function findCustomerDuplicates(
  companyId: string,
  input: { name?: string; email?: string; phone?: string; taxNo?: string },
) {
  const rows = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
    .limit(2000)

  const tax = normalizeTax(input.taxNo)
  const email = normalizeEmail(input.email)
  const phone = normalizePhone(input.phone)
  const name = normalizeName(input.name)

  const scored = rows
    .map((row) => {
      const reasons: string[] = []
      let score = 0
      if (tax && normalizeTax(row.taxNo) && tax === normalizeTax(row.taxNo)) {
        score += 0.55
        reasons.push('tax_no')
      }
      if (email && normalizeEmail(row.email) === email) {
        score += 0.35
        reasons.push('email')
      }
      if (phone && phone.length >= 7 && normalizePhone(row.phone) === phone) {
        score += 0.3
        reasons.push('phone')
      }
      const nameSim = similarity(name, normalizeName(row.name))
      if (nameSim >= 0.72) {
        score += nameSim * 0.4
        reasons.push('name')
      }
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        taxNo: row.taxNo,
        score: Math.min(1, Number(score.toFixed(3))),
        reasons,
      }
    })
    .filter((r) => r.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 20)

  return scored
}

export async function globalMdmSearch(companyId: string, q: string) {
  const query = String(q || '').trim()
  if (query.length < 2) return { customers: [], products: [], suppliers: [], warehouses: [] }
  const like = `%${query}%`

  const [customerRows, productRows, supplierRows, warehouseRows] = await Promise.all([
    db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        taxNo: customers.taxNo,
      })
      .from(customers)
      .where(
        and(
          eq(customers.companyId, companyId),
          isNull(customers.deletedAt),
          or(
            ilike(customers.name, like),
            ilike(customers.email, like),
            ilike(customers.phone, like),
            ilike(customers.taxNo, like),
          ),
        ),
      )
      .limit(25),
    db
      .select({ id: products.id, name: products.name, sku: products.sku })
      .from(products)
      .where(
        and(
          eq(products.companyId, companyId),
          isNull(products.deletedAt),
          or(ilike(products.name, like), ilike(products.sku, like)),
        ),
      )
      .limit(25),
    db
      .select({ id: suppliers.id, name: suppliers.name, email: suppliers.email })
      .from(suppliers)
      .where(
        and(
          eq(suppliers.companyId, companyId),
          isNull(suppliers.deletedAt),
          or(ilike(suppliers.name, like), ilike(suppliers.email, like)),
        ),
      )
      .limit(25),
    db
      .select({ id: warehouses.id, name: warehouses.name, code: warehouses.code })
      .from(warehouses)
      .where(
        and(
          eq(warehouses.companyId, companyId),
          isNull(warehouses.deletedAt),
          or(ilike(warehouses.name, like), ilike(warehouses.code, like)),
        ),
      )
      .limit(25),
  ])

  return {
    customers: customerRows.map((r) => ({ ...r, entityType: 'customer' as const })),
    products: productRows.map((r) => ({ ...r, entityType: 'product' as const })),
    suppliers: supplierRows.map((r) => ({ ...r, entityType: 'supplier' as const })),
    warehouses: warehouseRows.map((r) => ({ ...r, entityType: 'warehouse' as const })),
  }
}

export async function customerImpact(companyId: string, customerId: string) {
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, companyId), eq(customers.id, customerId)))
    .limit(1)
  if (!row) throw new AppError('NOT_FOUND', 'Müşteri bulunamadı', 404)

  // Domain tables not fully normalized yet — report known SQL refs + SPA warning
  return {
    entity: { type: 'customer', id: row.id, name: row.name },
    blockers: [] as { resource: string; count: number }[],
    warnings: [
      {
        resource: 'crm_localStorage',
        message:
          'CRM SPA hâlâ localStorage müşteri profili kullanıyor olabilir. Silmeden önce dual-write / cutover durumunu kontrol edin.',
      },
    ],
    canSoftDelete: true,
  }
}

export async function mergeCustomers(input: {
  companyId: string
  survivorId: string
  mergeIds: string[]
  userId?: string
}) {
  const mergeIds = [...new Set(input.mergeIds.filter((id) => id && id !== input.survivorId))]
  if (!mergeIds.length) throw new AppError('VALIDATION', 'Birleştirilecek kayıt yok', 400)

  const [survivor] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.companyId, input.companyId), eq(customers.id, input.survivorId)))
    .limit(1)
  if (!survivor) throw new AppError('NOT_FOUND', 'Hayatta kalan müşteri yok', 404)

  const now = new Date()
  for (const id of mergeIds) {
    const [loser] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.companyId, input.companyId), eq(customers.id, id)))
      .limit(1)
    if (!loser) continue
    const prevMeta =
      loser.meta && typeof loser.meta === 'object' && !Array.isArray(loser.meta)
        ? (loser.meta as Record<string, unknown>)
        : {}
    await db
      .update(customers)
      .set({
        deletedAt: now,
        isActive: false,
        updatedAt: now,
        meta: {
          ...prevMeta,
          mergedInto: input.survivorId,
          mergedAt: now.toISOString(),
        },
      })
      .where(and(eq(customers.companyId, input.companyId), eq(customers.id, id)))
  }

  const nextVersion = (survivor.version || 1) + 1
  await db
    .update(customers)
    .set({ version: nextVersion, updatedAt: now, updatedBy: input.userId || null })
    .where(eq(customers.id, survivor.id))

  await recordMdmHistory({
    companyId: input.companyId,
    entityType: 'customer',
    entityId: survivor.id,
    version: nextVersion,
    changedBy: input.userId,
    field: 'merge',
    newValue: { mergedIds: mergeIds },
    snapshot: { survivorId: survivor.id, mergeIds },
  })

  const [job] = await db
    .insert(mdmMergeJobs)
    .values({
      companyId: input.companyId,
      entityType: 'customer',
      survivorId: survivor.id,
      mergedIds: mergeIds,
      status: 'completed',
      performedBy: input.userId || null,
    })
    .returning()

  return { ok: true, survivorId: survivor.id, mergeIds, job }
}

export async function mdmQualitySnapshot(companyId: string) {
  const [cust] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers)
    .where(and(eq(customers.companyId, companyId), isNull(customers.deletedAt)))
  const [missingEmail] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt),
        or(isNull(customers.email), eq(customers.email, '')),
      ),
    )
  const [missingTax] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt),
        or(isNull(customers.taxNo), eq(customers.taxNo, '')),
      ),
    )
  const [passive] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(customers)
    .where(
      and(
        eq(customers.companyId, companyId),
        isNull(customers.deletedAt),
        eq(customers.isActive, false),
      ),
    )
  const [prodCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(products)
    .where(and(eq(products.companyId, companyId), isNull(products.deletedAt)))
  const [whCount] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(warehouses)
    .where(and(eq(warehouses.companyId, companyId), isNull(warehouses.deletedAt)))

  return {
    customers: {
      total: cust?.total ?? 0,
      missingEmail: missingEmail?.total ?? 0,
      missingTax: missingTax?.total ?? 0,
      passive: passive?.total ?? 0,
    },
    products: { total: prodCount?.total ?? 0 },
    warehouses: { total: whCount?.total ?? 0 },
    notes: [
      'CRM localStorage hâlâ birincil SoT olabilir — dual-write bayrağını kontrol edin.',
      'Çift kayıt skoru için POST /v1/mdm/duplicates kullanın.',
    ],
  }
}

export async function listTags(companyId: string) {
  return db
    .select()
    .from(mdmTags)
    .where(and(eq(mdmTags.companyId, companyId), isNull(mdmTags.deletedAt)))
    .orderBy(desc(mdmTags.createdAt))
    .limit(200)
}

export async function upsertTag(
  companyId: string,
  input: { code: string; label: string; color?: string },
) {
  const code = input.code.trim().toLowerCase()
  const [existing] = await db
    .select()
    .from(mdmTags)
    .where(and(eq(mdmTags.companyId, companyId), eq(mdmTags.code, code)))
    .limit(1)
  if (existing) {
    const [row] = await db
      .update(mdmTags)
      .set({ label: input.label, color: input.color || existing.color, updatedAt: new Date() })
      .where(eq(mdmTags.id, existing.id))
      .returning()
    return row
  }
  const [row] = await db
    .insert(mdmTags)
    .values({
      companyId,
      code,
      label: input.label,
      color: input.color || null,
    })
    .returning()
  return row
}
