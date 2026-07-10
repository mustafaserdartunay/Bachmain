import { createSalesInvoice } from './salesInvoicesStore'
import { createInvoiceNo, createLoadingId, itemsFromLegacyForm, summarizeLoading } from './shippingCalculations'
import { t, translateLive } from './shippingI18n'

const STORAGE_KEY = 'bach-shipping-loadings'

function readLoadings() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return []
    const parsed = JSON.parse(saved)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeLoadings(loadings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loadings))
  window.dispatchEvent(new CustomEvent('bach:shipping-updated'))
}

export function getShippingLoadings() {
  return readLoadings()
}

export function saveShippingLoading(payload) {
  const items = itemsFromLegacyForm(payload)
  const summary = summarizeLoading({ ...payload, items, cargoCalculated: true })
  const id = payload.id || createLoadingId()
  const invoiceNo = payload.invoiceNo || createInvoiceNo()
  const lang = payload.language || 'tr'

  const record = {
    ...payload,
    items,
    id,
    invoiceNo,
    summary,
    createdAt: payload.createdAt || new Date().toISOString(),
    status: 'completed',
  }

  const invoice = createSalesInvoice({
    title: translateLive(t('invoice.title', lang), lang),
    invoiceNo,
    customerName: payload.customerName || translateLive('Müşteri', lang),
    totalAmount: summary.freight,
    description: `${translateLive('Nakliye yüklemesi', lang)} ${id} · ${payload.scope === 'international' ? 'International' : 'Domestic'}`,
    source: 'shipping',
  })

  record.salesInvoiceId = invoice.id
  writeLoadings([record, ...readLoadings().filter((item) => item.id !== id)])
  return record
}

export function buildInvoiceHtml(loading, lang = 'tr') {
  const summary = loading.summary || summarizeLoading(loading)
  const lines = (loading.items || []).map((item) => `
    <tr>
      <td>${translateLive(item.name, lang)}</td>
      <td>${item.unitType}</td>
      <td style="text-align:right">${item.quantity}</td>
      <td style="text-align:right">${summary.unitTotals.find((row) => row.unitType === item.unitType)?.weightKg || 0} kg</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${t('invoice.title', lang)} ${loading.invoiceNo}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #0f172a; padding: 32px; }
    h1 { color: #1d4ed8; margin-bottom: 4px; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #e2e8f0; padding: 10px; font-size: 13px; }
    th { background: #f8fafc; text-align: left; }
    .total { font-size: 22px; font-weight: bold; color: #1d4ed8; margin-top: 24px; }
    .badge { display:inline-block; padding:4px 10px; border-radius:999px; background:#dbeafe; color:#1d4ed8; font-size:12px; }
  </style>
</head>
<body>
  <h1>${t('invoice.title', lang)}</h1>
  <div class="meta">
    <div><strong>${loading.invoiceNo}</strong> · ${loading.id}</div>
    <div>${loading.customerName || ''} · ${loading.origin || ''} → ${loading.destination || ''}</div>
    <div><span class="badge">${loading.scope === 'international' ? t('scope.international', lang) : t('scope.domestic', lang)}</span></div>
  </div>
  <table>
    <thead>
      <tr>
        <th>${t('field.productName', lang)}</th>
        <th>${t('field.unitType', lang)}</th>
        <th>${t('field.quantity', lang)}</th>
        <th>${t('summary.weight', lang)}</th>
      </tr>
    </thead>
    <tbody>${lines}</tbody>
  </table>
  <p class="total">${t('summary.freight', lang)}: ${summary.freight.toLocaleString('tr-TR')} ₺</p>
</body>
</html>`
}

export function downloadInvoiceFile(loading, lang = 'tr') {
  const html = buildInvoiceHtml(loading, lang)
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${loading.invoiceNo || 'nakliye-fatura'}.html`
  anchor.click()
  URL.revokeObjectURL(url)
}
