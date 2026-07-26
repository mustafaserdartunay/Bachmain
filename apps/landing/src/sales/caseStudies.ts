import type { CaseStudy, ReferenceLogo } from './types'

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'mobilya-uretim-hizlandirma',
    company: 'Anadolu Mobilya (örnek senaryo)',
    sector: 'Mobilya',
    title: 'Siparişten sevkiyata süre nasıl kısaldı?',
    problem: 'Ölçüye özel işlerde üretim durumu belirsizdi; müşteri bilgilendirmesi gecikiyordu.',
    solution: 'BachMain üretim takibi, depo ve CRM bildirimleri aynı omurgaya alındı.',
    results: ['Aşama görünürlüğü arttı', 'Müşteri soru trafiği azaldı', 'Sevkiyat planı netleşti'],
    metrics: [
      {
        label: 'Çevrim süresi',
        value: '%28↓',
      },
      {
        label: 'Stok sayım sapması',
        value: '%41↓',
      },
      {
        label: 'Haftalık rapor hazırlığı',
        value: '6s → 45dk',
      },
      {
        label: 'Tahmini ROI (12 ay)',
        value: '3.2x',
      },
    ],
    relatedModules: ['/uretim', '/depo', '/crm'],
  },
  {
    slug: 'toptan-cari-tahsilat',
    company: 'Ege Toptan (örnek senaryo)',
    sector: 'Toptan Satış',
    title: 'Cari yaşlandırma ile tahsilat disiplini',
    problem: 'Açık bakiyeler Excel’de izleniyor, vade aşımı geç fark ediliyordu.',
    solution:
      'Cari, e-fatura ve finans paneli birleştirildi; yaşlandırma haftalık ritüele bağlandı.',
    results: ['Vadesi geçen alacak görünür oldu', 'Tahsilat görüşmeleri önceliklendi'],
    metrics: [
      {
        label: 'Ort. tahsilat günü',
        value: '%19↓',
      },
      {
        label: 'Açık fatura takibi',
        value: 'Anlık',
      },
      {
        label: 'Manuel ekstre işi',
        value: '%60↓',
      },
      {
        label: 'Operasyonel verim',
        value: '+22%',
      },
    ],
    relatedModules: ['/cari', '/finans', '/e-fatura'],
  },
  {
    slug: 'whatsapp-crm-satis',
    company: 'Marmara Dağıtım (örnek senaryo)',
    sector: 'Saha Satış',
    title: 'WhatsApp CRM ile kayıp lead azaltma',
    problem: 'Yazışmalar kişisel telefonlarda kalıyor, ekip devri yapılamıyordu.',
    solution: 'Mesaj merkezi müşteri kartına bağlandı; görev ve teklif aynı panelde.',
    results: ['Ortak inbox', 'Teklif dönüşümünde artış'],
    metrics: [
      {
        label: 'Yanıt süresi',
        value: '%35↓',
      },
      {
        label: 'Kayıp konuşma',
        value: '%50↓',
      },
      {
        label: 'Teklife dönüşüm',
        value: '+18%',
      },
      {
        label: 'Zaman tasarrufu / hafta',
        value: '~8 saat',
      },
    ],
    relatedModules: ['/whatsapp', '/crm', '/teklif'],
  },
]

export const REFERENCES: ReferenceLogo[] = [
  { name: 'Anadolu Üretim A.Ş.', sector: 'Üretim', quote: 'Süreçler tek panelde görünür oldu.' },
  { name: 'Ege Toptan', sector: 'Toptan', quote: 'Cari ve tahsilat netleşti.' },
  { name: 'Marmara Dağıtım', sector: 'Saha', quote: 'WhatsApp artık ekip işi.' },
  { name: 'Nilüfer Tekstil', sector: 'Tekstil', quote: 'SKU karmaşası azaldı.' },
  { name: 'Nova Medikal', sector: 'Medikal', quote: 'Lot izi güçlendi.' },
  { name: 'Atlas Lojistik', sector: 'Lojistik', quote: 'Teslim durumu şeffaf.' },
]

export function getCaseStudy(slug: string) {
  return CASE_STUDIES.find((c) => c.slug === slug)
}
