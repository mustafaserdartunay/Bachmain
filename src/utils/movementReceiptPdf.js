import { jsPDF } from 'jspdf'
import { readCompanySettings } from './companySettings'

function sanitizePdfText(value) {
  return String(value ?? '')
    .replace(/ğ/g, 'g')
    .replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u')
    .replace(/Ü/g, 'U')
    .replace(/ş/g, 's')
    .replace(/Ş/g, 'S')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .replace(/ö/g, 'o')
    .replace(/Ö/g, 'O')
    .replace(/ç/g, 'c')
    .replace(/Ç/g, 'C')
}

const C = {
  ink: [30, 35, 60],
  muted: [100, 110, 140],
  blue: [37, 99, 235],
  blueSoft: [219, 234, 254],
  line: [210, 216, 230],
  panel: [248, 250, 255],
  white: [255, 255, 255],
  success: [16, 185, 129],
  danger: [225, 29, 72],
  softBg: [244, 246, 252],
}

function setRgb(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function drawRoundedPanel(doc, x, y, w, h, rgb = C.panel) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
  doc.roundedRect(x, y, w, h, 10, 10, 'F')
}

function drawHairline(doc, x1, y, x2) {
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.setLineWidth(0.6)
  doc.line(x1, y, x2, y)
}

function labelValue(doc, label, value, x, y, maxWidth = 240) {
  setRgb(doc, C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sanitizePdfText(String(label).toLocaleUpperCase('tr-TR')), x, y)
  setRgb(doc, C.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  const lines = doc.splitTextToSize(sanitizePdfText(value || '—'), maxWidth)
  doc.text(lines, x, y + 14)
  return y + 14 + lines.length * 13
}

/**
 * Tek cari hareket için tahsilat / ödeme / açılış makbuzu PDF'i.
 */
export function downloadMovementReceiptPdf({
  kind = 'tahsilat',
  company: companyOverride,
  customer,
  customerDisplay,
  movement,
  title,
  amountLabel,
  amountDisplay,
  transactionDate,
  accountName,
  statusLabel,
  description,
  remainingBalance,
  chequeRows = [],
  relatedRows = [],
}) {
  const company = companyOverride || readCompanySettings()
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 36
  const contentW = pageW - margin * 2
  const accent = kind === 'odeme' ? C.danger : kind === 'opening' ? C.blue : C.success
  const receiptNo = sanitizePdfText(
    movement?.id || movement?.docNo || `MK-${Date.now().toString().slice(-8)}`,
  )
  const customerName =
    customerDisplay?.company ||
    customerDisplay?.brandShortName ||
    customer?.company ||
    '—'

  // Background
  doc.setFillColor(C.softBg[0], C.softBg[1], C.softBg[2])
  doc.rect(0, 0, pageW, pageH, 'F')

  // Top accent bar
  doc.setFillColor(accent[0], accent[1], accent[2])
  doc.rect(0, 0, pageW, 6, 'F')

  // Header card
  drawRoundedPanel(doc, margin, 28, contentW, 96, C.white)
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.setLineWidth(0.8)
  doc.roundedRect(margin, 28, contentW, 96, 10, 10, 'S')

  if (company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', margin + 18, 46, 56, 56)
    } catch {
      // ignore
    }
  }

  const headerX = company.logoDataUrl ? margin + 88 : margin + 20
  setRgb(doc, C.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(sanitizePdfText(company.companyName || 'Bachmain'), headerX, 54)

  setRgb(doc, C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  const companyMeta = [
    company.legalTitle,
    [company.phone, company.email].filter(Boolean).join('  ·  '),
    company.address,
  ]
    .filter(Boolean)
    .map(sanitizePdfText)
  companyMeta.forEach((line, index) => {
    doc.text(line, headerX, 72 + index * 12)
  })

  setRgb(doc, accent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(sanitizePdfText(title || 'Makbuz'), margin + contentW - 18, 54, { align: 'right' })

  setRgb(doc, C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(sanitizePdfText(`Makbuz No: ${receiptNo}`), margin + contentW - 18, 72, {
    align: 'right',
  })
  doc.text(sanitizePdfText(`Duzenleme: ${transactionDate || '—'}`), margin + contentW - 18, 86, {
    align: 'right',
  })

  let y = 146

  // Title strip
  drawRoundedPanel(doc, margin, y, contentW, 42, C.blueSoft)
  setRgb(doc, C.blue)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(sanitizePdfText(title || 'Islem Makbuzu'), margin + 18, y + 27)

  y += 58

  // Parties / meta panel
  drawRoundedPanel(doc, margin, y, contentW, 118, C.white)
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.roundedRect(margin, y, contentW, 118, 10, 10, 'S')

  const colL = margin + 18
  const colR = margin + contentW / 2 + 8
  labelValue(doc, 'Musteri', customerName, colL, y + 20, contentW / 2 - 36)
  labelValue(doc, 'Islem Tarihi', transactionDate, colR, y + 20, contentW / 2 - 36)
  labelValue(doc, 'Islendigi Hesap', accountName || '—', colL, y + 62, contentW / 2 - 36)
  labelValue(doc, 'Durum', statusLabel || 'Islendi', colR, y + 62, contentW / 2 - 36)

  y += 136

  // Amount highlight
  drawRoundedPanel(doc, margin, y, contentW, 78, C.white)
  doc.setDrawColor(accent[0], accent[1], accent[2])
  doc.setLineWidth(1.4)
  doc.roundedRect(margin, y, contentW, 78, 10, 10, 'S')

  setRgb(doc, C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    sanitizePdfText(String(amountLabel || 'Meblag').toLocaleUpperCase('tr-TR')),
    margin + 20,
    y + 28,
  )

  setRgb(doc, accent)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.text(sanitizePdfText(amountDisplay || '0,00₺'), margin + contentW - 20, y + 50, {
    align: 'right',
  })

  y += 98

  // Detail rows
  const detailPairs = [
    ['Islem Turu', title],
    ['Aciklama', description || '—'],
    ['Kalan Bakiye', remainingBalance || '—'],
  ]

  if (movement?.method) {
    detailPairs.splice(1, 0, ['Odeme Yontemi', movement.method])
  }
  if (movement?.docNo) {
    detailPairs.push(['Belge No', movement.docNo])
  }

  const detailH = 48 + detailPairs.length * 28 + 12
  drawRoundedPanel(doc, margin, y, contentW, detailH, C.white)
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.setLineWidth(0.8)
  doc.roundedRect(margin, y, contentW, detailH, 10, 10, 'S')

  setRgb(doc, C.ink)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(sanitizePdfText('Islem Detaylari'), margin + 18, y + 24)
  drawHairline(doc, margin + 18, y + 34, margin + contentW - 18)

  let detailY = y + 52
  detailPairs.forEach(([label, value], index) => {
    if (index > 0) drawHairline(doc, margin + 18, detailY - 10, margin + contentW - 18)
    setRgb(doc, C.muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(sanitizePdfText(String(label).toLocaleUpperCase('tr-TR')), margin + 18, detailY)
    setRgb(doc, C.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    const lines = doc.splitTextToSize(sanitizePdfText(value), contentW - 160)
    doc.text(lines, margin + 140, detailY)
    detailY += Math.max(24, lines.length * 12 + 12)
  })

  y += detailH + 16

  // Cheque block
  if (chequeRows.length > 0) {
    const chequeH = 28 + chequeRows.length * 22 + 16
    drawRoundedPanel(doc, margin, y, contentW, chequeH, C.white)
    doc.setDrawColor(C.line[0], C.line[1], C.line[2])
    doc.roundedRect(margin, y, contentW, chequeH, 10, 10, 'S')
    setRgb(doc, C.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(sanitizePdfText('Cek Bilgileri'), margin + 18, y + 22)
    let cy = y + 42
    chequeRows.forEach(([label, value]) => {
      setRgb(doc, C.muted)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.text(sanitizePdfText(String(label).toLocaleUpperCase('tr-TR')), margin + 18, cy)
      setRgb(doc, C.ink)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text(sanitizePdfText(value), margin + 140, cy)
      cy += 20
    })
    y += chequeH + 16
  }

  // Related table
  if (relatedRows.length > 0) {
    const tableH = 48 + relatedRows.length * 28 + 36
    drawRoundedPanel(doc, margin, y, contentW, tableH, C.white)
    doc.setDrawColor(C.line[0], C.line[1], C.line[2])
    doc.roundedRect(margin, y, contentW, tableH, 10, 10, 'S')

    setRgb(doc, C.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(sanitizePdfText('Ilgili Kayitlar'), margin + 18, y + 22)
    drawHairline(doc, margin + 18, y + 32, margin + contentW - 18)

    const cols = {
      title: margin + 18,
      status: margin + 250,
      total: margin + contentW - 150,
      applied: margin + contentW - 18,
    }

    setRgb(doc, C.muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('KAYIT', cols.title, y + 48)
    doc.text('DURUM', cols.status, y + 48)
    doc.text('TOPLAM', cols.total, y + 48, { align: 'right' })
    doc.text('ISLENEN', cols.applied, y + 48, { align: 'right' })

    let ry = y + 68
    relatedRows.forEach((row) => {
      setRgb(doc, C.ink)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.text(sanitizePdfText(String(row.title || '').slice(0, 42)), cols.title, ry)
      doc.setFont('helvetica', 'normal')
      setRgb(doc, C.muted)
      doc.text(sanitizePdfText(row.status || '—'), cols.status, ry)
      setRgb(doc, C.ink)
      doc.setFont('helvetica', 'bold')
      doc.text(sanitizePdfText(row.total || '—'), cols.total, ry, { align: 'right' })
      doc.text(sanitizePdfText(row.applied || '—'), cols.applied, ry, { align: 'right' })
      ry += 26
    })

    drawHairline(doc, margin + 18, ry - 8, margin + contentW - 18)
    setRgb(doc, C.muted)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text(sanitizePdfText('KALAN'), cols.total, ry + 12, { align: 'right' })
    setRgb(doc, C.ink)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text(sanitizePdfText(remainingBalance || '0,00₺'), cols.applied, ry + 12, {
      align: 'right',
    })

    y += tableH + 16
  }

  // Signature / footer
  if (y > pageH - 160) {
    doc.addPage()
    doc.setFillColor(C.softBg[0], C.softBg[1], C.softBg[2])
    doc.rect(0, 0, pageW, pageH, 'F')
    y = 48
  }

  const sigY = Math.max(y + 8, pageH - 150)
  drawRoundedPanel(doc, margin, sigY, contentW, 110, C.white)
  doc.setDrawColor(C.line[0], C.line[1], C.line[2])
  doc.roundedRect(margin, sigY, contentW, 110, 10, 10, 'S')

  setRgb(doc, C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(sanitizePdfText('DUZENLEYEN'), margin + 24, sigY + 24)
  doc.text(sanitizePdfText('MUSTERI / TESLIM ALAN'), margin + contentW / 2 + 12, sigY + 24)

  drawHairline(doc, margin + 24, sigY + 70, margin + contentW / 2 - 24)
  drawHairline(doc, margin + contentW / 2 + 12, sigY + 70, margin + contentW - 24)

  setRgb(doc, C.muted)
  doc.setFontSize(8)
  doc.text(sanitizePdfText('Imza / Kase'), margin + 24, sigY + 86)
  doc.text(sanitizePdfText('Imza / Kase'), margin + contentW / 2 + 12, sigY + 86)

  const taxLine = [
    company.taxOffice ? `Vergi Dairesi: ${company.taxOffice}` : '',
    company.taxNumber ? `Vergi No: ${company.taxNumber}` : '',
    company.website || '',
  ]
    .filter(Boolean)
    .join('  |  ')

  setRgb(doc, C.muted)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.text(
    sanitizePdfText(
      taxLine ||
        'Bu belge Bachmain CRM uzerinden olusturulmustur. Islem kaydi dijital olarak saklanir.',
    ),
    margin,
    pageH - 18,
  )

  const safeCustomer = sanitizePdfText(customerName).replace(/\s+/g, '-')
  const kindSlug =
    kind === 'odeme' ? 'odeme-makbuzu' : kind === 'opening' ? 'acilis-makbuzu' : 'tahsilat-makbuzu'
  doc.save(`${safeCustomer}-${kindSlug}.pdf`)
}
