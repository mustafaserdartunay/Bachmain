/** AB-0 App Builder local drafts + NL scaffold. */

const KEY = 'bach_app_builder_ab0_v1'
const EVT = 'bach:app-builder-updated'

export const APP_BUILDER_UPDATED_EVENT = EVT

export const FIELD_TYPES = [
  'Text',
  'Textarea',
  'Number',
  'Money',
  'Date',
  'Time',
  'Checkbox',
  'Radio',
  'Switch',
  'Dropdown',
  'Lookup',
  'Upload',
  'Photo',
  'Signature',
  'QR',
  'Barcode',
  'Location',
  'AI Field',
]

export const TEMPLATES = [
  { id: 'tpl_service', name: 'Servis Takip', prompt: 'Servis Takip Modülü oluştur.' },
  { id: 'tpl_maintenance', name: 'Makine Bakım Takvimi', prompt: 'Makine Bakım Takvimi hazırla.' },
  { id: 'tpl_sample', name: 'Numune Takip', prompt: 'Numune Takip Sistemi oluştur.' },
  { id: 'tpl_vehicle', name: 'Araç Teslim Formu', prompt: 'Araç Teslim Formu oluştur.' },
]

export const MARKETPLACE_PACKS = [
  { id: 'pack_service', name: 'Servis Pack', kind: 'module' },
  { id: 'pack_hr_forms', name: 'İK Form Pack', kind: 'form' },
  { id: 'pack_ops_dash', name: 'Ops Dashboard Pack', kind: 'dashboard' },
  { id: 'pack_approval_wf', name: 'Onay Workflow Pack', kind: 'workflow' },
]

function slugify(input) {
  return String(input || 'modul')
    .toLowerCase()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function scaffoldFromPrompt(prompt) {
  const p = String(prompt || '').trim()
  const matched = TEMPLATES.find((t) =>
    p.toLowerCase().includes(t.name.toLowerCase().split(' ')[0]),
  )
  const name =
    matched?.name ||
    p
      .replace(/oluştur|hazırla|yap|modülü|sistemi|formu/gi, '')
      .trim()
      .slice(0, 60) ||
    'Yeni Modül'
  const slug = slugify(name)
  return {
    name,
    slug,
    description: `AI App Builder taslağı: ${p.slice(0, 160)}`,
    menu: [name, `${name} Listesi`, `${name} Form`, `${name} Rapor`],
    entities: [
      {
        name: name.replace(/\s+/g, ''),
        fields: ['title', 'status', 'assignee', 'dueDate', 'notes'],
      },
    ],
    screens: ['Liste', 'Form', 'Filtre', 'Dashboard', 'Yazdırma', 'Mobil'],
    workflows: ['Kayıt → Bildirim', 'Eşik → Onay → Mail/WhatsApp'],
    reports: ['Liste PDF', 'Özet Dashboard', 'AI Summary'],
    permissions: [`${slug}.view`, `${slug}.create`, `${slug}.update`, `${slug}.approve`],
    deepLinks: [
      { label: 'Workflow Designer', to: '/otomasyon/designer' },
      { label: 'Dashboard Builder', to: '/analitik?tab=builder' },
      { label: 'Document Designer', to: '/belge-merkezi/tasarimci' },
      { label: 'Plugin Center', to: '/platform?tab=plugins' },
    ],
    explainWhy:
      'NL → şablon iskelet. Master Data tekrar edilmez; yayın Plugin SDK uzantısıdır (AB-0).',
  }
}

function blank() {
  return { drafts: [], versions: [] }
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

export function ensureAppBuilderSeed() {
  if (!localStorage.getItem(KEY)) write(blank())
}

export function appBuilderOverviewLocal() {
  const s = read()
  return {
    drafts: s.drafts.length,
    published: s.drafts.filter((d) => d.status === 'published').length,
    preview: s.drafts.filter((d) => d.status === 'preview').length,
  }
}

export function listDraftsLocal() {
  return read().drafts
}

export function createDraftFromNlLocal(prompt) {
  const scaffold = scaffoldFromPrompt(prompt)
  const s = read()
  const row = {
    id: `abd_${Date.now()}`,
    name: scaffold.name,
    slug: scaffold.slug,
    status: 'draft',
    prompt: String(prompt || '').trim(),
    scaffold,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  s.drafts = [row, ...s.drafts].slice(0, 50)
  write(s)
  return row
}

export function setDraftStatusLocal(id, status) {
  const s = read()
  s.drafts = s.drafts.map((d) =>
    d.id === id
      ? {
          ...d,
          status,
          version: status === 'published' ? d.version + 1 : d.version,
          updatedAt: new Date().toISOString(),
          publishMeta:
            status === 'published'
              ? {
                  pluginCode: `plugin.${d.slug}`,
                  note: 'Plugin SDK stub — Platform Center kaydı (PC-2).',
                }
              : d.publishMeta,
        }
      : d,
  )
  if (status === 'published') {
    const d = s.drafts.find((x) => x.id === id)
    s.versions = [
      {
        id: `v_${Date.now()}`,
        draftId: id,
        version: d?.version,
        at: new Date().toISOString(),
        name: d?.name,
      },
      ...(s.versions || []),
    ].slice(0, 40)
  }
  write(s)
  return s.drafts.find((d) => d.id === id)
}

export function listVersionsLocal() {
  return read().versions || []
}
