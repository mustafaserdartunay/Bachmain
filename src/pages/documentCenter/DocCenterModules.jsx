import DesignerShellPage from '../../components/DocumentDesigner/DesignerShellPage'
import { DOCUMENT_CENTER_BASE } from '../../data/documentCenterMenu'

const MODULES = {
  barkod: {
    title: 'Barcode Designer',
    description: 'Code128, EAN-13, Code39 barkodlarını görsel olarak tasarlayın.',
    bullets: ['Sembol seçimi', 'İnsan okunur metin', 'Etiket boyutlarına gömme', 'Değişken bağlama'],
    ctaTo: `${DOCUMENT_CENTER_BASE}/etiket`,
    ctaLabel: 'Etiket tasarımcısına git',
  },
  qr: {
    title: 'QR Designer',
    description: 'URL, belge doğrulama, WhatsApp ve özel veri QR kodları.',
    bullets: ['ECC seviyesi', 'Boyut / kenar boşluğu', 'Belge token bağlama', 'Logo ortası (yakında)'],
    ctaTo: `${DOCUMENT_CENTER_BASE}/etiket`,
    ctaLabel: 'Etiket tasarımcısına git',
  },
  pdf: {
    title: 'PDF Designer',
    description: 'Şablonu PDF çıktısına optimize edin; sayfa, kenar boşluğu ve kalite profilleri.',
    bullets: ['A4 / A5 / Letter', 'Çok sayfa', 'Gömülü fontlar', 'Yazdırma önizleme'],
    ctaTo: `${DOCUMENT_CENTER_BASE}/yazdir`,
    ctaLabel: 'Yazdır / PDF',
  },
  eposta: {
    title: 'E-posta Şablonları',
    description: 'Belge PDF’lerini e-posta gövdesi ve konu satırı şablonlarıyla birleştirin.',
    bullets: ['Konu + gövde değişkenleri', 'Ek olarak PDF', 'Onay sonrası otomatik gönderim'],
  },
  whatsapp: {
    title: 'WhatsApp Şablonları',
    description: 'Cloud API onaylı mesaj şablonları ve belge bildirim metinleri.',
    bullets: ['Meta şablon adı', 'Değişken slotları', 'Belge linki / PDF'],
    ctaTo: '/ayarlar/mesaj-merkezi',
    ctaLabel: 'Mesaj Merkezi ayarları',
  },
  'yazici-profilleri': {
    title: 'Print Profiles',
    description: 'Yazıcı, kağıt, kenar boşluğu ve kopya sayısı profilleri.',
    bullets: ['Termal / A4', 'Ölçek', 'Renk / gri', 'Varsayılan profil'],
  },
  degiskenler: {
    title: 'Değişkenler',
    description: 'Tüm BachMain modüllerinden otomatik alan kataloğu.',
    bullets: ['Şirket / müşteri / belge', 'Stok / üretim / sevkiyat', 'İK / proje', 'Görsel ekleme'],
    ctaTo: `${DOCUMENT_CENTER_BASE}/tasarimci`,
    ctaLabel: 'Tasarımcıda kullan',
  },
  bilesenler: {
    title: 'Bileşenler',
    description: 'Yeniden kullanılabilir bloklar: başlık, tablo, toplam, imza.',
    bullets: ['Kütüphane', 'Sürükle-bırak', 'Şirket temasına uyum'],
  },
  assets: {
    title: 'Assets',
    description: 'Logo, damga, imza ve görseller — tenant’a özel medya havuzu.',
    bullets: ['Yükleme', 'Etiketleme', 'Şablona bağlama'],
  },
  fonts: {
    title: 'Fonts',
    description: 'Belge tipografisi ve gömülü font yönetimi.',
    bullets: ['Sistem fontları', 'Marka fontları', 'PDF gömme'],
  },
  temalar: {
    title: 'Themes',
    description: 'Renk, tipografi ve boşluk setleri — şablonlara tek tıkla uygula.',
    bullets: ['Kurumsal tema', 'Açık / koyu baskı', 'Marka uyumu'],
  },
  workflow: {
    title: 'Workflow',
    description: 'Onay → PDF → E-posta → WhatsApp → Arşiv otomasyonları.',
    bullets: ['Tetikleyiciler', 'Adımlar', 'Koşullar', 'Bildirimler'],
  },
  izinler: {
    title: 'Permissions',
    description: 'Rol bazlı görüntüleme, düzenleme, yayınlama ve silme hakları.',
    bullets: ['View / Edit / Publish', 'Export', 'Approve'],
  },
  marketplace: {
    title: 'Marketplace',
    description: 'Hazır şablon paketlerini içe / dışa aktarın.',
    bullets: ['Kategoriler', 'İçe aktar JSON', 'Dışa aktar', 'Topluluk paketleri'],
  },
  versiyonlar: {
    title: 'Version History',
    description: 'Draft / Published / Archive ve önceki sürüme dönüş.',
    bullets: ['Sürüm karşılaştırma', 'Geri yükle', 'Çoğalt'],
    ctaTo: `${DOCUMENT_CENTER_BASE}/sablonlar`,
    ctaLabel: 'Şablon listesi',
  },
  arsiv: {
    title: 'Arşiv',
    description: 'Silinen ve arşivlenen şablonlar — Silinenler paneli ile uyumlu.',
    bullets: ['Soft-delete', 'Geri yükle', 'Kalıcı silme politikası'],
    ctaTo: `${DOCUMENT_CENTER_BASE}/sablonlar`,
    ctaLabel: 'Şablonlar',
  },
}

export default function DocCenterModulePage({ moduleKey }) {
  const config = MODULES[moduleKey]
  if (!config) {
    return (
      <DesignerShellPage
        title="Belge Merkezi"
        description="Modül bulunamadı."
        ctaTo={DOCUMENT_CENTER_BASE}
        ctaLabel="Özete dön"
      />
    )
  }
  return <DesignerShellPage {...config} />
}

export function DocCenterModuleRoute({ moduleKey }) {
  return <DocCenterModulePage moduleKey={moduleKey} />
}

export function DocBarcodeDesignerPage() {
  return <DocCenterModulePage moduleKey="barkod" />
}
export function DocQrDesignerPage() {
  return <DocCenterModulePage moduleKey="qr" />
}
export function DocPdfDesignerPage() {
  return <DocCenterModulePage moduleKey="pdf" />
}
export function DocEmailTemplatesPage() {
  return <DocCenterModulePage moduleKey="eposta" />
}
export function DocWhatsAppTemplatesPage() {
  return <DocCenterModulePage moduleKey="whatsapp" />
}
export function DocVariablesPage() {
  return <DocCenterModulePage moduleKey="degiskenler" />
}
export function DocComponentsPage() {
  return <DocCenterModulePage moduleKey="bilesenler" />
}
export function DocAssetsPage() {
  return <DocCenterModulePage moduleKey="assets" />
}
export function DocFontsPage() {
  return <DocCenterModulePage moduleKey="fonts" />
}
export function DocThemesPage() {
  return <DocCenterModulePage moduleKey="temalar" />
}
export function DocWorkflowPage() {
  return <DocCenterModulePage moduleKey="workflow" />
}
export function DocPermissionsPage() {
  return <DocCenterModulePage moduleKey="izinler" />
}
export function DocMarketplacePage() {
  return <DocCenterModulePage moduleKey="marketplace" />
}
export function DocVersionsPage() {
  return <DocCenterModulePage moduleKey="versiyonlar" />
}
export function DocArchivePage() {
  return <DocCenterModulePage moduleKey="arsiv" />
}
