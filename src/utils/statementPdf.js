import { jsPDF } from 'jspdf'
import { readCompanySettings } from './companySettings'
import { getCustomerStatementAmountSign } from './treasuryStore'

function sanitizePdfText(value) {
  return String(value || '')
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

function setColor(doc, kind) {
  const colors = {
    muted: [148, 163, 184],
    white: [255, 255, 255],
    heading: [147, 197, 253],
    emerald: [110, 231, 183],
    cyan: [103, 232, 249],
    tealMuted: [90, 158, 168],
    red: [252, 165, 165],
    orange: [253, 186, 116],
    dark: [15, 23, 42],
    panel: [17, 28, 49],
    row: [30, 41, 59],
  }
  const rgb = colors[kind] || colors.white
  doc.setTextColor(rgb[0], rgb[1], rgb[2])
}

function amountColor(row) {
  if (row.isOpening) return 'orange'
  if (row.isInvoice) return 'emerald'
  return 'heading'
}

function balanceColor(balance) {
  if (balance < 0) return 'red'
  if (balance > 0) return 'emerald'
  return 'orange'
}

export function downloadStatementPdf({
  customerDisplay,
  customer,
  statementRows,
  collectedTotal,
  currentBalance,
  formatCurrency,
}) {
  const company = readCompanySettings()
  const pageWidth = 1190
  const pageHeight = 1684
  const doc = new jsPDF({ unit: 'pt', format: [pageWidth, pageHeight], compress: true })
  const margin = 56
  const contentWidth = pageWidth - margin * 2
  let y = 72

  doc.setFillColor(12, 18, 32)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setFillColor(17, 28, 49)
  doc.roundedRect(margin, 48, contentWidth, 120, 18, 18, 'F')

  if (company.logoDataUrl) {
    try {
      doc.addImage(company.logoDataUrl, 'PNG', margin + 20, 68, 72, 72)
    } catch {
      // ignore invalid logo data
    }
  }

  const headerX = company.logoDataUrl ? margin + 108 : margin + 24
  setColor(doc, 'heading')
  doc.setFontSize(22)
  doc.text(sanitizePdfText(company.companyName || 'ERLENBOX'), headerX, 88)
  setColor(doc, 'muted')
  doc.setFontSize(11)
  doc.text(sanitizePdfText(company.legalTitle), headerX, 108)
  doc.text(sanitizePdfText(`${company.phone} | ${company.email}`), headerX, 126)
  doc.text(sanitizePdfText(company.address), headerX, 142)

  setColor(doc, 'heading')
  doc.setFontSize(18)
  doc.text(sanitizePdfText('MUSTERI HESAP EKSTRESI'), pageWidth - margin - 280, 88)
  setColor(doc, 'white')
  doc.setFontSize(14)
  doc.text(sanitizePdfText(customerDisplay.brandShortName), pageWidth - margin - 280, 114)
  setColor(doc, 'muted')
  doc.setFontSize(11)
  doc.text(sanitizePdfText(`${customerDisplay.companyTitle} | ${customer.city}`), pageWidth - margin - 280, 134)

  y = 196
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(margin, y, contentWidth, 72, 14, 14, 'F')
  setColor(doc, 'emerald')
  doc.setFontSize(13)
  doc.text(sanitizePdfText(`Toplam Tahsilat: ${formatCurrency(collectedTotal)}`), margin + 24, y + 44)
  setColor(doc, balanceColor(currentBalance))
  doc.text(sanitizePdfText(`Guncel Bakiye: ${formatCurrency(currentBalance)}`), margin + 420, y + 44)

  y += 96
  const col = {
    type: margin,
    place: margin + 150,
    desc: margin + 300,
    date: margin + 720,
    amount: margin + 860,
    balance: margin + 980,
  }

  setColor(doc, 'muted')
  doc.setFontSize(10)
  doc.text('ISLEM TURU', col.type, y)
  doc.text('ISLEM YERI', col.place, y)
  doc.text('ACIKLAMA', col.desc, y)
  doc.text('TARIH', col.date, y)
  doc.text('MEBLAG', col.amount, y)
  doc.text('BAKIYE', col.balance, y)
  y += 10
  doc.setDrawColor(51, 65, 85)
  doc.line(margin, y, pageWidth - margin, y)

  statementRows.forEach((row) => {
    y += 34
    if (y > pageHeight - 180) {
      doc.addPage([pageWidth, pageHeight], 'p')
      doc.setFillColor(12, 18, 32)
      doc.rect(0, 0, pageWidth, pageHeight, 'F')
      y = 72
    }

    doc.setFillColor(30, 41, 59)
    doc.roundedRect(margin, y - 22, contentWidth, 30, 8, 8, 'F')

    setColor(doc, 'white')
    doc.setFontSize(10)
    doc.text(sanitizePdfText(row.type), col.type, y)
    setColor(doc, 'muted')
    doc.text(sanitizePdfText(row.accountName || '—'), col.place, y)
    doc.text(sanitizePdfText(String(row.description || '')).slice(0, 42), col.desc, y)
    doc.text(sanitizePdfText(row.date), col.date, y)

    setColor(doc, amountColor(row))
    const sign = getCustomerStatementAmountSign(row)
    doc.text(sanitizePdfText(`${sign}${formatCurrency(row.amount)}`), col.amount, y)

    setColor(doc, balanceColor(row.balance))
    doc.text(sanitizePdfText(formatCurrency(row.balance)), col.balance, y)
  })

  y = Math.max(y + 48, pageHeight - 220)
  doc.setFillColor(15, 23, 42)
  doc.roundedRect(margin, y, contentWidth, 120, 14, 14, 'F')
  setColor(doc, 'heading')
  doc.setFontSize(12)
  doc.text('BANKA BILGILERIMIZ', margin + 24, y + 28)
  setColor(doc, 'muted')
  doc.setFontSize(10)
  company.bankAccounts.forEach((account, index) => {
    const line = `${account.bankName} - ${account.label}: ${account.iban}`
    doc.text(sanitizePdfText(line), margin + 24, y + 52 + index * 18)
  })
  setColor(doc, 'muted')
  doc.setFontSize(9)
  doc.text(
    sanitizePdfText(`Vergi Dairesi: ${company.taxOffice} | Vergi No: ${company.taxNumber} | ${company.website}`),
    margin + 24,
    y + 52 + company.bankAccounts.length * 18 + 12,
  )

  doc.save(`${sanitizePdfText(customer.company)}-ekstre.pdf`)
}
