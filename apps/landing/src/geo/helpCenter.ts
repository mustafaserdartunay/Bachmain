import type { AcademyLesson, DocPage, HelpArticle } from './types'

/** Module help-center usage guides */
export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: 'crm-kullanim',
    module: 'CRM',
    title: 'CRM kullanım rehberi',
    description: 'Müşteri kartı, fırsat, görev ve aktivite akışına giriş.',
    steps: [
      {
        title: 'Müşteri kartı oluşturun',
        body: 'Temel iletişim bilgilerini girin; tekrarlı kayıtları önlemek için vergi no / telefon ile arayın.',
      },
      {
        title: 'Fırsat ve pipeline kullanın',
        body: 'Aşamaları sade tutun. Her aşamada net çıkış kriteri tanımlayın.',
      },
      { title: 'Görev ve randevu bağlayın', body: 'Sorumlu kişi ve tarih olmadan takip kaybolur.' },
      {
        title: 'WhatsApp geçmişini kartta tutun',
        body: 'Mesajları müşteri kaydına bağlayarak ekip görünürlüğünü sağlayın.',
      },
    ],
    relatedPaths: [
      { label: 'CRM ürün', path: '/crm' },
      { label: 'CRM Knowledge', path: '/knowledge/crm' },
      { label: 'WhatsApp', path: '/whatsapp' },
    ],
  },
  {
    slug: 'erp-kullanim',
    module: 'ERP',
    title: 'ERP kullanım rehberi',
    description: 'Sipariş–stok–üretim–finans omurgasına başlangıç.',
    steps: [
      {
        title: 'Master data’yı temizleyin',
        body: 'Ürün, depo, cari ve fiyat listelerini standardize edin.',
      },
      {
        title: 'Siparişten stok etkisini açın',
        body: 'Rezervasyon ve çıkış kurallarını netleştirin.',
      },
      { title: 'Üretim bağını kurun', body: 'Sipariş kalemlerinden iş emri üretimini pilot edin.' },
      {
        title: 'Finans yansımalarını kontrol edin',
        body: 'Belge sonrası cari ve kasa hareketlerini doğrulayın.',
      },
    ],
    relatedPaths: [
      { label: 'ERP ürün', path: '/erp' },
      { label: 'ERP Knowledge', path: '/knowledge/erp' },
      { label: 'Stok', path: '/stok' },
    ],
  },
  {
    slug: 'muhasebe-kullanim',
    module: 'Muhasebe',
    title: 'Muhasebe kullanım rehberi',
    description: 'Ön muhasebe, cari ve belge akışı.',
    steps: [
      { title: 'Cari kartları ayırın', body: 'Müşteri/tedarikçi rollerini karıştırmayın.' },
      { title: 'Fatura–tahsilat bağını kurun', body: 'Açık kalemleri yaşlandırma ile izleyin.' },
      {
        title: 'E-belge durumunu takip edin',
        body: 'e-Fatura/e-Arşiv durumlarını operasyonla birlikte okuyun.',
      },
    ],
    relatedPaths: [
      { label: 'Muhasebe', path: '/muhasebe' },
      { label: 'E-Fatura', path: '/e-fatura' },
      { label: 'Cari rehber', path: '/knowledge/cari-hesap' },
    ],
  },
  {
    slug: 'uretim-kullanim',
    module: 'Üretim',
    title: 'Üretim kullanım rehberi',
    description: 'İş emri, malzeme ve aşama takibi.',
    steps: [
      { title: 'İş emri şablonunu sadeleştirin', body: 'Gereksiz aşamaları çıkarın.' },
      {
        title: 'Malzeme çıkışını bağlayın',
        body: 'Depo ile üretim aynı stok modelini kullanmalı.',
      },
      { title: 'Fotoğraflı takip kullanın', body: 'Kritik aşamalarda kanıt bırakın.' },
    ],
    relatedPaths: [
      { label: 'Üretim', path: '/uretim' },
      { label: 'Üretim Takibi', path: '/uretim-takibi' },
      { label: 'Depo', path: '/depo' },
    ],
  },
  {
    slug: 'depo-kullanim',
    module: 'Depo',
    title: 'Depo kullanım rehberi',
    description: 'Lokasyon, transfer, sayım.',
    steps: [
      { title: 'Lokasyon ağacını tanımlayın', body: 'Raf/koridor bilgisini abartmadan kurun.' },
      { title: 'Transferleri belgelendirin', body: 'Şubeler arası hareket kayıtsız olmasın.' },
      { title: 'Periyodik sayım planlayın', body: 'Kritik SKU’ları daha sık sayın.' },
    ],
    relatedPaths: [
      { label: 'Depo', path: '/depo' },
      { label: 'Stok', path: '/stok' },
      { label: 'Depo Knowledge', path: '/knowledge/depo' },
    ],
  },
  {
    slug: 'finans-kullanim',
    module: 'Finans',
    title: 'Finans kullanım rehberi',
    description: 'Kasa, banka, tahsilat görünürlüğü.',
    steps: [
      { title: 'Kasa/banka hesaplarını ayırın', body: 'Nakit ile bankayı karıştırmayın.' },
      { title: 'Tahsilat planı tutun', body: 'Vade ve yaşlandırmayı haftalık okuyun.' },
      { title: 'Dashboard KPI seçin', body: '3–5 gösterge yeterli başlangıçtır.' },
    ],
    relatedPaths: [
      { label: 'Finans', path: '/finans' },
      { label: 'Kasa', path: '/kasa' },
      { label: 'Dashboard', path: '/dashboard' },
    ],
  },
  {
    slug: 'lojistik-kullanim',
    module: 'Lojistik',
    title: 'Lojistik kullanım rehberi',
    description: 'Sevkiyat ve teslim penceresi.',
    steps: [
      { title: 'Sevkiyatı depo çıkışına bağlayın', body: 'Stok düşmeden sevkiyat kapanmasın.' },
      {
        title: 'Teslim durumlarını sade tutun',
        body: 'Yolda / teslim / iade gibi net durumlar kullanın.',
      },
    ],
    relatedPaths: [
      { label: 'Lojistik', path: '/lojistik' },
      { label: 'Sevkiyat', path: '/sevkiyat' },
      { label: 'Knowledge', path: '/knowledge/lojistik' },
    ],
  },
  {
    slug: 'whatsapp-kullanim',
    module: 'WhatsApp',
    title: 'WhatsApp CRM kullanım rehberi',
    description: 'Mesaj merkezini müşteri kartına bağlama.',
    steps: [
      { title: 'Numarayı cari/müşteri ile eşleştirin', body: 'Eşleşmeyen konuşmalar kaybolur.' },
      { title: 'Ekip ortak inbox kullansın', body: 'Kişisel telefon bağımlılığını azaltın.' },
      {
        title: 'Şablon mesajları sınırlı tutun',
        body: 'Spam algısı ve uyumluluk riskini yönetin.',
      },
    ],
    relatedPaths: [
      { label: 'WhatsApp', path: '/whatsapp' },
      { label: 'CRM', path: '/crm' },
      { label: 'Knowledge', path: '/knowledge/whatsapp' },
    ],
  },
  {
    slug: 'instagram-kullanim',
    module: 'Instagram',
    title: 'Instagram işletme iletişimi rehberi',
    description: 'Sosyal gelen kutusu ve CRM eşlemesi.',
    steps: [
      { title: 'DM’leri fırsat olarak sınıflayın', body: 'Her mesaj satış değildir; etiketleyin.' },
      { title: 'CRM kartına bağlayın', body: 'Tekrarlayan müşteriyi tanıyın.' },
    ],
    relatedPaths: [
      { label: 'Instagram', path: '/instagram' },
      { label: 'Sosyal Medya', path: '/sosyal-medya' },
      { label: 'Knowledge', path: '/knowledge/instagram' },
    ],
  },
  {
    slug: 'ai-asistan-kullanim',
    module: 'AI Asistan',
    title: 'AI Asistan kullanım rehberi',
    description: 'Yapay zekâyı özet, taslak ve sınıflandırmada güvenli kullanma.',
    steps: [
      {
        title: 'İnsan onayını kaldırın',
        body: 'Kritik müşteri/finans çıktılarında AI önerisini doğrulayın.',
      },
      { title: 'Bağlam verin', body: 'Modül verisi olmadan genel cevaplar zayıf kalır.' },
      {
        title: 'Gizlilik kurallarını uygulayın',
        body: 'Kişisel veriyi gereksiz yere modele taşımayın.',
      },
    ],
    relatedPaths: [
      { label: 'OpenAI', path: '/openai' },
      { label: 'AI Knowledge', path: '/knowledge/yapay-zeka' },
      { label: 'API Docs', path: '/docs/api' },
    ],
  },
]

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug)
}

export const ACADEMY_LESSONS: AcademyLesson[] = [
  {
    id: 'a1',
    title: 'İlk kurulum ve firma ayarları',
    level: 'Başlangıç',
    duration: '8 dk',
    module: 'Genel',
    summary: 'Hesap, logo, kullanıcı rolleri.',
    href: '/akademi/videolar',
  },
  {
    id: 'a2',
    title: 'CRM müşteri kartı ve pipeline',
    level: 'Başlangıç',
    duration: '12 dk',
    module: 'CRM',
    summary: 'Lead’den fırsata akış.',
    href: '/knowledge/crm',
  },
  {
    id: 'a3',
    title: 'Tekliften siparişe',
    level: 'Orta',
    duration: '14 dk',
    module: 'Satış',
    summary: 'Belge dönüşümü ve stok rezervasyonu.',
    href: '/knowledge/teklif',
  },
  {
    id: 'a4',
    title: 'Depo transferi ve sayım',
    level: 'Orta',
    duration: '10 dk',
    module: 'Depo',
    summary: 'Lokasyon ve transfer disiplini.',
    href: '/knowledge/depo',
  },
  {
    id: 'a5',
    title: 'Üretim iş emri ve fotoğraflı takip',
    level: 'Orta',
    duration: '16 dk',
    module: 'Üretim',
    summary: 'Aşama rayı ve kanıt.',
    href: '/knowledge/uretim-takibi',
  },
  {
    id: 'a6',
    title: 'Cari yaşlandırma okuma',
    level: 'Orta',
    duration: '9 dk',
    module: 'Finans',
    summary: 'Tahsilat önceliklendirme.',
    href: '/knowledge/cari-hesap',
  },
  {
    id: 'a7',
    title: 'E-Fatura durum takibi',
    level: 'Orta',
    duration: '11 dk',
    module: 'E-Fatura',
    summary: 'Belge yaşam döngüsü.',
    href: '/knowledge/e-fatura',
  },
  {
    id: 'a8',
    title: 'WhatsApp mesaj merkezi',
    level: 'Başlangıç',
    duration: '10 dk',
    module: 'WhatsApp',
    summary: 'Ortak inbox.',
    href: '/knowledge/whatsapp',
  },
  {
    id: 'a9',
    title: 'Dashboard KPI seçimi',
    level: 'İleri',
    duration: '13 dk',
    module: 'Raporlama',
    summary: 'Az ama öz metrik.',
    href: '/knowledge/dashboard',
  },
  {
    id: 'a10',
    title: 'AI asistanı güvenli kullanma',
    level: 'İleri',
    duration: '12 dk',
    module: 'AI',
    summary: 'Onaylı otomasyon.',
    href: '/knowledge/yapay-zeka',
  },
]

export const API_DOC: DocPage = {
  slug: 'api',
  title: 'BachMain API Dokümantasyonu',
  description: 'REST API ile kayıt okuma/yazma, kimlik doğrulama ve webhook temelleri.',
  sections: [
    {
      id: 'auth',
      title: 'Kimlik doğrulama',
      paragraphs: [
        'API erişimi API anahtarı veya OAuth benzeri token ile yapılır. Anahtarları istemci tarafına gömmeyin; sunucu ortam değişkenlerinde tutun.',
        'Her istekte yetki kapsamı (scope) kontrol edilir. Yazma işlemleri için ayrı izin önerilir.',
      ],
    },
    {
      id: 'resources',
      title: 'Kaynaklar',
      paragraphs: [
        'Tipik kaynaklar: müşteriler/cariler, ürünler/SKU, siparişler, stok hareketleri, faturalar.',
        'Liste uçları sayfalama (cursor/limit) destekler. Büyük aktarımlarda toplu (batch) yerine sayfalı çekim tercih edin.',
      ],
      bullets: [
        'GET /v1/customers',
        'GET /v1/products',
        'POST /v1/orders',
        'GET /v1/stock-movements',
      ],
    },
    {
      id: 'webhooks',
      title: 'Webhook’lar',
      paragraphs: [
        'Sipariş oluşumu, stok kritik seviye veya belge durumu gibi olaylarda HTTPS uç noktanıza POST gönderilir.',
        'İmza doğrulaması yapın; yeniden deneme (retry) senaryolarında idempotent işleyin.',
      ],
    },
  ],
}

export const DEVELOPER_DOC: DocPage = {
  slug: 'developers',
  title: 'Geliştirici Dokümantasyonu',
  description: 'Entegrasyon mimarisi, hata kodları, ortamlar ve en iyi uygulamalar.',
  sections: [
    {
      id: 'architecture',
      title: 'Entegrasyon mimarisi',
      paragraphs: [
        'BachMain’i tek yönlü veri pompası gibi kullanmayın. Kaynak sistem (system of record) net olsun.',
        'Senkron sıklığını iş ihtiyacına göre ayarlayın; gereksiz anlık senkron maliyeti artırır.',
      ],
    },
    {
      id: 'errors',
      title: 'Hata yönetimi',
      paragraphs: [
        '4xx istemci, 5xx sunucu hatalarını ayırın. 429 için backoff uygulayın.',
        'İş kuralı hatalarını (stok yetersiz, yetki yok) kullanıcıya anlaşılır mesajla yansıtın.',
      ],
    },
    {
      id: 'security',
      title: 'Güvenlik',
      paragraphs: [
        'HTTPS zorunlu, anahtar rotasyonu planlı, kişisel veride minimizasyon ilkesi uygulayın.',
        'Log’lara token ve parola yazmayın.',
      ],
    },
  ],
}
