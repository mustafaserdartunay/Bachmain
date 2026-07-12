export const DOCUMENT_CENTER_BASE = '/belge-merkezi'

export const documentCenterSubMenus = [
  { label: 'Özet', path: DOCUMENT_CENTER_BASE, icon: 'gauge' },
  { label: 'Şablonlar', path: `${DOCUMENT_CENTER_BASE}/sablonlar`, icon: 'templates' },
  { label: 'Tasarımcı', path: `${DOCUMENT_CENTER_BASE}/tasarimci`, icon: 'pen' },
  { label: 'Etiket / Barkod', path: `${DOCUMENT_CENTER_BASE}/etiket`, icon: 'tag' },
  { label: 'Yazdır', path: `${DOCUMENT_CENTER_BASE}/yazdir`, icon: 'print' },
  { label: 'Yazdırma Kayıtları', path: `${DOCUMENT_CENTER_BASE}/kayitlar`, icon: 'history' },
]

export function isDocumentCenterRoute(pathname) {
  return pathname === DOCUMENT_CENTER_BASE || pathname.startsWith(`${DOCUMENT_CENTER_BASE}/`)
}
