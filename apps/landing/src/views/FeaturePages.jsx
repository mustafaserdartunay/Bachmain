'use client'

import FeatureLayout from '../components/FeatureLayout'

const pages = {
  Features: {
    badge: 'Özellikler',
    title: 'CRM + ERP Tek Platformda',
    subtitle: 'Satış, operasyon, finans ve raporlama modülleri entegre çalışır.',
    features: [
      { title: 'CRM', desc: 'Müşteri kartları, satış hunisi, görev takibi' },
      { title: 'ERP', desc: 'Stok, üretim, satın alma, operasyon' },
      { title: 'Stok', desc: 'Çoklu depo, rezervasyon, sayım' },
      { title: 'Finans', desc: 'Cari, kasa, banka, tahsilat' },
      { title: 'Raporlama', desc: 'Dashboard, KPI, pivot raporlar' },
      { title: 'B2B', desc: 'Müşteri self-servis portal' },
    ],
    bullets: ['Modüler yapı', 'API entegrasyonu', 'Mobil uygulama', '7/24 destek'],
  },
  Crm: {
    badge: 'CRM',
    title: 'Müşteri İlişkileri Yönetimi',
    subtitle: 'Satış hunisi, müşteri kartları, görev ve randevu takibi tek ekranda.',
    features: [
      { title: '360° Müşteri Kartı', desc: 'Tüm iletişim ve sipariş geçmişi' },
      { title: 'Satış Hunisi', desc: "Lead'den kapanışa görünürlük" },
      { title: 'Görev Takibi', desc: 'Hatırlatma ve atama' },
      { title: 'WhatsApp Entegrasyonu', desc: 'Mesajlar müşteri kartına bağlı' },
    ],
    bullets: ['Pipeline raporları', 'Segmentasyon', 'E-posta kampanyaları', 'Mobil CRM'],
  },
  Erp: {
    badge: 'ERP',
    title: 'Kurumsal Kaynak Planlama',
    subtitle: 'Stok, üretim, finans ve operasyon süreçlerinizi yönetin.',
    features: [
      { title: 'Stok & Depo', desc: 'Anlık stok, transfer, sayım' },
      { title: 'Üretim', desc: 'İş emri, reçete, kapasite' },
      { title: 'Satın Alma', desc: 'Tedarikçi, sipariş, mal kabul' },
      { title: 'B2B Portal', desc: 'Müşteri self-servis' },
    ],
    bullets: ['Tek veri kaynağı', 'Süreç otomasyonu', 'Çoklu şube', 'Entegrasyon API'],
  },
  Stock: {
    badge: 'Stok',
    title: 'Stok ve Depo Yönetimi',
    subtitle: 'Çoklu depo, raf adresleme, kritik seviye uyarıları.',
    features: [
      { title: 'Anlık Stok', desc: 'Tüm depolar tek ekranda' },
      { title: 'Rezervasyon', desc: 'Sipariş bazlı stok ayırma' },
      { title: 'Sayım', desc: 'Mobil sayım ve mutabakat' },
      { title: 'Transfer', desc: 'Depolar arası hızlı transfer' },
    ],
    bullets: ['Barkod desteği', 'Lot/seri takibi', 'Min-max uyarı', 'Stok raporları'],
  },
  Finance: {
    badge: 'Finans',
    title: 'Cari, Kasa ve Banka Yönetimi',
    subtitle: 'Tahsilat, ödeme, çek/senet ve banka mutabakatı.',
    features: [
      { title: 'Cari Hesap', desc: 'Borç/alacak, vade, ekstre' },
      { title: 'Kasa', desc: 'Nakit hareketleri' },
      { title: 'Banka', desc: 'Mutabakat ve EFT' },
      { title: 'Tahsilat', desc: 'Otomatik hatırlatma' },
    ],
    bullets: ['Yaşlandırma raporu', 'Çek takibi', 'Taksit planı', 'B2B cari görünüm'],
  },
  Reports: {
    badge: 'Raporlama',
    title: 'Analiz ve Dashboard',
    subtitle: 'KPI panelleri, pivot raporlar, yönetici özet ekranları.',
    features: [
      { title: 'Canlı Dashboard', desc: 'Satış, stok, finans KPI' },
      { title: 'Pivot Raporlar', desc: 'Özelleştirilebilir analiz' },
      { title: 'Zamanlanmış Rapor', desc: 'E-posta ile otomatik gönderim' },
      { title: 'Export', desc: 'Excel, PDF dışa aktarım' },
    ],
    bullets: ['120+ hazır şablon', 'Grafik ve tablo', 'Rol bazlı erişim', 'Mobil dashboard'],
  },
}

export function FeaturesPage() {
  const p = pages.Features
  return <FeatureLayout {...p} />
}
export function CrmPage() {
  return <FeatureLayout {...pages.Crm} />
}
export function ErpPage() {
  return <FeatureLayout {...pages.Erp} />
}
export function StockPage() {
  return <FeatureLayout {...pages.Stock} />
}
export function FinancePage() {
  return <FeatureLayout {...pages.Finance} />
}
export function ReportsPage() {
  return <FeatureLayout {...pages.Reports} />
}

export function ModulesPage() {
  return (
    <FeatureLayout
      badge="Sektörel Modüller"
      title="Sektörünüze Özel Çözümler"
      subtitle="Üretim, e-ticaret, saha satış ve daha fazlası için hazır modüller."
      features={[
        { title: 'Üretim', desc: 'İş emri, reçete, kapasite planlama' },
        { title: 'E-Ticaret', desc: 'Pazaryeri ve web entegrasyonu' },
        { title: 'Saha Satış', desc: 'GPS, rota, mobil sipariş' },
        { title: 'Depo/Lojistik', desc: 'Sevkiyat, kurye, tır yerleşim' },
        { title: 'Finans', desc: 'Cari, tahsilat, bütçe' },
        { title: 'B2B', desc: 'Müşteri portalı' },
      ]}
      bullets={['Sektöre özel şablonlar', 'Hızlı kurulum', 'Eğitim dahil']}
    />
  )
}

export function ProductionPage() {
  return (
    <FeatureLayout
      badge="Üretim"
      title="Üretim Firmaları İçin"
      subtitle="İş emri, reçete, kapasite ve canlı üretim takibi."
      features={[
        { title: 'İş Emri', desc: 'Planlama ve atama' },
        { title: 'Reçete', desc: 'BOM ve malzeme listesi' },
        { title: 'Kapasite', desc: 'Hat ve makine planlama' },
        { title: 'B2B Takip', desc: 'Müşteri canlı üretim görünümü' },
      ]}
      bullets={['Fire takibi', 'Kalite kontrol', 'Maliyet analizi', 'Entegrasyon API']}
    />
  )
}

export function EcommercePage() {
  return (
    <FeatureLayout
      badge="E-Ticaret"
      title="E-Ticaret Entegrasyonları"
      subtitle="Trendyol, Hepsiburada, N11 ve özel web siteleri ile stok/sipariş senkronu."
      features={[
        { title: 'Pazaryeri', desc: 'Çoklu kanal sipariş' },
        { title: 'Stok Sync', desc: 'Anlık stok güncelleme' },
        { title: 'Kargo', desc: 'Etiket ve takip' },
        { title: 'Fatura', desc: 'Otomatik e-fatura' },
      ]}
      bullets={['API entegrasyon', 'Toplu ürün aktarım', 'Fiyat senkronu']}
    />
  )
}

export function FieldSalesPage() {
  return (
    <FeatureLayout
      badge="Saha Satış"
      title="Saha Satış Ekipleri"
      subtitle="Canlı konum, rota optimizasyonu, mobil sipariş ve ziyaret takibi."
      features={[
        { title: 'Canlı Harita', desc: 'Temsilci konumu anlık' },
        { title: 'Mobil Sipariş', desc: 'Sahadan anında giriş' },
        { title: 'Ziyaret Planı', desc: 'Check-in/out' },
        { title: 'Performans', desc: 'Hedef ve KPI' },
      ]}
      bullets={['Offline mod', 'Fotoğraf ekleme', 'Rota optimizasyonu']}
    />
  )
}

export function EInvoicePage() {
  return (
    <FeatureLayout
      badge="E-Belge"
      title="E-Fatura, E-Arşiv, E-İrsaliye"
      subtitle="GİB uyumlu e-belge süreçleri tek panelde."
      features={[
        { title: 'e-Fatura', desc: 'GİB entegrasyonu' },
        { title: 'e-Arşiv', desc: 'Perakende fatura' },
        { title: 'e-İrsaliye', desc: 'Sevkiyat belgesi' },
        { title: 'e-Makbuz', desc: 'Tahsilat makbuzu' },
      ]}
      bullets={['Otomatik gönderim', 'Arşivleme', 'Toplu işlem', 'KVKK uyumlu']}
    />
  )
}
