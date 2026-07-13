/**
 * Document Center visual canvas engine — blocks ↔ printable HTML.
 * Coordinates are in canvas pixels (A4 default 794×1123 @ 96dpi ≈ A4).
 */

import { getElementDef } from '../data/docDesignerElements'

export const PAGE_PRESETS = {
  A4: {
    id: 'A4',
    label: 'A4',
    widthPx: 794,
    heightPx: 1123,
    widthMm: 210,
    heightMm: 297,
  },
  A5: {
    id: 'A5',
    label: 'A5',
    widthPx: 559,
    heightPx: 794,
    widthMm: 148,
    heightMm: 210,
  },
  Letter: {
    id: 'Letter',
    label: 'Letter',
    widthPx: 816,
    heightPx: 1056,
    widthMm: 215.9,
    heightMm: 279.4,
  },
}

const DEFAULT_PAGE = PAGE_PRESETS.A4

function uid(prefix = 'blk') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function resolvePage(page = {}) {
  const preset = PAGE_PRESETS[page.size || page.pageSize] || DEFAULT_PAGE
  return {
    widthPx: page.widthPx || preset.widthPx,
    heightPx: page.heightPx || preset.heightPx,
    widthMm: page.widthMm || preset.widthMm,
    heightMm: page.heightMm || preset.heightMm,
    size: preset.id,
    unit: page.unit || 'px',
  }
}

/**
 * Create a new block from an element type + optional overrides.
 */
export function createBlock(type, partial = {}) {
  const def = getElementDef(type)
  const size = partial.size || def?.defaultSize || { w: 120, h: 40 }
  const props = {
    ...(def?.defaultProps || {}),
    ...(partial.props || {}),
  }

  return {
    id: partial.id || uid(type),
    type,
    label: partial.label || def?.label || type,
    x: Number.isFinite(partial.x) ? partial.x : 40,
    y: Number.isFinite(partial.y) ? partial.y : 40,
    w: Number.isFinite(partial.w) ? partial.w : size.w,
    h: Number.isFinite(partial.h) ? partial.h : size.h,
    rotation: partial.rotation || 0,
    zIndex: partial.zIndex ?? 1,
    locked: Boolean(partial.locked),
    visible: partial.visible !== false,
    props,
  }
}

function blockBoxStyle(block) {
  return [
    'position:absolute',
    `left:${block.x}px`,
    `top:${block.y}px`,
    `width:${block.w}px`,
    `height:${block.h}px`,
    `z-index:${block.zIndex ?? 1}`,
    block.rotation ? `transform:rotate(${block.rotation}deg)` : '',
    'box-sizing:border-box',
    'overflow:hidden',
  ]
    .filter(Boolean)
    .join(';')
}

function renderTextLike(block) {
  const p = block.props || {}
  const text = p.text ?? ''
  return `<div style="${blockBoxStyle(block)};font-size:${p.fontSize || 14}px;font-weight:${p.fontWeight || 400};color:${p.color || '#111'};text-align:${p.align || 'left'};font-family:${escapeHtml(p.fontFamily || 'Inter, system-ui, sans-serif')};line-height:${p.lineHeight || 1.35};white-space:pre-wrap;word-break:break-word">${escapeHtml(text)}</div>`
}

function renderImageLike(block) {
  const p = block.props || {}
  const src = p.src || ''
  const fit = p.objectFit || 'contain'
  if (!src) {
    return `<div style="${blockBoxStyle(block)};display:flex;align-items:center;justify-content:center;background:#f3f4f6;border:1px dashed #d1d5db;color:#9ca3af;font-size:11px">${escapeHtml(p.alt || block.label || 'Görsel')}</div>`
  }
  return `<div style="${blockBoxStyle(block)}"><img src="${escapeHtml(src)}" alt="${escapeHtml(p.alt || '')}" style="width:100%;height:100%;object-fit:${fit};border-radius:${p.borderRadius || 0}px" /></div>`
}

function renderShape(block) {
  const p = block.props || {}
  if (block.type === 'circle') {
    return `<div style="${blockBoxStyle(block)};border-radius:50%;background:${p.fill || '#e5e7eb'};border:${p.strokeWidth || 1}px solid ${p.stroke || '#9ca3af'}"></div>`
  }
  if (block.type === 'line' || block.type === 'divider') {
    const thickness = p.strokeWidth || 1
    return `<div style="${blockBoxStyle(block)};display:flex;align-items:center"><div style="width:100%;border-top:${thickness}px ${p.style || 'solid'} ${p.stroke || '#111'}"></div></div>`
  }
  return `<div style="${blockBoxStyle(block)};background:${p.fill || '#e5e7eb'};border:${p.strokeWidth || 1}px solid ${p.stroke || '#9ca3af'};border-radius:${p.borderRadius || 0}px"></div>`
}

function renderTable(block) {
  const p = block.props || {}
  const columns = Array.isArray(p.columns) && p.columns.length
    ? p.columns
    : [
        { key: 'urun', label: 'Ürün' },
        { key: 'adet', label: 'Adet' },
        { key: 'tutar', label: 'Tutar' },
      ]
  const header = p.showHeader !== false
    ? `<thead><tr>${columns.map((col) => `<th style="text-align:left;padding:4px 6px;border-bottom:1px solid ${p.borderColor || '#e5e7eb'};background:${p.headerBg || '#f3f4f6'}">${escapeHtml(col.label || col.key)}</th>`).join('')}</tr></thead>`
    : ''
  const body = `<tbody><tr>${columns.map(() => `<td style="padding:4px 6px;border-bottom:1px solid ${p.borderColor || '#e5e7eb'}">&nbsp;</td>`).join('')}</tr></tbody>`
  return `<div style="${blockBoxStyle(block)}"><table style="width:100%;border-collapse:collapse;font-size:${p.fontSize || 11}px">${header}${body}</table></div>`
}

function renderBarcode(block) {
  const p = block.props || {}
  const value = p.value || ''
  return `<div style="${blockBoxStyle(block)};display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px dashed #9ca3af;background:#fff">
    <div style="letter-spacing:2px;font-size:18px;line-height:1;font-family:monospace">||||| |||| |||||</div>
    ${p.showValue !== false ? `<div style="font-size:${p.fontSize || 10}px;margin-top:4px;color:#374151">${escapeHtml(value)}</div>` : ''}
  </div>`
}

function renderQr(block) {
  const p = block.props || {}
  return `<div style="${blockBoxStyle(block)};display:flex;align-items:center;justify-content:center;border:1px solid #d1d5db;background:#fff">
    <div style="width:70%;height:70%;background:repeating-conic-gradient(#111 0% 25%,#fff 0% 50%) 50%/12px 12px;border:2px solid #111" title="${escapeHtml(p.value || '')}"></div>
  </div>`
}

function renderSignature(block) {
  const p = block.props || {}
  return `<div style="${blockBoxStyle(block)};display:flex;flex-direction:column;justify-content:flex-end">
    ${p.line !== false ? `<div style="border-top:1px solid #9ca3af;margin-bottom:4px"></div>` : ''}
    <div style="font-size:${p.fontSize || 11}px;color:${p.color || '#6b7280'}">${escapeHtml(p.label || 'İmza')}</div>
  </div>`
}

function renderStamp(block) {
  const p = block.props || {}
  return `<div style="${blockBoxStyle(block)};border:2px solid ${p.borderColor || '#9ca3af'};border-radius:50%;display:flex;align-items:center;justify-content:center;color:${p.color || '#9ca3af'};font-size:${p.fontSize || 12}px;font-weight:700;transform:rotate(-12deg)">${escapeHtml(p.text || 'KAŞE')}</div>`
}

function renderCompanyBlock(block) {
  const p = block.props || {}
  const lines = [
    '{{sirket.unvan}}',
    '{{sirket.adres}}',
    '{{sirket.telefon}}',
    '{{sirket.vergiNo}}',
  ]
  return `<div style="${blockBoxStyle(block)};font-size:${p.fontSize || 12}px;color:${p.color || '#111'};line-height:1.4">
    ${lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('')}
  </div>`
}

function renderCustomerBlock(block) {
  const p = block.props || {}
  return `<div style="${blockBoxStyle(block)};font-size:${p.fontSize || 12}px;color:${p.color || '#111'};line-height:1.4">
    <div style="font-weight:700;margin-bottom:4px">${escapeHtml(p.title || 'Müşteri')}</div>
    <div>{{musteri.unvan}}</div>
    <div>{{musteri.adres}}</div>
    <div>{{musteri.telefon}}</div>
  </div>`
}

function renderTotalsBlock(block) {
  const p = block.props || {}
  return `<div style="${blockBoxStyle(block)};font-size:${p.fontSize || 12}px;color:${p.color || '#111'};text-align:${p.align || 'right'};line-height:1.5">
    <div>Ara Toplam: {{belge.araToplam}}</div>
    <div>KDV: {{belge.kdv}}</div>
    <div style="font-weight:700">Toplam: {{belge.toplam}}</div>
  </div>`
}

function renderBlock(block) {
  if (!block || block.visible === false) return ''
  switch (block.type) {
    case 'text':
    case 'title':
    case 'paragraph':
    case 'variable':
    case 'date':
    case 'pageNumber':
      return renderTextLike(block)
    case 'image':
    case 'logo':
      return renderImageLike(block)
    case 'rect':
    case 'circle':
    case 'line':
    case 'divider':
      return renderShape(block)
    case 'table':
      return renderTable(block)
    case 'barcode':
      return renderBarcode(block)
    case 'qr':
      return renderQr(block)
    case 'signature':
      return renderSignature(block)
    case 'stamp':
      return renderStamp(block)
    case 'companyBlock':
      return renderCompanyBlock(block)
    case 'customerBlock':
      return renderCustomerBlock(block)
    case 'totalsBlock':
      return renderTotalsBlock(block)
    default:
      return `<div style="${blockBoxStyle(block)};border:1px dashed #ccc;font-size:11px;color:#999;display:flex;align-items:center;justify-content:center">${escapeHtml(block.type)}</div>`
  }
}

/**
 * Convert visual blocks to a printable HTML document string.
 * @param {Array} blocks
 * @param {object} page — { size|pageSize, widthPx, heightPx, unit: 'px'|'mm' }
 */
export function blocksToHtml(blocks = [], page = {}) {
  const resolved = resolvePage(page)
  const useMm = resolved.unit === 'mm'
  const pageW = useMm ? `${resolved.widthMm}mm` : `${resolved.widthPx}px`
  const pageH = useMm ? `${resolved.heightMm}mm` : `${resolved.heightPx}px`
  const sorted = [...blocks].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
  const inner = sorted.map(renderBlock).join('\n')

  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<title>Belge</title>
<style>
  @page { size: ${resolved.widthMm}mm ${resolved.heightMm}mm; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  .page {
    position: relative;
    width: ${pageW};
    height: ${pageH};
    margin: 0 auto;
    background: #fff;
    overflow: hidden;
    font-family: Inter, system-ui, sans-serif;
    color: #111;
  }
  @media print {
    .page { box-shadow: none; }
  }
</style>
</head>
<body>
  <div class="page">${inner}</div>
</body>
</html>`
}

/**
 * Ensure template has a visual `blocks` array.
 * If empty, migrate header/body/footer HTML into text blocks (HTML designer preserved).
 */
export function migrateTemplateToVisual(template = {}) {
  const pageSize = template.pageSize || 'A4'
  const preset = PAGE_PRESETS[pageSize] || PAGE_PRESETS.A4
  const existing = Array.isArray(template.blocks) ? template.blocks : []

  if (existing.length > 0) {
    return {
      ...template,
      designMode: template.designMode || 'visual',
      blocks: existing,
      pageSize,
    }
  }

  const blocks = []
  let y = 32

  if (template.headerHtml) {
    blocks.push(
      createBlock('paragraph', {
        x: 40,
        y,
        w: preset.widthPx - 80,
        h: 72,
        props: {
          text: stripTagsKeepNewlines(template.headerHtml),
          fontSize: 13,
          fontWeight: 600,
          color: '#111827',
          align: 'left',
        },
        zIndex: 1,
      }),
    )
    y += 88
  }

  if (template.bodyHtml) {
    blocks.push(
      createBlock('paragraph', {
        x: 40,
        y,
        w: preset.widthPx - 80,
        h: 320,
        props: {
          text: stripTagsKeepNewlines(template.bodyHtml),
          fontSize: 12,
          color: '#374151',
          align: 'left',
          lineHeight: 1.45,
        },
        zIndex: 2,
      }),
    )
    y += 340
  }

  if (template.footerHtml) {
    blocks.push(
      createBlock('text', {
        x: 40,
        y: Math.min(y, preset.heightPx - 60),
        w: preset.widthPx - 80,
        h: 36,
        props: {
          text: stripTagsKeepNewlines(template.footerHtml),
          fontSize: 11,
          color: '#6b7280',
          align: 'left',
        },
        zIndex: 3,
      }),
    )
  }

  return {
    ...template,
    designMode: 'visual',
    blocks,
    pageSize,
    status: template.status || 'draft',
    version: template.version || 1,
    versions: Array.isArray(template.versions) ? template.versions : [],
    zoom: template.zoom ?? 1,
    themeId: template.themeId ?? null,
  }
}

function stripTagsKeepNewlines(html) {
  return String(html || '')
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function getPagePreset(size) {
  return PAGE_PRESETS[size] || PAGE_PRESETS.A4
}
