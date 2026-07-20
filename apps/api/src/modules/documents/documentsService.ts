import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { db } from '../../db/client.js'
import {
  docAiDesigns,
  docAssets,
  docFonts,
  docLabels,
  docMarketplaceItems,
  docPrintJobs,
  docPrintProfiles,
  docTemplates,
} from '../../db/schema/index.js'
import { ingestEvent } from '../workflow/workflowService.js'

const MARKET_SEED = [
  {
    slug: 'quote-modern-tr',
    title: 'Modern Teklif (TR)',
    sector: 'genel',
    locale: 'tr',
    premium: false,
  },
  {
    slug: 'invoice-minimal-en',
    title: 'Minimal Invoice (EN)',
    sector: 'finance',
    locale: 'en',
    premium: false,
  },
  {
    slug: 'packing-list-de',
    title: 'Packing List (DE Export)',
    sector: 'logistics',
    locale: 'de',
    premium: true,
  },
  {
    slug: 'pallet-label-mm',
    title: 'Palet Etiketi',
    sector: 'warehouse',
    locale: 'tr',
    premium: false,
  },
]

async function ensureMarketplace() {
  const [existing] = await db.select().from(docMarketplaceItems).limit(1)
  if (existing) return
  for (const row of MARKET_SEED) {
    await db.insert(docMarketplaceItems).values({
      slug: row.slug,
      title: row.title,
      sector: row.sector,
      locale: row.locale,
      premium: row.premium,
      payload: { blocks: [], promptHint: row.title },
    })
  }
}

export async function overview(companyId: string) {
  await ensureMarketplace()
  const [tpl] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(docTemplates)
    .where(and(eq(docTemplates.companyId, companyId), isNull(docTemplates.deletedAt)))
  const [labels] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(docLabels)
    .where(and(eq(docLabels.companyId, companyId), isNull(docLabels.deletedAt)))
  const [jobs] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(docPrintJobs)
    .where(and(eq(docPrintJobs.companyId, companyId), isNull(docPrintJobs.deletedAt)))
  const [assets] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(docAssets)
    .where(and(eq(docAssets.companyId, companyId), isNull(docAssets.deletedAt)))

  return {
    phase: 'DP-0',
    templateCount: tpl?.count ?? 0,
    labelCount: labels?.count ?? 0,
    printJobCount: jobs?.count ?? 0,
    assetCount: assets?.count ?? 0,
    engine: 'docPrint+variableEngine',
    source: 'dp-0-dual-write-ready',
    links: {
      hub: '/belge-merkezi',
      builder: '/belge-merkezi/tasarimci',
      labels: '/belge-merkezi/etiket',
      print: '/belge-merkezi/yazdir',
      knowledge: '/bilgi-merkezi',
    },
  }
}

export async function listTemplates(companyId: string) {
  return db
    .select()
    .from(docTemplates)
    .where(and(eq(docTemplates.companyId, companyId), isNull(docTemplates.deletedAt)))
    .orderBy(desc(docTemplates.updatedAt))
}

export async function createTemplate(
  companyId: string,
  input: { name: string; docType?: string; design?: Record<string, unknown>; locale?: string },
) {
  const [row] = await db
    .insert(docTemplates)
    .values({
      companyId,
      name: input.name,
      docType: input.docType || 'generic',
      design: input.design || {},
      locale: input.locale || 'tr',
      status: 'draft',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.document.template.created', {
    templateId: row.id,
    docType: row.docType,
  })
  return row
}

export async function listLabels(companyId: string) {
  return db
    .select()
    .from(docLabels)
    .where(and(eq(docLabels.companyId, companyId), isNull(docLabels.deletedAt)))
    .orderBy(desc(docLabels.updatedAt))
}

export async function createLabel(
  companyId: string,
  input: { name: string; widthMm: number; heightMm: number; labelKind?: string },
) {
  const [row] = await db
    .insert(docLabels)
    .values({
      companyId,
      name: input.name,
      widthMm: String(input.widthMm),
      heightMm: String(input.heightMm),
      labelKind: input.labelKind || 'product',
    })
    .returning()
  return row
}

export async function listProfiles(companyId: string) {
  return db
    .select()
    .from(docPrintProfiles)
    .where(and(eq(docPrintProfiles.companyId, companyId), isNull(docPrintProfiles.deletedAt)))
}

export async function createProfile(
  companyId: string,
  input: { name: string; brand?: string; deviceClass?: string; target?: string; paper?: string },
) {
  const [row] = await db
    .insert(docPrintProfiles)
    .values({
      companyId,
      name: input.name,
      brand: input.brand,
      deviceClass: input.deviceClass || 'laser',
      target: input.target || 'browser',
      paper: input.paper || 'A4',
    })
    .returning()
  return row
}

export async function listJobs(companyId: string) {
  return db
    .select()
    .from(docPrintJobs)
    .where(and(eq(docPrintJobs.companyId, companyId), isNull(docPrintJobs.deletedAt)))
    .orderBy(desc(docPrintJobs.createdAt))
    .limit(100)
}

export async function createJob(
  companyId: string,
  input: { templateId?: string; docType?: string; sourceRef?: string; output?: string },
) {
  const [row] = await db
    .insert(docPrintJobs)
    .values({
      companyId,
      templateId: input.templateId,
      docType: input.docType,
      sourceRef: input.sourceRef,
      output: input.output || 'pdf',
      status: 'queued',
    })
    .returning()
  await ingestEvent(companyId, 'trigger.document.print.queued', { jobId: row.id })
  return row
}

export async function listAssets(companyId: string) {
  return db
    .select()
    .from(docAssets)
    .where(and(eq(docAssets.companyId, companyId), isNull(docAssets.deletedAt)))
}

export async function createAsset(
  companyId: string,
  input: { name: string; kind?: string; url?: string },
) {
  const [row] = await db
    .insert(docAssets)
    .values({
      companyId,
      name: input.name,
      kind: input.kind || 'image',
      url: input.url,
    })
    .returning()
  return row
}

export async function listFonts(companyId: string) {
  return db
    .select()
    .from(docFonts)
    .where(and(eq(docFonts.companyId, companyId), isNull(docFonts.deletedAt)))
}

export async function createFont(
  companyId: string,
  input: { family: string; source?: string; weights?: unknown[] },
) {
  const [row] = await db
    .insert(docFonts)
    .values({
      companyId,
      family: input.family,
      source: input.source || 'system',
      weights: input.weights || [400, 700],
    })
    .returning()
  return row
}

export async function renderStub(
  companyId: string,
  input: { templateId?: string; docType?: string; context?: Record<string, unknown> },
) {
  await ingestEvent(companyId, 'trigger.document.rendered', {
    templateId: input.templateId,
    docType: input.docType,
  })
  return {
    ok: true,
    engine: 'dp-0-stub',
    html: `<div><h1>${input.docType || 'document'}</h1><p>Render via client docPrint engine.</p></div>`,
    note: 'Server PDF in DP-2; client SoT is src/documents/engine.js',
  }
}

export async function aiDesign(companyId: string, input: { prompt: string; docType?: string }) {
  const prompt = input.prompt.trim()
  const inferred = /fatura|invoice/i.test(prompt)
    ? 'invoice'
    : /teklif|quote/i.test(prompt)
      ? 'quote'
      : /palet|etiket|label/i.test(prompt)
        ? 'label'
        : /packing|ihracat/i.test(prompt)
          ? 'packing_list'
          : /üretim|production/i.test(prompt)
            ? 'production'
            : input.docType || 'generic'

  const result = {
    name: `AI · ${inferred}`,
    docType: inferred,
    blocks: [
      { type: 'heading', text: inferred === 'invoice' ? 'Invoice' : 'Belge' },
      { type: 'variable', path: 'musteri.unvan' },
      { type: 'variable', path: 'belge.no' },
      { type: 'table', source: 'kalemler' },
      { type: 'variable', path: 'belge.toplam' },
    ],
    style: /minimal/i.test(prompt) ? 'minimal' : /modern/i.test(prompt) ? 'modern' : 'classic',
  }

  const [row] = await db
    .insert(docAiDesigns)
    .values({
      companyId,
      prompt,
      docType: inferred,
      status: 'ready',
      result,
    })
    .returning()

  await ingestEvent(companyId, 'trigger.document.ai.designed', {
    designId: row.id,
    docType: inferred,
  })
  return row
}

export async function marketplace() {
  await ensureMarketplace()
  return db
    .select()
    .from(docMarketplaceItems)
    .where(isNull(docMarketplaceItems.deletedAt))
    .orderBy(desc(docMarketplaceItems.createdAt))
}
