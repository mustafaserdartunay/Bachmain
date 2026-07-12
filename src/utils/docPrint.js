/**
 * Print / PDF helpers for Document Center (client MVP).
 */

export function openPrintWindow(html) {
  const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=1000')
  if (!win) {
    window.alert('Pop-up engellendi. Lütfen tarayıcıda pop-up izni verin.')
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
  win.focus()
  window.setTimeout(() => {
    try {
      win.print()
    } catch {
      // user can print manually
    }
  }, 350)
}

export async function downloadPdfFromHtml(html, filename = 'belge.pdf') {
  const { jsPDF } = await import('jspdf')
  const { default: html2canvas } = await import('html2canvas')

  const host = document.createElement('div')
  host.style.position = 'fixed'
  host.style.left = '-10000px'
  host.style.top = '0'
  host.style.width = '794px'
  host.style.background = '#fff'
  host.innerHTML = html
  document.body.appendChild(host)

  try {
    const canvas = await html2canvas(host, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
    const img = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    let heightLeft = imgHeight
    let position = 0
    pdf.addImage(img, 'JPEG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(img, 'JPEG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }
    pdf.save(filename)
  } finally {
    document.body.removeChild(host)
  }
}
