import { CALENDAR_MONTHS, parseCalendarIso } from './calendarUtils'
import { readCompanySettings } from './companySettings'
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

function quoteStyles(imageSize) {
  const size = Number(imageSize) || 140
  return `
    .qd { box-sizing: border-box; width: 100%; margin: 0; padding: 28px 32px 36px; background: #fff; color: #64748b;
      font-family: ${SYSTEM_FONT}; font-size: 14px; font-weight: 400; line-height: 1.35; letter-spacing: normal; }
    .qd *, .qd *::before, .qd *::after { box-sizing: border-box; }
    .qd-bar { height: 3px; background: #2563eb; margin: -28px -32px 24px; }
    .qd-top { display: grid; grid-template-columns: minmax(0,1.4fr) minmax(220px,0.8fr); gap: 24px; align-items: start; padding-bottom: 20px; border-bottom: 1px solid #e2e8f0; }
    .qd-brand { display: flex; gap: 14px; align-items: center; min-width: 0; }
    .qd-logo { width: 64px; height: 64px; object-fit: contain; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff; padding: 6px; }
    .qd-logo-fallback { width: 64px; height: 64px; border: 1px solid #e2e8f0; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #2563eb; font-weight: 700; }
    .qd-company { min-width: 0; }
    .qd-company-name { margin: 0; color: #334155; font-size: 14px; font-weight: 700; line-height: 1.3; }
    .qd-meta { margin: 4px 0 0; color: #64748b; font-size: 14px; font-weight: 400; }
    .qd-doc { text-align: right; }
    .qd-kicker { margin: 0; color: #2563eb; font-size: 14px; font-weight: 400; }
    .qd-title { margin: 4px 0 0; color: #334155; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .qd-no { margin: 6px 0 0; color: #64748b; font-size: 14px; }
    .qd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 20px; }
    .qd-panel { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px 16px; }
    .qd-label { margin: 0 0 8px; color: #2563eb; font-size: 14px; font-weight: 400; }
    .qd-strong { margin: 0; color: #334155; font-size: 14px; font-weight: 700; }
    .qd-row { display: grid; grid-template-columns: 92px minmax(0,1fr); gap: 8px; margin-top: 6px; }
    .qd-dates { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap: 10px; margin-top: 20px; }
    .qd-date { border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px 14px; position: relative; }
    .qd-date-num { margin: 4px 0 0; color: #334155; font-size: 14px; font-weight: 700; }
    .qd-items { margin-top: 22px; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; }
    .qd-item { display: grid; grid-template-columns: ${size}px minmax(0,1.5fr) 72px 110px 120px; gap: 14px; align-items: center; padding: 14px 16px; border-bottom: 1px solid #e2e8f0; }
    .qd-item:last-child { border-bottom: 0; }
    .qd-item-head { display: grid; grid-template-columns: ${size}px minmax(0,1.5fr) 72px 110px 120px; gap: 14px; padding: 10px 16px; background: #f8fafc; color: #64748b; font-size: 14px; }
    .qd-right { text-align: right; }
    .qd-img { width: ${size}px; height: ${size}px; object-fit: cover; object-position: center; border-radius: 12px; border: 1px solid #e2e8f0; background: #f8fafc; display: block; }
    .qd-img-empty { width: ${size}px; height: ${size}px; border-radius: 12px; border: 1px dashed #e2e8f0; background: #f8fafc; }
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
  company = readCompanySettings(),
  settings = readQuotePrintSettings(),
  rates = getExchangeRatesSnapshot(),
} = {}) {
  const totals = documentTotals(quote || {}, rates)
  const banks = resolveBanks(quote, company)
  const terms = termLines(quote?.termsDescription)
  const created = formatPrintDate(quote?.createdAt)
  const valid = formatPrintDate(quote?.validUntil)
  const due = formatPrintDate(quote?.dueDate || quote?.validUntil)
  const imageSize = settings.productImageSize || 140
  const companyName = company.legalTitle || company.companyName || 'Firma'
  const logo = settings.showLogo ? company.logoDataUrl : ''
  const representative = quote?.owner || customer.authorizedName || ''
  const items = Array.isArray(quote?.items) ? quote.items : []

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
      return `
        <div class="qd-item">
          ${
            settings.showProductImages
              ? image
                ? `<img class="qd-img" src="${escapeHtml(image)}" alt="" />`
                : `<div class="qd-img-empty"></div>`
              : '<div></div>'
          }
          <div>
            <p class="qd-strong">${escapeHtml(item.product || 'Ürün seçilmedi')}</p>
            ${desc ? `<p class="qd-meta">${escapeHtml(desc)}</p>` : ''}
            <p class="qd-meta">KDV %${escapeHtml(item.vatRate ?? 20)}</p>
          </div>
          <div class="qd-right">${escapeHtml(item.quantity ?? 1)}</div>
          <div class="qd-right">${unit}${
            currency !== 'TRY'
              ? `<div class="qd-meta">${formatTL(row.subtotal / Math.max(1, Number(item.quantity) || 1))}</div>`
              : ''
          }</div>
          <div class="qd-right qd-strong">${formatTL(row.total)}</div>
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
    <style>${quoteStyles(imageSize)}</style>
    <article class="qd">
      <div class="qd-bar"></div>
      <header class="qd-top">
        <div class="qd-brand">
          ${
            settings.showCompany
              ? logo
                ? `<img class="qd-logo" src="${escapeHtml(logo)}" alt="" />`
                : `<div class="qd-logo-fallback">BM</div>`
              : ''
          }
          ${
            settings.showCompany
              ? `<div class="qd-company">
                  <p class="qd-company-name">${escapeHtml(companyName)}</p>
                  ${company.address ? `<p class="qd-meta">${escapeHtml(company.address)}</p>` : ''}
                  <p class="qd-meta">${[company.phone, company.email, company.website].filter(Boolean).map(escapeHtml).join(' · ')}</p>
                  ${
                    company.taxOffice || company.taxNumber
                      ? `<p class="qd-meta">${[company.taxOffice, company.taxNumber].filter(Boolean).map(escapeHtml).join(' · ')}</p>`
                      : ''
                  }
                </div>`
              : ''
          }
        </div>
        <div class="qd-doc">
          <p class="qd-kicker">Fiyat Teklifi</p>
          <h1 class="qd-title">${escapeHtml(quote?.title || 'Teklif')}</h1>
          <p class="qd-no">${escapeHtml(quote?.id || '')}</p>
        </div>
      </header>

      ${
        settings.showCustomer || settings.showRepresentative
          ? `<section class="qd-grid">
              ${
                settings.showCustomer
                  ? `<div class="qd-panel">
                      <p class="qd-label">Müşteri</p>
                      <p class="qd-strong">${escapeHtml(customer.company || customer.unvan || '—')}</p>
                      ${customer.contact ? `<p class="qd-meta">${escapeHtml(customer.contact)}</p>` : ''}
                      ${customer.authorizedName ? `<div class="qd-row"><span>Yetkili</span><span>${escapeHtml(customer.authorizedName)}</span></div>` : ''}
                      ${customer.address ? `<div class="qd-row"><span>Adres</span><span>${escapeHtml(customer.address)}</span></div>` : ''}
                      ${customer.phone ? `<div class="qd-row"><span>Telefon</span><span>${escapeHtml(customer.phone)}</span></div>` : ''}
                      ${customer.email ? `<div class="qd-row"><span>E-posta</span><span>${escapeHtml(customer.email)}</span></div>` : ''}
                    </div>`
                  : '<div></div>'
              }
              <div class="qd-panel">
                ${
                  settings.showRepresentative
                    ? `<p class="qd-label">Temsilci</p><p class="qd-strong">${escapeHtml(representative || '—')}</p>`
                    : ''
                }
                ${quote?.status ? `<div class="qd-row"><span>Durum</span><span>${escapeHtml(quote.status)}</span></div>` : ''}
              </div>
            </section>`
          : ''
      }

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
          <span class="qd-right">Adet</span>
          <span class="qd-right">Birim</span>
          <span class="qd-right">Toplam</span>
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
