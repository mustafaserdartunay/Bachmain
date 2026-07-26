/**
 * Client-side file validation before data-URL storage / future R2 upload.
 * Does not replace server-side MIME sniffing — required until object storage lands.
 */

export const DEFAULT_MAX_BYTES = 8 * 1024 * 1024 // 8 MB

export const ALLOWED_MIME_BY_EXT = {
  dxf: ['application/dxf', 'image/vnd.dxf', 'application/octet-stream', 'text/plain'],
  pdf: ['application/pdf'],
  ai: [
    'application/postscript',
    'application/illustrator',
    'application/pdf',
    'application/octet-stream',
  ],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  webp: ['image/webp'],
  gif: ['image/gif'],
}

const DANGEROUS_EXT = new Set([
  'html',
  'htm',
  'svg',
  'js',
  'mjs',
  'jsx',
  'ts',
  'tsx',
  'exe',
  'bat',
  'cmd',
  'sh',
  'php',
  'asp',
  'aspx',
  'jsp',
  'wasm',
])

function extOf(name) {
  const parts = String(name || '')
    .toLowerCase()
    .split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export function sanitizeFileName(name) {
  const base = String(name || 'file')
    .replace(/\\/g, '/')
    .split('/')
    .pop()
  const cleaned = String(base || 'file')
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 120)
  const ext = extOf(cleaned)
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  const stem = cleaned.replace(/\.[^.]+$/, '').slice(0, 80) || 'file'
  return `${stem}-${stamp}-${rand}${ext ? `.${ext}` : ''}`
}

/**
 * @returns {{ ok: true, safeName: string } | { ok: false, error: string }}
 */
export function validateUploadFile(
  file,
  { allowedTypes = null, maxBytes = DEFAULT_MAX_BYTES } = {},
) {
  if (!file) return { ok: false, error: 'Dosya seçilmedi' }
  if (file.size > maxBytes) {
    return { ok: false, error: `Dosya çok büyük (max ${Math.round(maxBytes / (1024 * 1024))} MB)` }
  }
  const ext = extOf(file.name)
  if (!ext || DANGEROUS_EXT.has(ext)) {
    return { ok: false, error: 'Bu dosya türüne izin verilmiyor' }
  }
  if (
    allowedTypes &&
    !allowedTypes.includes(ext) &&
    !(ext === 'jpeg' && allowedTypes.includes('jpg'))
  ) {
    return { ok: false, error: `İzin verilen türler: ${allowedTypes.join(', ').toUpperCase()}` }
  }
  const allowedMimes = ALLOWED_MIME_BY_EXT[ext === 'jpeg' ? 'jpg' : ext]
  if (
    allowedMimes &&
    file.type &&
    !allowedMimes.includes(file.type) &&
    file.type !== 'application/octet-stream'
  ) {
    return { ok: false, error: `MIME uyuşmazlığı (${file.type || 'bilinmiyor'})` }
  }
  return { ok: true, safeName: sanitizeFileName(file.name) }
}
