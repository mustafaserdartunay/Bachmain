import { CALENDAR_MONTHS, parseCalendarIso } from './calendarUtils'
import { resolveCompanyBrand } from './companySettings'
import { documentTotals, itemTotals } from './documentTotals'
import { getCatalogProducts, resolveProductImage } from './productCatalog'
import { formatMoney, formatTL, normalizeCurrency } from './productPricing'
import { readQuotePrintSettings } from './docPrintSettingsStore'
import { getExchangeRatesSnapshot } from '../hooks/useExchangeRates'

const SYSTEM_FONT =
  'Inter, system-ui, "SF Pro Display", Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function toIsoDate(value) {
  if (!value) return ''
  const raw = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10)
  const tr = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/)
  if (tr) return `${tr[3]}-${tr[2]}-${tr[1]}`
  return raw.slice(0, 10)
}

function formatPrintDate(value) {
  const iso = toIsoDate(value)
  const date = parseCalendarIso(iso)
  if (!date) return { numeric: '—', month: '' }
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return {
    numeric: `${day}.${month}.${date.getFullYear()}`,
    month: CALENDAR_MONTHS[date.getMonth()] || '',
  }
}

function resolveItemImage(item) {
  if (typeof item?.lineImage === 'string' && item.lineImage) return item.lineImage
  const products = getCatalogProducts()
  const product =
    (item?.productId && products.find((entry) => entry.id === item.productId)) ||
    (item?.product && products.find((entry) => entry.name === item.product)) ||
    null
  return resolveProductImage(product) || ''
}

function resolveBanks(quote, company) {
  const accounts = company?.bankAccounts || []
  const selectedIds = Array.isArray(quote?.selectedBankAccountIds)
    ? quote.selectedBankAccountIds
    : []
  return selectedIds
    .map((id) => accounts.find((account) => account.id === id))
    .filter(Boolean)
}

function termLines(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean)
}

function quoteStyles(imageSize, { showDiscountCol = false } = {}) {
  const size = Number(imageSize) || 140
  const cols = showDiscountCol
    ? `${size}px minmax(0,1.3fr) 64px 100px 72px 80px 100px`
    : `${size}px minmax(0,1.3fr) 64px 100px 72px 100px`
  return `
    .qd { box-sizing: border-box; width: 100%; margin: 0; padding: 28px 32px 36px; background: #fff; color: #64748b;
      font-family: ${SYSTEM_FONT}; font-size: 14px; font-weight: 400; line-height: 1.35; letter-spacing: normal; }
    .qd *, .qd *::before, .qd *::after { box-sizing: border-box; }
    .qd-bar { height: 3px; background: #2563eb; margin: -28px -32px 24px; }
    .qd-top { display: grid; grid-template-columns: auto minmax(0,1fr); gap: 24px; align-items: start; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
    .qd-brand { min-width: 0; }
    .qd-logo { width: 96px; height: 96px; object-fit: contain; object-position: left center; background: #fff; display: block; }
    .qd-logo-fallback { width: 96px; height: 96px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #2563eb; font-weight: 700; }
    .qd-doc { text-align: right; justify-self: end; min-width: 0; }
    .qd-title { margin: 0; color: #334155; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .qd-no { margin: 6px 0 0; color: #64748b; font-size: 14px; }
    .qd-meta { margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 400; }
    .qd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
    .qd-panel { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
    .qd-label { margin: 0 0 8px; color: #2563eb; font-size: 14px; font-weight: 400; }
    .qd-strong { margin: 0; color: #334155; font-size: 14px; font-weight: 700; }
    .qd-row { display: grid; grid-template-columns: 92px minmax(0,1fr); gap: 8px; margin-top: 6px; }
    .qd-dates { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; margin-top: 20px; }
    .qd-date { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; position: relative; }
    .qd-date-num { margin: 4px 0 0; color: #334155; font-size: 14px; font-weight: 700; }
    .qd-items { margin-top: 22px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .qd-item, .qd-item-head { display: grid; grid-template-columns: ${cols}; gap: 10px; align-items: center; justify-items: center; text-align: center; padding: 14px 12px; }
    .qd-item { border-bottom: 1px solid #e2e8f0; }
    .qd-item:last-child { border-bottom: 0; }
    .qd-item-head { padding: 10px 12px; background: #f8fafc; color: #64748b; font-size: 14px; }
    .qd-product { width: 100%; text-align: center; }
    .qd-cell { width: 100%; text-align: center; }
    .qd-img { width: ${size}px; height: ${size}px; object-fit: cover; object-position: center; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; display: block; margin: 0 auto; }
    .qd-img-empty { width: ${size}px; height: ${size}px; border-radius: 12px; border: 1px dashed #e2e8f0; background: #f8fafc; margin: 0 auto; }
    .qd-bottom { display: grid; grid-template-columns: minmax(0,1fr) 280px; gap: 20px; margin-top: 22px; align-items: start; }
    .qd-list { margin: 0; padding: 0; list-style: none; }
    .qd-list li { position: relative; padding: 0 0 8px 14px; }
    .qd-list li::before { content: ""; position: absolute; left: 0; top: 8px; width: 6px; height: 6px; border-radius: 99px; background: #2563eb; }
    .qd-totals { border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
    .qd-total { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; }
    .qd-total:last-child { border-bottom: 0; }
    .qd-grand { background: #2563eb; color: #fff; }
    .qd-grand span { color: #fff; font-weight: 700; }
    .qd-bank { margin-top: 10px; padding-top: 10px; border-top: 1px solid #e2e8f0; }
    .qd-bank:first-child { margin-top: 0; padding-top: 0; border-top: 0; }
    .qd-foot { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 14px; }
    @media print { .qd { padding: 18mm 16mm; } .qd-bar { margin: -18mm -16mm 16px; } }
  `
}

export function buildQuoteDocumentInnerHtml({
  quote,
  customer = {},
  company = resolveCompanyBrand(),
  settings = readQuotePrintSettings(),
  rates = getExchangeRatesSnapshot(),
} = {}) {
  const totals = documentTotals(quote || {}, rates)
  const brand = resolveCompanyBrand()
  const terms = termLines(quote?.termsDescription)
  const created = formatPrintDate(quote?.createdAt)
  const valid = formatPrintDate(quote?.validUntil)
  const due = formatPrintDate(quote?.dueDate || quote?.validUntil)
  const imageSize = settings.productImageSize || 140
  const companyName = brand.legalTitle || brand.companyName || 'Firma'
  const logo = brand.logoDataUrl
  const representative = quote?.owner || customer.authorizedName || ''
  const items = Array.isArray(quote?.items) ? quote.items : []
  const banks = resolveBanks(quote, brand)
  const showDiscountCol = items.some(
    (item) => item.showDiscount && (Number(item.discountRate) > 0 || Number(item.discountAmount) > 0),
  )

  const itemRows = items
    .map((item) => {
      const row = itemTotals(item, rates)
      const currency = normalizeCurrency(item.currency)
      const image = settings.showProductImages ? resolveItemImage(item) : ''
      const desc = item.extraDescription || item.description || ''
      const unit =
        currency === 'TRY'
          ? formatTL(item.unitPrice)
          : `${formatMoney(item.unitPrice, currency)}`
      const discountLabel = item.showDiscount
        ? Number(item.discountRate) > 0
          ? `%${item.discountRate}`
          : Number(item.discountAmount) > 0
            ? formatTL(item.discountAmount)
            : '—'
        : '—'
      return `
        <div class="qd-item">
          ${
            settings.showProductImages
              ? image
                ? `<img class="qd-img" src="${escapeHtml(image)}" alt="" />`
                : `<div class="qd-img-empty"></div>`
              : '<div></div>'
          }
          <div class="qd-product">
            <p class="qd-strong">${escapeHtml(item.product || 'Ürün seçilmedi')}</p>
            ${desc ? `<p class="qd-meta">${escapeHtml(desc)}</p>` : ''}
          </div>
          <div class="qd-cell">${escapeHtml(item.quantity ?? 1)}</div>
          <div class="qd-cell">${unit}</div>
          <div class="qd-cell">%${escapeHtml(item.vatRate ?? 20)}</div>
          ${showDiscountCol ? `<div class="qd-cell">${discountLabel}</div>` : ''}
          <div class="qd-cell qd-strong">${formatTL(row.total)}</div>
        </div>`
    })
    .join('')

  const totalRows = [
    ['Ara Toplam', totals.subtotal, true],
    totals.lineDiscount > 0 ? ['Satır İndirimi', totals.lineDiscount, true] : null,
    totals.showDocumentDiscount ? ['İndirim Toplamı', totals.documentDiscount, true] : null,
    Number(totals.exciseTax) ? ['ÖTV', totals.exciseTax, true] : null,
    Number(totals.accommodationTax) ? ['Konaklama Vergisi', totals.accommodationTax, true] : null,
    ['KDV', totals.vat, true],
  ]
    .filter(Boolean)
    .map(
      ([label, value]) => `
        <div class="qd-total">
          <span>${escapeHtml(label)}</span>
          <span class="qd-strong">${formatTL(value)}</span>
        </div>`,
    )
    .join('')

  return `
    <style>${quoteStyles(imageSize, { showDiscountCol })}</style>
    <article class="qd">
      <div class="qd-bar"></div>
      <header class="qd-top">
        <div class="qd-brand">
          ${
            settings.showLogo || settings.showCompany
              ? logo
                ? `<img class="qd-logo" src="${escapeHtml(logo)}" alt="${escapeHtml(companyName)}" />`
                : `<div class="qd-logo-fallback">BM</div>`
              : ''
          }
        </div>
        <div class="qd-doc">
          <h1 class="qd-title">${escapeHtml(quote?.title || 'Teklif')}</h1>
          <p class="qd-no">Teklif Numarası : ${escapeHtml(quote?.id || '')}</p>
        </div>
      </header>

      <section class="qd-grid">
        <div class="qd-panel">
          <p class="qd-label">Firma</p>
          <p class="qd-strong">${escapeHtml(companyName)}</p>
          ${brand.companyName && brand.legalTitle && brand.companyName !== brand.legalTitle ? `<p class="qd-meta">${escapeHtml(brand.companyName)}</p>` : ''}
          ${brand.address ? `<div class="qd-row"><span>Adres</span><span>${escapeHtml(brand.address)}</span></div>` : ''}
          ${brand.phone ? `<div class="qd-row"><span>Telefon</span><span>${escapeHtml(brand.phone)}</span></div>` : ''}
          ${brand.email ? `<div class="qd-row"><span>E-posta</span><span>${escapeHtml(brand.email)}</span></div>` : ''}
          ${brand.website ? `<div class="qd-row"><span>Web</span><span>${escapeHtml(brand.website)}</span></div>` : ''}
          ${brand.taxOffice ? `<div class="qd-row"><span>Vergi Dairesi</span><span>${escapeHtml(brand.taxOffice)}</span></div>` : ''}
          ${brand.taxNumber ? `<div class="qd-row"><span>Vergi No</span><span>${escapeHtml(brand.taxNumber)}</span></div>` : ''}
          ${settings.showRepresentative && representative ? `<div class="qd-row"><span>Temsilci</span><span>${escapeHtml(representative)}</span></div>` : ''}
        </div>
        <div class="qd-panel">
          <p class="qd-label">Müşteri</p>
          <p class="qd-strong">${escapeHtml(customer.company || customer.unvan || '—')}</p>
          ${customer.contact ? `<p class="qd-meta">${escapeHtml(customer.contact)}</p>` : ''}
          ${customer.authorizedName ? `<div class="qd-row"><span>Yetkili</span><span>${escapeHtml(customer.authorizedName)}</span></div>` : ''}
          ${customer.address ? `<div class="qd-row"><span>Adres</span><span>${escapeHtml(customer.address)}</span></div>` : ''}
          ${customer.phone ? `<div class="qd-row"><span>Telefon</span><span>${escapeHtml(customer.phone)}</span></div>` : ''}
          ${customer.email ? `<div class="qd-row"><span>E-posta</span><span>${escapeHtml(customer.email)}</span></div>` : ''}
          ${quote?.status ? `<div class="qd-row"><span>Durum</span><span>${escapeHtml(quote.status)}</span></div>` : ''}
        </div>
      </section>

      ${
        settings.showDates
          ? `<section class="qd-dates">
              <div class="qd-date"><p class="qd-label">Oluşturma</p><p class="qd-date-num">${created.numeric}</p><p class="qd-meta">${escapeHtml(created.month)}</p></div>
              <div class="qd-date"><p class="qd-label">Geçerlilik</p><p class="qd-date-num">${valid.numeric}</p><p class="qd-meta">${escapeHtml(valid.month)}</p></div>
              <div class="qd-date"><p class="qd-label">Vade</p><p class="qd-date-num">${due.numeric}</p><p class="qd-meta">${escapeHtml(due.month)}</p></div>
            </section>`
          : ''
      }

      <section class="qd-items">
        <div class="qd-item-head">
          <span>${settings.showProductImages ? 'Görsel' : ''}</span>
          <span>Ürün</span>
          <span>Adet</span>
          <span>Birim</span>
          <span>K.D.V.</span>
          ${showDiscountCol ? '<span>İndirim</span>' : ''}
          <span>Toplam</span>
        </div>
        ${itemRows || '<div class="qd-item"><div></div><p>Ürün satırı yok.</p></div>'}
      </section>

      <section class="qd-bottom">
        <div>
          ${
            settings.showTerms
              ? `<p class="qd-label">Koşullar</p>
                 ${
                   terms.length
                     ? `<ul class="qd-list">${terms.map((term) => `<li>${escapeHtml(term)}</li>`).join('')}</ul>`
                     : '<p class="qd-meta">Koşul eklenmedi.</p>'
                 }`
              : ''
          }
          ${
            settings.showBanks
              ? `<div style="margin-top:18px">
                  <p class="qd-label">Banka Hesapları</p>
                  ${
                    banks.length
                      ? banks
                          .map(
                            (account) => `
                    <div class="qd-bank">
                      <p class="qd-strong">${escapeHtml([account.bankName, account.label].filter(Boolean).join(' · '))}</p>
                      ${account.branch ? `<p class="qd-meta">Şube: ${escapeHtml(account.branch)}</p>` : ''}
                      ${account.iban ? `<p class="qd-meta">IBAN: ${escapeHtml(account.iban)}</p>` : ''}
                    </div>`,
                          )
                          .join('')
                      : '<p class="qd-meta">Teklifte gösterilecek hesap seçilmedi.</p>'
                  }
                </div>`
              : ''
          }
        </div>
        ${
          settings.showTotals
            ? `<div class="qd-totals">
                ${totalRows}
                <div class="qd-total qd-grand"><span>Genel Toplam</span><span>${formatTL(totals.grandTotal)}</span></div>
              </div>`
            : ''
        }
      </section>

      <footer class="qd-foot">
        Bu teklif ${valid.numeric}${valid.month ? ` (${valid.month})` : ''} tarihine kadar geçerlidir.
        ${companyName ? ` ${escapeHtml(companyName)}` : ''}
      </footer>
    </article>
  `
}

export function buildQuoteDocumentHtml(options = {}) {
  const inner = buildQuoteDocumentInnerHtml(options)
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(options.quote?.id || 'Teklif')}</title>
  <style>
    @page { size: A4 portrait; margin: 0; }
    html, body { margin: 0; background: #fff; }
  </style>
</head>
<body>${inner}</body>
</html>`
}
