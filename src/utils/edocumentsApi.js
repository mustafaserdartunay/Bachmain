import { getPlatformApiBase } from './platformApi'

function apiBase() {
  return getPlatformApiBase()
}

async function request(op, { method = 'GET', query = {}, body } = {}) {
  const base = apiBase()
  if (!base) {
    const err = new Error('NO_API')
    err.code = 'NO_API'
    throw err
  }
  let token = null
  try {
    token =
      localStorage.getItem('bachmain_auth_token') ||
      document.cookie
        ?.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('bachmain_token='))
        ?.split('=')[1] ||
      null
  } catch {
    token = null
  }
  const params = new URLSearchParams({ op, ...query })
  const res = await fetch(`${base.replace(/\/$/, '')}/edocuments?${params.toString()}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP_${res.status}`)
    err.status = res.status
    err.code = data.error
    err.payload = data
    throw err
  }
  return data
}

export const edocumentsApi = {
  connection: () => request('connection'),
  saveConnection: (body) => request('connection', { method: 'POST', body }),
  testConnection: () => request('test', { method: 'POST', body: {} }),
  taxpayer: (taxNumber) => request('taxpayer', { query: { taxNumber } }),
  credits: () => request('credits'),
  list: (query = {}) => request('list', { query }),
  get: (id) => request('get', { query: { id } }),
  create: (body) => request('create', { method: 'POST', body }),
  confirm: (id) => request('confirm', { method: 'POST', body: { id } }),
  sync: () => request('sync', { method: 'POST', body: {} }),
  file: (id, kind) => request(kind, { query: { id } }),
}

export function downloadBase64File({ base64, filename, mime }) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
  const blob = new Blob([bytes], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const EDOC_STATUS_LABEL = {
  DRAFT: 'Taslak',
  PROCESSING: 'İşleniyor',
  SENT: 'Gönderildi',
  RECEIVED: 'Alındı',
  ACCEPTED: 'Kabul',
  REJECTED: 'Red',
  CANCELLED: 'İptal',
  ERROR: 'Hata',
}

export const EDOC_STATUS_CLASS = {
  DRAFT: 'text-gray-400',
  PROCESSING: 'text-orange-300',
  SENT: 'text-blue-300',
  RECEIVED: 'text-emerald-300',
  ACCEPTED: 'text-emerald-300',
  REJECTED: 'text-rose-300',
  CANCELLED: 'text-gray-400',
  ERROR: 'text-rose-300',
}
