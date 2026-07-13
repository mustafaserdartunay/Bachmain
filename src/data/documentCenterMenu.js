export const DOCUMENT_CENTER_BASE = '/belge-merkezi'

/** Full Document Center navigation (nested under Ayarlar → Belge Merkezi) */
export const documentCenterSubMenus = [
  { label: 'Özet', path: DOCUMENT_CENTER_BASE, icon: 'gauge' },
  { label: 'Şablonlar', path: `${DOCUMENT_CENTER_BASE}/sablonlar`, icon: 'templates' },
  { label: 'Document Designer', path: `${DOCUMENT_CENTER_BASE}/tasarimci`, icon: 'pen' },
  { label: 'Label Designer', path: `${DOCUMENT_CENTER_BASE}/etiket`, icon: 'tag' },
  { label: 'Barcode Designer', path: `${DOCUMENT_CENTER_BASE}/barkod`, icon: 'barcode' },
  { label: 'QR Designer', path: `${DOCUMENT_CENTER_BASE}/qr`, icon: 'qr' },
  { label: 'PDF Designer', path: `${DOCUMENT_CENTER_BASE}/pdf`, icon: 'pdf' },
  { label: 'E-posta Şablonları', path: `${DOCUMENT_CENTER_BASE}/eposta`, icon: 'mail' },
  { label: 'WhatsApp Şablonları', path: `${DOCUMENT_CENTER_BASE}/whatsapp`, icon: 'whatsapp' },
  { label: 'Print Profiles', path: `${DOCUMENT_CENTER_BASE}/yazici-profilleri`, icon: 'print' },
  { label: 'Değişkenler', path: `${DOCUMENT_CENTER_BASE}/degiskenler`, icon: 'variables' },
  { label: 'Bileşenler', path: `${DOCUMENT_CENTER_BASE}/bilesenler`, icon: 'components' },
  { label: 'Assets', path: `${DOCUMENT_CENTER_BASE}/assets`, icon: 'assets' },
  { label: 'Fonts', path: `${DOCUMENT_CENTER_BASE}/fonts`, icon: 'fonts' },
  { label: 'Themes', path: `${DOCUMENT_CENTER_BASE}/temalar`, icon: 'themes' },
  { label: 'Workflow', path: `${DOCUMENT_CENTER_BASE}/workflow`, icon: 'workflow' },
  { label: 'Permissions', path: `${DOCUMENT_CENTER_BASE}/izinler`, icon: 'lock' },
  { label: 'Marketplace', path: `${DOCUMENT_CENTER_BASE}/marketplace`, icon: 'store' },
  { label: 'Version History', path: `${DOCUMENT_CENTER_BASE}/versiyonlar`, icon: 'history' },
  { label: 'Arşiv', path: `${DOCUMENT_CENTER_BASE}/arsiv`, icon: 'archive' },
  { label: 'Yazdır', path: `${DOCUMENT_CENTER_BASE}/yazdir`, icon: 'print' },
  { label: 'Yazdırma Kayıtları', path: `${DOCUMENT_CENTER_BASE}/kayitlar`, icon: 'history' },
]

export const documentCenterChildMenus = documentCenterSubMenus.filter(
  (item) => item.path !== DOCUMENT_CENTER_BASE,
)

export function isDocumentCenterRoute(pathname) {
  return pathname === DOCUMENT_CENTER_BASE || pathname.startsWith(`${DOCUMENT_CENTER_BASE}/`)
}
