/**
 * Safe mustache-like variable resolver for Document Center.
 * No eval — whitelist path lookup only.
 */
import { blocksToHtml, migrateTemplateToVisual } from './docCanvasEngine'

function getPath(obj, path) {
  if (!path) return undefined
  return String(path).split('.').reduce((acc, key) => {
    if (acc == null) return undefined
    return acc[key]
  }, obj)
}

function formatValue(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'number') {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value)
  }
  return String(value)
}

/**
 * Replace {{path}} tokens. Unknown → "—".
 * Also supports {{#if path}}...{{/if}} (truthy check).
 */
export function resolveTemplateString(input, context, errors = []) {
  if (!input) return ''
  let text = String(input)

  text = text.replace(/\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, path, inner) => {
    const value = getPath(context, path)
    return value ? resolveTemplateString(inner, context, errors) : ''
  })

  text = text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, path) => {
    const value = getPath(context, path)
    if (value === undefined) {
      errors.push(path)
      return '—'
    }
    return formatValue(value)
  })

  return text
}

export function buildDocumentContext({
  company = {},
  user = {},
  customer = {},
  document = {},
  lineItems = [],
} = {}) {
  const kalemlerHtml = (lineItems || []).map((item, index) => {
    const name = item.product || item.description || item.name || `Kalem ${index + 1}`
    const qty = item.quantity ?? item.qty ?? 1
    const price = item.unitPrice ?? item.price ?? 0
    const line = (Number(qty) || 0) * (Number(price) || 0)
    return `<tr>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb">${formatValue(name)}</td>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;text-align:right">${formatValue(qty)}</td>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;text-align:right">${formatValue(price)}</td>
      <td style="padding:6px;border-bottom:1px solid #e5e7eb;text-align:right">${formatValue(line)}</td>
    </tr>`
  }).join('')

  const table = lineItems?.length
    ? `<table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr>
          <th style="text-align:left;padding:6px;border-bottom:2px solid #111">Ürün</th>
          <th style="text-align:right;padding:6px;border-bottom:2px solid #111">Adet</th>
          <th style="text-align:right;padding:6px;border-bottom:2px solid #111">Birim</th>
          <th style="text-align:right;padding:6px;border-bottom:2px solid #111">Tutar</th>
        </tr></thead>
        <tbody>${kalemlerHtml}</tbody>
      </table>`
    : '<p style="color:#888">Kalem yok</p>'

  return {
    sirket: {
      unvan: company.companyName || company.legalTitle || '',
      adres: company.address || '',
      telefon: company.phone || '',
      email: company.email || '',
      vergiDairesi: company.taxOffice || '',
      vergiNo: company.taxNumber || '',
      logo: company.logoDataUrl || '',
    },
    kullanici: {
      ad: user.fullName || user.displayName || '',
      email: user.email || '',
    },
    musteri: {
      unvan: customer.companyTitle || customer.company || customer.shortBrandName || '',
      kisaAd: customer.shortBrandName || '',
      telefon: customer.phone || '',
      email: customer.email || '',
      adres: customer.address || '',
    },
    belge: {
      no: document.id || '',
      tarih: document.createdAt || document.date || '',
      toplam: document.grandTotal ?? document.total ?? document.amount ?? '',
      not: document.notes || document.termsDescription || '',
    },
    kalemler_html: table,
  }
}

export function renderTemplateHtml(template, context) {
  const errors = []

  if (template?.designMode === 'visual' || (Array.isArray(template?.blocks) && template.blocks.length > 0)) {
    const visual = migrateTemplateToVisual(template)
    const canvasHtml = blocksToHtml(visual.blocks || [], {
      pageSize: visual.pageSize || 'A4',
      size: visual.pageSize || 'A4',
    })
    const resolved = resolveTemplateString(canvasHtml, context, errors)
    const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${template.name || 'Belge'}</title>
  <style>
    @page { size: ${template.pageSize || 'A4'} ${template.orientation || 'portrait'}; margin: 0; }
    body { margin: 0; font-family: Inter, Arial, sans-serif; color: #111; background: #fff; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>${resolved}</body>
</html>`
    return { html, errors: [...new Set(errors)] }
  }

  const header = resolveTemplateString(template.headerHtml, context, errors)
  const body = resolveTemplateString(template.bodyHtml, context, errors)
  const footer = resolveTemplateString(template.footerHtml, context, errors)
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${template.name || 'Belge'}</title>
  <style>
    @page { size: ${template.pageSize || 'A4'} ${template.orientation || 'portrait'}; margin: 12mm; }
    body { font-family: Inter, Arial, sans-serif; color: #111; font-size: 13px; }
    .header { margin-bottom: 16px; }
    .footer { margin-top: 24px; border-top: 1px solid #ddd; padding-top: 8px; }
    img.logo { max-height: 48px; }
    @media print { .no-print { display: none !important; } }
  </style>
</head>
<body>
  <div class="header">${header}</div>
  <div class="body">${body}</div>
  <div class="footer">${footer}</div>
</body>
</html>`
  return { html, errors: [...new Set(errors)] }
}
