export type StoryModule = {
  id: string
  title: string
  headline: string
  body: string
  href: string
  tone: 'violet' | 'blue' | 'cyan' | 'orange' | 'green' | 'pink' | 'indigo'
  glow: string
}

export const STORY_MODULES: StoryModule[] = [
  {
    id: 'crm',
    title: 'CRM',
    headline: 'Müşterilerinizi daha iyi yönetin.',
    body: 'Pipeline, fırsatlar, görevler ve müşteri kartları tek ekranda — satış ekibiniz aynı veriyle çalışsın.',
    href: '/crm',
    tone: 'violet',
    glow: 'rgba(139, 92, 246, 0.45)',
  },
  {
    id: 'erp',
    title: 'ERP',
    headline: 'Tüm operasyonunuzu tek ekrandan yönetin.',
    body: 'Tekliften siparişe, satın almadan üretime kadar uçtan uca süreçler birbirine bağlı ilerler.',
    href: '/erp',
    tone: 'blue',
    glow: 'rgba(37, 99, 235, 0.45)',
  },
  {
    id: 'uretim',
    title: 'Üretim',
    headline: 'Üretiminizi planlayın.',
    body: 'İş emri, MRP, kalite ve fotoğraflı aşama takibi ile üretimde tam görünürlük.',
    href: '/uretim',
    tone: 'cyan',
    glow: 'rgba(6, 182, 212, 0.42)',
  },
  {
    id: 'stok',
    title: 'Stok & Depo',
    headline: 'Stoklarınızı anlık yönetin.',
    body: 'Barkod, raf, transfer ve çoklu depo — stok hareketleri anında güncellenir.',
    href: '/stok',
    tone: 'orange',
    glow: 'rgba(249, 115, 22, 0.4)',
  },
  {
    id: 'lojistik',
    title: 'Lojistik',
    headline: 'Sevkiyat ve lojistik süreçlerini yönetin.',
    body: 'Palet, tır, koli ve canlı sevkiyat durumları tek panelden izlenir.',
    href: '/lojistik',
    tone: 'green',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  {
    id: 'finans',
    title: 'Finans',
    headline: 'Finansal süreçlerinizi kontrol altında tutun.',
    body: 'Cari, kasa, banka, e-fatura ve raporlar aynı finans dilinde birleşir.',
    href: '/finans',
    tone: 'indigo',
    glow: 'rgba(99, 102, 241, 0.42)',
  },
  {
    id: 'studio',
    title: 'Bachmain Studio',
    headline: 'Kendi web sitenizi kod yazmadan oluşturun.',
    body: 'Sürükle-bırak editör, şablonlar ve SEO paneli ile markanızı yayına alın.',
    href: '/studio',
    tone: 'pink',
    glow: 'rgba(236, 72, 153, 0.38)',
  },
]

export const TRUST_POINTS = [
  { label: 'Bulut altyapı', value: '%99.9 uptime' },
  { label: 'Veri güvenliği', value: 'KVKK uyumlu' },
  { label: 'Ölçeklenebilir', value: 'KOBİ → Enterprise' },
  { label: 'Destek', value: '7/24 teknik ekip' },
]
