import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  knowledgeChunks,
  knowledgeDocuments,
  knowledgeFaq,
  knowledgeLinks,
  knowledgeSearchLog,
  knowledgeVersions,
} from '../../db/schema/index.js'
import { AppError } from '../../shared/errors.js'
import { maskSensitiveText } from '../../shared/crypto.js'
import { getMcpTool, MCP_TOOLS } from './mcpTools.js'
import {
  chunkText,
  cosine,
  detectLanguage,
  extractKeywords,
  lexicalScore,
  stubEmbedding,
  summarize,
  tokenize,
} from './textUtils.js'

export type ScopeFilter = {
  branchId?: string | null
  warehouseId?: string | null
  roleCodes?: string[]
}

function scopeOk(
  doc: { branchId: string | null; warehouseId: string | null; roleCodes: string[] | null },
  scope?: ScopeFilter,
) {
  if (!scope) return true
  if (scope.branchId && doc.branchId && doc.branchId !== scope.branchId) return false
  if (scope.warehouseId && doc.warehouseId && doc.warehouseId !== scope.warehouseId) return false
  const roles = Array.isArray(doc.roleCodes) ? doc.roleCodes : []
  if (roles.length && scope.roleCodes?.length) {
    if (!roles.some((r) => scope.roleCodes!.includes(r))) return false
  }
  return true
}

export async function overview(companyId: string) {
  const [total] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeDocuments)
    .where(and(eq(knowledgeDocuments.companyId, companyId), isNull(knowledgeDocuments.deletedAt)))
  const [ocrPending] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.companyId, companyId),
        eq(knowledgeDocuments.ocrStatus, 'pending'),
        isNull(knowledgeDocuments.deletedAt),
      ),
    )
  const [missingTags] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.companyId, companyId),
        sql`coalesce(jsonb_array_length(${knowledgeDocuments.tags}), 0) = 0`,
        isNull(knowledgeDocuments.deletedAt),
      ),
    )
  const [indexed] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.companyId, companyId),
        eq(knowledgeDocuments.indexStatus, 'ready'),
        isNull(knowledgeDocuments.deletedAt),
      ),
    )
  const topQueries = await db
    .select({
      query: knowledgeSearchLog.query,
      count: sql<number>`count(*)::int`,
    })
    .from(knowledgeSearchLog)
    .where(eq(knowledgeSearchLog.companyId, companyId))
    .groupBy(knowledgeSearchLog.query)
    .orderBy(desc(sql`count(*)`))
    .limit(10)

  return {
    totalDocuments: total?.count || 0,
    ocrPending: ocrPending?.count || 0,
    missingTags: missingTags?.count || 0,
    indexedReady: indexed?.count || 0,
    topQueries,
  }
}

export async function listDocuments(companyId: string, scope?: ScopeFilter) {
  const rows = await db
    .select()
    .from(knowledgeDocuments)
    .where(and(eq(knowledgeDocuments.companyId, companyId), isNull(knowledgeDocuments.deletedAt)))
    .orderBy(desc(knowledgeDocuments.updatedAt))
    .limit(200)
  return rows.filter((r) => scopeOk(r, scope))
}

export async function getDocument(companyId: string, id: string) {
  const [doc] = await db
    .select()
    .from(knowledgeDocuments)
    .where(
      and(
        eq(knowledgeDocuments.id, id),
        eq(knowledgeDocuments.companyId, companyId),
        isNull(knowledgeDocuments.deletedAt),
      ),
    )
    .limit(1)
  if (!doc) throw new AppError('NOT_FOUND', 'Belge bulunamadı', 404)
  const versions = await db
    .select()
    .from(knowledgeVersions)
    .where(eq(knowledgeVersions.documentId, id))
    .orderBy(desc(knowledgeVersions.version))
  const links = await db.select().from(knowledgeLinks).where(eq(knowledgeLinks.documentId, id))
  return { document: doc, versions, links }
}

async function rebuildChunks(
  companyId: string,
  documentId: string,
  version: number,
  contentText: string,
) {
  await db.delete(knowledgeChunks).where(eq(knowledgeChunks.documentId, documentId))
  const parts = chunkText(contentText)
  for (let i = 0; i < parts.length; i += 1) {
    const tokens = tokenize(parts[i])
    await db.insert(knowledgeChunks).values({
      documentId,
      companyId,
      version,
      chunkIndex: i,
      content: maskSensitiveText(parts[i]),
      tokens,
      embedding: stubEmbedding(tokens),
    })
  }
}

export async function ingestDocument(input: {
  companyId: string
  userId?: string
  title: string
  contentText: string
  docType?: string
  category?: string
  tags?: string[]
  links?: { entityType: string; entityId: string; label?: string }[]
  branchId?: string | null
  warehouseId?: string | null
  roleCodes?: string[]
  sourceModule?: string
  needsOcr?: boolean
}) {
  const content = maskSensitiveText(input.contentText || '')
  const keywords = extractKeywords(content)
  const language = detectLanguage(content)
  const summary = summarize(content)

  const [doc] = await db
    .insert(knowledgeDocuments)
    .values({
      companyId: input.companyId,
      title: input.title,
      docType: input.docType || 'txt',
      category: input.category || 'general',
      language,
      status: input.needsOcr ? 'processing' : 'indexed',
      summary,
      keywords,
      tags: input.tags || [],
      currentVersion: 1,
      branchId: input.branchId || null,
      warehouseId: input.warehouseId || null,
      roleCodes: input.roleCodes || [],
      sourceModule: input.sourceModule || 'knowledge',
      ocrStatus: input.needsOcr ? 'pending' : 'none',
      indexStatus: 'ready',
      createdBy: input.userId || null,
      updatedBy: input.userId || null,
      byteSize: Buffer.byteLength(content, 'utf8'),
    })
    .returning()

  await db.insert(knowledgeVersions).values({
    documentId: doc.id,
    companyId: input.companyId,
    version: 1,
    contentText: content,
    changelog: 'Initial ingest',
    createdBy: input.userId || null,
  })

  await rebuildChunks(input.companyId, doc.id, 1, content)

  for (const link of input.links || []) {
    await db.insert(knowledgeLinks).values({
      documentId: doc.id,
      companyId: input.companyId,
      entityType: link.entityType,
      entityId: link.entityId,
      label: link.label || null,
    })
  }

  return doc
}

export async function addVersion(
  companyId: string,
  documentId: string,
  contentText: string,
  changelog?: string,
  userId?: string,
) {
  const { document } = await getDocument(companyId, documentId)
  const next = (document.currentVersion || 1) + 1
  const content = maskSensitiveText(contentText)

  await db.insert(knowledgeVersions).values({
    documentId,
    companyId,
    version: next,
    contentText: content,
    changelog: changelog || `v${next}`,
    createdBy: userId || null,
  })

  const [updated] = await db
    .update(knowledgeDocuments)
    .set({
      currentVersion: next,
      summary: summarize(content),
      keywords: extractKeywords(content),
      language: detectLanguage(content),
      indexStatus: 'ready',
      updatedBy: userId || null,
      updatedAt: new Date(),
      byteSize: Buffer.byteLength(content, 'utf8'),
    })
    .where(and(eq(knowledgeDocuments.id, documentId), eq(knowledgeDocuments.companyId, companyId)))
    .returning()

  await rebuildChunks(companyId, documentId, next, content)
  return updated
}

export async function searchKnowledge(input: {
  companyId: string
  userId?: string
  query: string
  limit?: number
  scope?: ScopeFilter
}) {
  const q = String(input.query || '').trim()
  if (!q) return { hits: [], query: q }

  const qTokens = tokenize(q)
  const qEmbed = stubEmbedding(qTokens)
  const docs = await listDocuments(input.companyId, input.scope)
  const docIds = docs.map((d) => d.id)
  if (!docIds.length) {
    await db.insert(knowledgeSearchLog).values({
      companyId: input.companyId,
      userId: input.userId || null,
      query: q,
      hitCount: 0,
    })
    return { hits: [], query: q }
  }

  const chunks = await db
    .select()
    .from(knowledgeChunks)
    .where(eq(knowledgeChunks.companyId, input.companyId))
    .limit(2000)

  const byDoc = new Map(docs.map((d) => [d.id, d]))
  const scored: {
    documentId: string
    title: string
    score: number
    snippet: string
    category: string
  }[] = []

  for (const ch of chunks) {
    if (!byDoc.has(ch.documentId)) continue
    const lex = lexicalScore(qTokens, (ch.tokens as string[]) || tokenize(ch.content))
    const sem = cosine(qEmbed, (ch.embedding as number[]) || [])
    const score = lex * 0.65 + sem * 0.35
    if (score <= 0) continue
    const doc = byDoc.get(ch.documentId)!
    // title boost
    const titleBoost = lexicalScore(qTokens, tokenize(doc.title)) * 0.2
    scored.push({
      documentId: doc.id,
      title: doc.title,
      category: doc.category,
      score: score + titleBoost,
      snippet: summarize(ch.content, 220),
    })
  }

  // also title/summary match without chunks
  for (const doc of docs) {
    const s = lexicalScore(qTokens, tokenize(`${doc.title} ${doc.summary || ''}`))
    if (s > 0.15 && !scored.some((h) => h.documentId === doc.id)) {
      scored.push({
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        score: s,
        snippet: doc.summary || '',
      })
    }
  }

  scored.sort((a, b) => b.score - a.score)
  const limit = Math.min(input.limit || 10, 50)
  // dedupe by document keeping best chunk
  const best = new Map<string, (typeof scored)[0]>()
  for (const h of scored) {
    const prev = best.get(h.documentId)
    if (!prev || h.score > prev.score) best.set(h.documentId, h)
  }
  const hits = [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit)

  await db.insert(knowledgeSearchLog).values({
    companyId: input.companyId,
    userId: input.userId || null,
    query: q,
    hitCount: hits.length,
    meta: { mode: 'hybrid-stub' },
  })

  return { hits, query: q }
}

export async function ragAssemble(input: {
  companyId: string
  userId?: string
  query: string
  limit?: number
  scope?: ScopeFilter
}) {
  const { hits, query } = await searchKnowledge(input)
  const top = hits.slice(0, input.limit || 5)
  const contextBlocks = top.map((h, i) => `[${i + 1}] ${h.title} (${h.category})\n${h.snippet}`)
  const systemHint =
    'Aşağıdaki şirket bilgi bankası kayıtlarını kullanarak yanıt ver. Kayıtlarda yoksa uydurma; yetkisiz veri isteme.'
  const prompt = `${systemHint}\n\nSORU: ${query}\n\nKAYNAKLAR:\n${contextBlocks.join('\n\n') || '(eşleşme yok)'}`

  return {
    query,
    hits: top,
    prompt: maskSensitiveText(prompt),
    contextCount: top.length,
  }
}

export async function listFaq(companyId: string) {
  return db
    .select()
    .from(knowledgeFaq)
    .where(and(eq(knowledgeFaq.companyId, companyId), isNull(knowledgeFaq.deletedAt)))
    .orderBy(desc(knowledgeFaq.updatedAt))
    .limit(100)
}

export async function createFaq(input: {
  companyId: string
  question: string
  answer: string
  tags?: string[]
}) {
  const [row] = await db
    .insert(knowledgeFaq)
    .values({
      companyId: input.companyId,
      question: input.question,
      answer: maskSensitiveText(input.answer),
      tags: input.tags || [],
    })
    .returning()
  return row
}

export function listMcpTools() {
  return MCP_TOOLS
}

export async function invokeMcpTool(input: {
  companyId: string
  userId?: string
  tool: string
  args?: Record<string, unknown>
  scope?: ScopeFilter
}) {
  const tool = getMcpTool(input.tool)
  if (!tool) throw new AppError('NOT_FOUND', `MCP tool yok: ${input.tool}`, 404)

  const args = input.args || {}
  if (input.tool === 'search_documents') {
    return searchKnowledge({
      companyId: input.companyId,
      userId: input.userId,
      query: String(args.query || ''),
      limit: Number(args.limit || 10),
      scope: input.scope,
    })
  }

  // KP-0 stubs for other tools — real adapters in KP-1/AIOS-1
  return {
    ok: true,
    simulated: true,
    tool: input.tool,
    message: `${tool.description} (KP-0 stub)`,
    args,
    requiresApproval: Boolean(tool.requiresApproval),
  }
}
