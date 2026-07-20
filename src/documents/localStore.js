/** DP-0 local extras (assets/fonts/AI/marketplace) — templates stay in docTemplatesStore. */

const KEY = 'bach_documents_dp0_v1'
const EVT = 'bach:documents-updated'

export const DOCUMENTS_UPDATED_EVENT = EVT

const MARKET = [
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
    title: 'Packing List (DE)',
    sector: 'logistics',
    locale: 'de',
    premium: true,
  },
  {
    slug: 'pallet-label',
    title: 'Palet Etiketi',
    sector: 'warehouse',
    locale: 'tr',
    premium: false,
  },
  { slug: 'production-form', title: 'Üretim Formu', sector: 'mes', locale: 'tr', premium: false },
]

function blank() {
  return {
    assets: [
      { id: 'a1', name: 'Şirket Logosu', kind: 'logo' },
      { id: 'a2', name: 'Kaşe', kind: 'stamp' },
      { id: 'a3', name: 'İmza', kind: 'signature' },
    ],
    fonts: [
      { id: 'f1', family: 'SF Pro Display', source: 'system', weights: [400, 600, 700] },
      { id: 'f2', family: 'Inter', source: 'google', weights: [400, 500, 700] },
      { id: 'f3', family: 'IBM Plex Sans', source: 'google', weights: [400, 600] },
    ],
    aiDesigns: [],
    marketplace: MARKET,
  }
}

function read() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return blank()
    return { ...blank(), ...JSON.parse(raw) }
  } catch {
    return blank()
  }
}

function write(state) {
  localStorage.setItem(KEY, JSON.stringify(state))
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVT))
  return state
}

export function ensureDocumentsSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function listAssetsLocal() {
  return read().assets
}

export function addAssetLocal(input) {
  const s = read()
  const row = {
    id: `ast_${Date.now().toString(36)}`,
    name: input.name || 'Asset',
    kind: input.kind || 'image',
    url: input.url || '',
  }
  s.assets = [row, ...s.assets]
  write(s)
  return row
}

export function listFontsLocal() {
  return read().fonts
}

export function addFontLocal(input) {
  const s = read()
  const row = {
    id: `fnt_${Date.now().toString(36)}`,
    family: input.family || 'Custom',
    source: input.source || 'corporate',
    weights: input.weights || [400, 700],
  }
  s.fonts = [row, ...s.fonts]
  write(s)
  return row
}

export function listMarketplaceLocal() {
  return read().marketplace
}

export function listAiDesignsLocal() {
  return read().aiDesigns
}

export function runAiDesignLocal(prompt) {
  const s = read()
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
            : 'generic'

  const row = {
    id: `ai_${Date.now().toString(36)}`,
    prompt,
    docType: inferred,
    status: 'ready',
    style: /minimal/i.test(prompt) ? 'minimal' : /modern/i.test(prompt) ? 'modern' : 'classic',
    blocks: [
      { type: 'heading', text: inferred },
      { type: 'variable', path: 'musteri.unvan' },
      { type: 'variable', path: 'belge.no' },
      { type: 'table', source: 'kalemler' },
      { type: 'variable', path: 'belge.toplam' },
    ],
    at: new Date().toISOString(),
  }
  s.aiDesigns = [row, ...s.aiDesigns]
  write(s)
  return row
}

export function documentsOverviewLocal(templateCount = 0) {
  const s = read()
  return {
    phase: 'DP-0',
    templateCount,
    assetCount: s.assets.length,
    fontCount: s.fonts.length,
    aiDesignCount: s.aiDesigns.length,
    marketplaceCount: s.marketplace.length,
    engine: 'docPrint+variableEngine',
  }
}
