export function downloadExcelCsv(filename, headers, rows) {
  const delimiter = ';'
  const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const lines = [
    headers.map(escape).join(delimiter),
    ...rows.map((row) => row.map(escape).join(delimiter)),
  ]
  const blob = new Blob([`\uFEFF${lines.join('\n')}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function sanitizeExportFilename(value, fallback = 'export') {
  return String(value || fallback)
    .trim()
    .replace(/[^\w\s-ğüşıöçĞÜŞİÖÇ]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 80) || fallback
}
