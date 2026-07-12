/**
 * Barcode + QR helpers for Document Center labels.
 */

export function validateEan13(value) {
  const digits = String(value || '').replace(/\D/g, '')
  if (digits.length !== 13) return { ok: false, message: 'EAN-13 13 haneli olmalı' }
  let sum = 0
  for (let i = 0; i < 12; i += 1) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3)
  }
  const check = (10 - (sum % 10)) % 10
  if (check !== Number(digits[12])) return { ok: false, message: 'EAN-13 kontrol hanesi hatalı' }
  return { ok: true }
}

export async function renderBarcodeSvg({
  value,
  format = 'CODE128',
  height = 40,
  displayValue = true,
} = {}) {
  const text = String(value || '').trim()
  if (!text || text === '—') {
    return { svg: '', error: 'Barkod değeri boş' }
  }
  if (format === 'EAN13') {
    const check = validateEan13(text)
    if (!check.ok) return { svg: '', error: check.message }
  }
  try {
    const JsBarcode = (await import('jsbarcode')).default
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    JsBarcode(svg, text, {
      format: format === 'CODE39' ? 'CODE39' : format === 'EAN8' ? 'EAN8' : format === 'EAN13' ? 'EAN13' : 'CODE128',
      height,
      displayValue,
      margin: 4,
      fontSize: 12,
      textMargin: 2,
    })
    return { svg: svg.outerHTML, error: null }
  } catch (err) {
    return { svg: '', error: err.message || 'Barkod oluşturulamadı' }
  }
}

export async function renderQrDataUrl(value, { size = 128, errorCorrectionLevel = 'M' } = {}) {
  const text = String(value || '').trim()
  if (!text || text === '—') return { dataUrl: '', error: 'QR değeri boş' }
  try {
    const QRCode = (await import('qrcode')).default
    const dataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      errorCorrectionLevel,
    })
    return { dataUrl, error: null }
  } catch (err) {
    return { dataUrl: '', error: err.message || 'QR oluşturulamadı' }
  }
}
