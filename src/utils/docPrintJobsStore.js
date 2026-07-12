/**
 * Print job log for Document Center.
 */

const STORAGE_KEY = 'erlenbox-doc-print-jobs'
export const DOC_PRINT_JOBS_EVENT = 'bach:doc-print-jobs-updated'
const MAX_JOBS = 200

function readAll() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_JOBS)))
  window.dispatchEvent(new CustomEvent(DOC_PRINT_JOBS_EVENT))
}

export function loadPrintJobs() {
  return readAll().sort((a, b) => String(b.printedAt || '').localeCompare(String(a.printedAt || '')))
}

export function logPrintJob({
  kind = 'print',
  docType = '',
  documentId = '',
  templateId = '',
  templateName = '',
  labelId = '',
  labelName = '',
  userEmail = '',
  status = 'ok',
} = {}) {
  const job = {
    id: `pj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    kind,
    docType,
    documentId,
    templateId,
    templateName,
    labelId,
    labelName,
    userEmail,
    status,
    printedAt: new Date().toISOString(),
  }
  const list = readAll()
  list.unshift(job)
  writeAll(list)
  return job
}

export function clearPrintJobs() {
  writeAll([])
}
