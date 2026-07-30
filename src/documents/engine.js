/**
 * Single document engine adapter (DP-0).
 * All modules should call this instead of inventing new PDF stacks.
 * SoT render: docVariableEngine + docPrint.
 */
import { getDocTemplateById } from '../utils/docTemplatesStore'
import { buildDocumentContext, renderTemplateHtml } from '../utils/docVariableEngine'
import { downloadPdfFromHtml, openPrintWindow } from '../utils/docPrint'
import { publishDomainEvent } from '../workflow/eventBus'

/**
 * @param {{ docType?: string, documentId?: string, templateId?: string, context?: object, html?: string }} input
 */
export async function renderDocument(input = {}) {
  const template = input.templateId ? getDocTemplateById(input.templateId) : null
  const context = input.context || buildDocumentContext({})
  const renderedTemplate = template ? renderTemplateHtml(template, context) : null
  const html =
    input.html ||
    (typeof renderedTemplate === 'string' ? renderedTemplate : renderedTemplate?.html) ||
    `<div style="font-family:system-ui;padding:24px"><h1>${input.docType || 'Belge'}</h1><p>Document Platform engine · DP-0</p></div>`

  publishDomainEvent(
    'trigger.document.rendered',
    { docType: input.docType, templateId: template?.id, documentId: input.documentId },
    { source: 'documents/engine' },
  )

  return { html, template, context, engine: 'docPrint+variableEngine' }
}

export async function printDocument(input = {}) {
  const { html } = await renderDocument(input)
  openPrintWindow(html)
  publishDomainEvent(
    'trigger.document.printed',
    { templateId: input.templateId },
    { source: 'documents/engine' },
  )
  return { ok: true }
}

export async function downloadDocumentPdf(input = {}) {
  const { html, template } = await renderDocument(input)
  const filename = input.filename || `${template?.name || input.docType || 'belge'}.pdf`
  await downloadPdfFromHtml(html, filename)
  publishDomainEvent(
    'trigger.document.pdf.downloaded',
    { docType: input.docType, documentId: input.documentId, templateId: template?.id },
    { source: 'documents/engine' },
  )
  return { ok: true }
}

export const DOCUMENT_ENGINE_RULE =
  'Tek belge motoru: src/documents/engine.js → docPrint. Yeni PDF stack yasak.'
