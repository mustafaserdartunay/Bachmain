/**
 * Build printable HTML for a Document Center label.
 */
import { resolveTemplateString } from './docVariableEngine'
import { renderBarcodeSvg, renderQrDataUrl } from './docCodes'

function esc(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function buildLabelHtml(label, context = {}) {
  const errors = []
  const width = Number(label.widthMm) || 50
  const height = Number(label.heightMm) || 30
  const title = label.showTitle ? resolveTemplateString(label.titleText, context, errors) : ''
  const sku = label.showSku ? resolveTemplateString(label.skuText, context, errors) : ''
  const company = label.showCompany ? resolveTemplateString(label.companyText, context, errors) : ''
  const barcodeValue = resolveTemplateString(label.barcodeValue, context, errors)
  const qrValue = resolveTemplateString(label.qrValue, context, errors)

  let barcodeHtml = ''
  if (label.barcodeEnabled) {
    const pxHeight = Math.max(20, Math.round((Number(label.barcodeHeightMm) || 12) * 3.78))
    const { svg, error } = await renderBarcodeSvg({
      value: barcodeValue,
      format: label.barcodeSymbology || 'CODE128',
      height: pxHeight,
      displayValue: label.barcodeShowText !== false,
    })
    if (error) errors.push(error)
    else barcodeHtml = `<div class="bc">${svg}</div>`
  }

  let qrHtml = ''
  if (label.qrEnabled) {
    const px = Math.max(48, Math.round((Number(label.qrSizeMm) || 18) * 3.78))
    const { dataUrl, error } = await renderQrDataUrl(qrValue, { size: px })
    if (error) errors.push(error)
    else qrHtml = `<div class="qr"><img src="${dataUrl}" alt="QR" width="${px}" height="${px}" /></div>`
  }

  const cell = `
    <div class="label-cell" style="width:${width}mm;height:${height}mm">
      ${company ? `<div class="company">${esc(company)}</div>` : ''}
      ${title ? `<div class="title">${esc(title)}</div>` : ''}
      ${sku ? `<div class="sku">${esc(sku)}</div>` : ''}
      ${barcodeHtml}
      ${qrHtml}
    </div>`

  const cols = Math.max(1, Number(label.gridCols) || 1)
  const rows = Math.max(1, Number(label.gridRows) || 1)
  const copies = Math.max(1, Number(label.copies) || 1)
  const cells = Array.from({ length: cols * rows * copies }, () => cell).join('')

  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${esc(label.name || 'Etiket')}</title>
  <style>
    @page { size: ${width}mm ${height}mm; margin: 0; }
    * { box-sizing: border-box; }
    body { margin: 0; font-family: Arial, sans-serif; color: #111; background: #fff; }
    .sheet { display: flex; flex-wrap: wrap; gap: 2mm; padding: 2mm; }
    .label-cell {
      border: 0.3mm solid #ddd;
      padding: 1.5mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-inside: avoid;
    }
    .company { font-size: 7pt; font-weight: 700; margin-bottom: 0.5mm; }
    .title { font-size: 9pt; font-weight: 800; line-height: 1.15; }
    .sku { font-size: 7pt; margin-top: 0.5mm; color: #333; }
    .bc svg { max-width: 100%; height: auto; }
    .qr img { display: block; margin-top: 1mm; }
    @media print {
      body { background: #fff; }
      .sheet { padding: 0; gap: 0; }
      .label-cell { border: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">${cells}</div>
</body>
</html>`

  return { html, errors: [...new Set(errors)] }
}

export function buildLabelSampleContext(company = {}) {
  return {
    sirket: {
      unvan: company.companyName || company.legalTitle || 'Örnek Firma',
      telefon: company.phone || '',
    },
    urun: {
      ad: 'Örnek Ürün',
      sku: 'SKU-1001',
      barkod: 'SKU-1001',
    },
    belge: {
      no: 'SIP-2026-001',
      url: 'https://uygulama.bachmain.com/dogrula/ornek',
    },
  }
}
