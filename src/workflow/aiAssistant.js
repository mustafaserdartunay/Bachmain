import { createLocalWorkflow } from './localStore'
import { WORKFLOW_TEMPLATES } from './catalog'

/** Very small NL → template matcher (WF-0 stub for AI assistant). */
export function suggestWorkflowFromPrompt(prompt) {
  const q = String(prompt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const rules = [
    { re: /almanya|export|dis ticaret|ihrac/, templateId: 'tpl.logistics' },
    { re: /teklif|quote|onay/, templateId: 'tpl.quote_approval' },
    { re: /stok|satin alma|purchase/, templateId: 'tpl.purchasing' },
    { re: /uretim|production/, templateId: 'tpl.production' },
    { re: /kalite|quality/, templateId: 'tpl.quality' },
    { re: /depo|warehouse/, templateId: 'tpl.warehouse' },
    { re: /lojistik|teslim|kargo/, templateId: 'tpl.logistics' },
    { re: /tahsilat|fatura|collection/, templateId: 'tpl.collection' },
    { re: /crm|musteri/, templateId: 'tpl.crm' },
    { re: /ik|personel|hr/, templateId: 'tpl.hr' },
    { re: /muhasebe|accounting/, templateId: 'tpl.accounting' },
    { re: /seo|marketing|pazarlama/, templateId: 'tpl.ai_marketing' },
  ]

  for (const rule of rules) {
    if (rule.re.test(q)) {
      const tpl = WORKFLOW_TEMPLATES.find((t) => t.id === rule.templateId)
      if (tpl) return { template: tpl, confidence: 0.7, reason: 'keyword' }
    }
  }

  return {
    template: WORKFLOW_TEMPLATES[0],
    confidence: 0.3,
    reason: 'default',
  }
}

export function createWorkflowFromPrompt(prompt) {
  const { template, confidence, reason } = suggestWorkflowFromPrompt(prompt)
  const row = createLocalWorkflow({
    name: `${template.name} (AI)`,
    description: `AI taslak: "${prompt}" (${reason}, ${Math.round(confidence * 100)}%)`,
    graph: structuredClone(template.graph),
    templateId: template.id,
  })
  return { workflow: row, template, confidence, reason }
}
