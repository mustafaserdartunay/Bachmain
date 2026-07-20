export const DOCUMENT_CENTER_BASE = '/belge-merkezi'
export const DOCUMENT_PLATFORM_ALIAS = '/belge-platformu'

/** Full Document Center navigation (nested under Ayarlar → Belge Merkezi) */
export const documentCenterSubMenus = [
  { label: 'Özet', path: DOCUMENT_CENTER_BASE, icon: 'gauge' },
  { label: 'Knowledge Center', path: '/bilgi-merkezi', icon: 'library' },
  { label: 'Şablonlar', path: `${DOCUMENT_CENTER_BASE}/sablonlar`, icon: 'templates' },
  { label: 'Belge Tasarımcısı', path: `${DOCUMENT_CENTER_BASE}/tasarimci`, icon: 'pen' },
  { label: 'Label Designer', path: `${DOCUMENT_CENTER_BASE}/etiket`, icon: 'tag' },
  { label: 'Barcode Designer', path: `${DOCUMENT_CENTER_BASE}/barkod`, icon: 'barcode' },
  { label: 'QR Designer', path: `${DOCUMENT_CENTER_BASE}/qr`, icon: 'qr' },
  { label: 'PDF Designer', path: `${DOCUMENT_CENTER_BASE}/pdf`, icon: 'pdf' },
  { label: 'AI Designer', path: `${DOCUMENT_CENTER_BASE}/ai-designer`, icon: 'sparkles' },
  { label: 'E-posta Şablonları', path: `${DOCUMENT_CENTER_BASE}/eposta`, icon: 'mail' },
  { label: 'SMS Şablonları', path: `${DOCUMENT_CENTER_BASE}/sms`, icon: 'sms' },
  { label: 'WhatsApp Şablonları', path: `${DOCUMENT_CENTER_BASE}/whatsapp`, icon: 'whatsapp' },
  { label: 'Yazıcı Ayarları', path: `${DOCUMENT_CENTER_BASE}/yazici-profilleri`, icon: 'print' },
  { label: 'Değişkenler', path: `${DOCUMENT_CENTER_BASE}/degiskenler`, icon: 'variables' },
  { label: 'Bileşenler', path: `${DOCUMENT_CENTER_BASE}/bilesenler`, icon: 'components' },
  { label: 'Assets', path: `${DOCUMENT_CENTER_BASE}/assets`, icon: 'assets' },
  { label: 'Fonts', path: `${DOCUMENT_CENTER_BASE}/fonts`, icon: 'fonts' },
  { label: 'Themes', path: `${DOCUMENT_CENTER_BASE}/temalar`, icon: 'themes' },
  { label: 'Localization', path: `${DOCUMENT_CENTER_BASE}/localization`, icon: 'languages' },
  { label: 'Approval Center', path: `${DOCUMENT_CENTER_BASE}/onay`, icon: 'check' },
  { label: 'Workflow', path: `${DOCUMENT_CENTER_BASE}/workflow`, icon: 'workflow' },
  { label: 'Permissions', path: `${DOCUMENT_CENTER_BASE}/izinler`, icon: 'lock' },
  { label: 'Marketplace', path: `${DOCUMENT_CENTER_BASE}/marketplace`, icon: 'store' },
  { label: 'Version History', path: `${DOCUMENT_CENTER_BASE}/versiyonlar`, icon: 'history' },
  { label: 'Arşiv', path: `${DOCUMENT_CENTER_BASE}/arsiv`, icon: 'archive' },
  { label: 'Yazdır', path: `${DOCUMENT_CENTER_BASE}/yazdir`, icon: 'print' },
  { label: 'Yazdırma Kayıtları', path: `${DOCUMENT_CENTER_BASE}/kayitlar`, icon: 'history' },
]

/** Hub tab strip (DP-0 Enterprise IA) */
export const documentPlatformTabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'templates', label: 'Templates' },
  { id: 'builder', label: 'Document Builder' },
  { id: 'labels', label: 'Label Designer' },
  { id: 'barcode', label: 'Barcode' },
  { id: 'qr', label: 'QR' },
  { id: 'print', label: 'Print Center' },
  { id: 'variables', label: 'Variables' },
  { id: 'mapping', label: 'Data Mapping' },
  { id: 'assets', label: 'Assets' },
  { id: 'fonts', label: 'Fonts' },
  { id: 'ai', label: 'AI Designer' },
  { id: 'marketplace', label: 'Marketplace' },
  { id: 'versions', label: 'Version History' },
  { id: 'approval', label: 'Approval' },
  { id: 'localization', label: 'Localization' },
  { id: 'archive', label: 'Archive' },
  { id: 'settings', label: 'Settings' },
]

export const documentCenterChildMenus = documentCenterSubMenus.filter(
  (item) => item.path !== DOCUMENT_CENTER_BASE,
)

export function isDocumentCenterRoute(pathname) {
  return (
    pathname === DOCUMENT_CENTER_BASE ||
    pathname === DOCUMENT_PLATFORM_ALIAS ||
    pathname.startsWith(`${DOCUMENT_CENTER_BASE}/`)
  )
}
