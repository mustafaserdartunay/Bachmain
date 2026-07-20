/** AI App Builder catalogs — AB-0. */

export const APP_BUILDER_FIELD_TYPES = [
  'text',
  'textarea',
  'number',
  'money',
  'date',
  'time',
  'checkbox',
  'radio',
  'switch',
  'dropdown',
  'tree',
  'lookup',
  'autocomplete',
  'upload',
  'photo',
  'video',
  'signature',
  'qr',
  'barcode',
  'location',
  'ai_field',
] as const

export const APP_BUILDER_VIEW_TYPES = [
  'list',
  'kanban',
  'calendar',
  'timeline',
  'map',
  'card',
  'pivot',
] as const

export const WORKFLOW_NODE_HINTS = [
  'IF',
  'ELSE',
  'WAIT',
  'APPROVAL',
  'MAIL',
  'SMS',
  'WHATSAPP',
  'AI',
  'API',
  'WEBHOOK',
  'QUEUE',
  'LOOP',
] as const

export const MODULE_TEMPLATES = [
  {
    id: 'tpl_service',
    name: 'Servis Takip',
    prompt: 'Servis Takip Modülü oluştur.',
    modules: ['service_tickets', 'technicians', 'sla'],
  },
  {
    id: 'tpl_maintenance',
    name: 'Makine Bakım Takvimi',
    prompt: 'Makine Bakım Takvimi hazırla.',
    modules: ['assets', 'maintenance_plans', 'work_orders'],
  },
  {
    id: 'tpl_sample',
    name: 'Numune Takip',
    prompt: 'Numune Takip Sistemi oluştur.',
    modules: ['samples', 'labs', 'results'],
  },
  {
    id: 'tpl_vehicle',
    name: 'Araç Teslim Formu',
    prompt: 'Araç Teslim Formu oluştur.',
    modules: ['vehicles', 'handover_forms', 'signatures'],
  },
] as const

export const MARKETPLACE_PACKS = [
  { id: 'pack_service', name: 'Servis Pack', kind: 'module' },
  { id: 'pack_hr_forms', name: 'İK Form Pack', kind: 'form' },
  { id: 'pack_ops_dash', name: 'Ops Dashboard Pack', kind: 'dashboard' },
  { id: 'pack_approval_wf', name: 'Onay Workflow Pack', kind: 'workflow' },
] as const

export type AppDraftScaffold = {
  name: string
  slug: string
  description: string
  menu: string[]
  entities: { name: string; fields: string[] }[]
  screens: string[]
  workflows: string[]
  reports: string[]
  permissions: string[]
  deepLinks: { label: string; to: string }[]
  explainWhy: string
}

function slugify(input: string) {
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

/** Heuristic NL → scaffold (AB-0). Real LLM codegen in AB-1+. */
export function scaffoldFromNaturalLanguage(prompt: string): AppDraftScaffold {
  const p = String(prompt || '').trim()
  const lower = p.toLowerCase()
  const matched = MODULE_TEMPLATES.find(
    (t) =>
      lower.includes(t.name.toLowerCase().split(' ')[0]) ||
      lower.includes(t.id.replace('tpl_', '')),
  )

  const quoted = p.match(/["“](.+?)["”]/)
  const name =
    matched?.name ||
    quoted?.[1] ||
    p
      .replace(/oluştur|hazırla|yap|modülü|sistemi|formu/gi, '')
      .trim()
      .slice(0, 60) ||
    'Yeni Modül'

  const slug = slugify(name)
  const entity = name.replace(/\s+/g, '')

  return {
    name,
    slug,
    description: `AI App Builder taslağı: ${p.slice(0, 160)}`,
    menu: [name, `${name} Listesi`, `${name} Form`, `${name} Rapor`],
    entities: [
      {
        name: entity,
        fields: ['id', 'title', 'status', 'assignee', 'dueDate', 'notes', 'createdAt'],
      },
      {
        name: `${entity}Line`,
        fields: ['id', 'parentId', 'item', 'qty', 'amount'],
      },
    ],
    screens: ['Liste', 'Form', 'Filtre', 'Dashboard', 'Yazdırma', 'Mobil'],
    workflows: ['Kayıt oluşturuldu → Bildirim', 'Eşik aşıldı → Onay → Mail/WhatsApp'],
    reports: ['Liste PDF', 'Özet Dashboard', 'AI Summary'],
    permissions: [`${slug}.view`, `${slug}.create`, `${slug}.update`, `${slug}.approve`],
    deepLinks: [
      { label: 'Workflow Designer', to: '/otomasyon/designer' },
      { label: 'Dashboard Builder', to: '/analitik?tab=builder' },
      { label: 'Document Designer', to: '/belge-merkezi/tasarimci' },
      { label: 'Plugin Center', to: '/platform?tab=plugins' },
    ],
    explainWhy:
      'NL istek → şablon/heuristik iskelet. Master Data tekrar edilmez; yayın Plugin SDK uzantısı olarak yapılır (AB-0).',
  }
}

export function getAppBuilderCatalog() {
  return {
    version: 'AB-0',
    fieldTypes: APP_BUILDER_FIELD_TYPES,
    viewTypes: APP_BUILDER_VIEW_TYPES,
    workflowNodes: WORKFLOW_NODE_HINTS,
    templates: MODULE_TEMPLATES,
    marketplace: MARKETPLACE_PACKS,
    rule: 'Extensions only via Plugin SDK. Core Platform / domain SoT never patched directly.',
  }
}
