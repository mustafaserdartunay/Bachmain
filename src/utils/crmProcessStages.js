import { getCrmStageAccent } from './bachBrand'
import { loadCrmProcessTemplates } from './crmProcessTemplatesStore'

export { CRM_STAGE_COLORS } from './crmProcessTemplatesStore'

const TYPE_TO_TEMPLATE = {
  Numune: 'numune',
  Ziyaret: 'ziyaret',
  Toplantı: 'toplanti',
  'Teklif Sunumu': 'teklif',
  Telefon: 'genel',
}

const CATEGORY_TO_TEMPLATE = {
  Numune: 'numune',
  Teklif: 'teklif',
  Tahsilat: 'tahsilat',
  Ziyaret: 'ziyaret',
  Takip: 'genel',
  Genel: 'genel',
}

export function getCrmProcessTemplates() {
  return loadCrmProcessTemplates()
}

export function getCrmTemplateByLabel(label) {
  const clean = String(label || '').trim()
  if (!clean) return null
  return Object.values(loadCrmProcessTemplates()).find((template) => template.label === clean) || null
}

export function getCrmTemplateCategoryOptions() {
  return Object.values(loadCrmProcessTemplates()).map((template) => ({
    label: template.label,
    color: template.stages[0]?.color || 'bg-gray-500',
  }))
}

export function getCrmTemplateStageOptions(categoryLabel) {
  const template = getCrmTemplateByLabel(categoryLabel)
  if (!template) return []
  return template.stages.map((stage) => ({
    label: stage.label,
    color: stage.color,
  }))
}

export function resolveCrmProcessTemplate(record, kind = 'appointment') {
  const templates = loadCrmProcessTemplates()
  if (record?.processTrack?.templateId && templates[record.processTrack.templateId]) {
    return templates[record.processTrack.templateId]
  }
  if (kind === 'appointment') {
    return templates[TYPE_TO_TEMPLATE[record?.type] || 'genel'] || templates.genel
  }
  if (record?.category) {
    const byLabel = getCrmTemplateByLabel(record.category)
    if (byLabel) return byLabel
  }
  return templates[CATEGORY_TO_TEMPLATE[record?.category] || 'genel'] || templates.genel
}

export function getCrmTemplateStage(template, stageId) {
  return template?.stages?.find((stage) => stage.id === stageId) || null
}

/** @deprecated Use getCrmProcessTemplates() — kept for legacy imports */
export const CRM_PROCESS_TEMPLATES = new Proxy({}, {
  get(_target, prop) {
    return loadCrmProcessTemplates()[prop]
  },
  ownKeys() {
    return Reflect.ownKeys(loadCrmProcessTemplates())
  },
  getOwnPropertyDescriptor(_target, prop) {
    const templates = loadCrmProcessTemplates()
    if (prop in templates) {
      return {
        configurable: true,
        enumerable: true,
        value: templates[prop],
      }
    }
    return undefined
  },
})

export { getCrmStageAccent }
