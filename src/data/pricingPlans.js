/** CRM paket kataloğu — web pricing ile aynı fiyat/özellik yüzeyi */

export const CRM_PRICING_PLANS = [
  {
    id: 'starter',
    plan: 'Starter',
    tagline: 'Küçük ekipler ve yeni başlayan firmalar',
    prices: { month: 990, year: 9900 },
    users: '3 kullanıcı',
    storage: '2 GB depolama',
    featured: false,
    badge: null,
    features: [
      'CRM, teklif & sipariş',
      'Cari, görev ve takvim',
      'Temel dashboard & raporlar',
      '7 gün ücretsiz deneme',
      'E-posta desteği',
    ],
    details: [
      {
        title: 'Müşteri ve satış temeli',
        body: 'Müşteri kartları, teklif ve sipariş akışını tek yerden yönetin. Küçük ekipler için net bir satış hattı kurar; gereksiz modül yükü olmadan günlük işinizi hızlandırır.',
      },
      {
        title: 'Planlama ve takip',
        body: 'Görev, takvim, randevu ve not defteri ile ekip içi koordinasyonu sürdürün. Temel dashboard ve raporlarla haftalık performansı kolayca görün.',
      },
      {
        title: 'Kimler için?',
        body: 'Yeni kurulan firmalar, 1–3 kişilik satış/ofis ekipleri ve BACHMAIN’i denemek isteyen işletmeler için ideal başlangıç paketidir.',
      },
    ],
  },
  {
    id: 'professional',
    plan: 'Professional',
    tagline: 'Büyüyen KOBİ’ler için operasyon paketi',
    prices: { month: 2490, year: 24900 },
    users: '25 kullanıcı',
    storage: '100 GB depolama',
    featured: true,
    badge: 'En Popüler',
    features: [
      'Tüm Starter özellikleri',
      'Stok, depo, üretim & POS',
      'Finans, e-Fatura & e-İrsaliye',
      'Saha satış, B2B & WhatsApp',
      'Öncelikli destek',
    ],
    details: [
      {
        title: 'Operasyon ve stok',
        body: 'Stok, depo, barkod, üretim ve POS ile mağaza / saha / depo süreçlerini tek platformda bağlayın. Satın alma ve satış hareketlerini anlık takip edin.',
      },
      {
        title: 'Finans ve e-belge',
        body: 'Finans, e-Fatura, e-Arşiv ve e-İrsaliye ile resmi belge süreçlerini panelden yürütün. Cari ve nakit akışını operasyonla senkron tutun.',
      },
      {
        title: 'Saha, B2B ve iletişim',
        body: 'Saha satış, bayi, B2B portal, WhatsApp ve SMS ile müşteriye her kanalda ulaşın. Öncelikli destek ile büyüyen ekiplerin kesintisiz çalışmasını hedefleyin.',
      },
    ],
  },
  {
    id: 'enterprise',
    plan: 'Enterprise',
    tagline: 'Kurumsal ölçek ve özel ihtiyaçlar',
    prices: { month: 4990, year: 49900 },
    users: 'Sınırsız kullanıcı',
    storage: 'Sınırsız depolama',
    featured: false,
    badge: null,
    features: [
      'Tüm Professional özellikleri',
      'AI, BI & gelişmiş API',
      'MRP, HR & iş akışları',
      'Çoklu şirket / şube / depo',
      'SLA & özel müşteri temsilcisi',
    ],
    details: [
      {
        title: 'Kurumsal kontrol',
        body: 'Çoklu şirket, şube, depo ve para birimi ile grup şirketlerini tek merkezden yönetin. Onay süreçleri, iş akışları ve HR ile kurumsal disiplin kurun.',
      },
      {
        title: 'İleri planlama ve istihbarat',
        body: 'MRP, kalite, BI dashboard ve yapay zeka asistanı ile üretim planlamasını ve karar destekini güçlendirin. Gelişmiş API ve webhook ile sistemlerinizi bağlayın.',
      },
      {
        title: 'Lojistik ve SLA',
        body: 'Tır, palet, koli, paket ve konteyner yönetimi ile sevkiyat ölçeğini büyütün. SLA ve özel müşteri temsilcisi ile kurumsal destek standartlarını güvenceye alın.',
      },
    ],
  },
]

export function formatTry(amount) {
  return `₺${Number(amount).toLocaleString('tr-TR')}`
}

/** Studio is sold separately from the CRM/ERP packages. */
export const STUDIO_PRICING_PLAN = {
  id: 'studio',
  plan: 'Bachmain Studio',
  tagline: 'Web sitesi tasarımı ve yayın — uygulamadan bağımsız',
  prices: { month: 790, year: 7900 },
  users: 'Sınırsız site',
  storage: '20 GB medya',
  featured: true,
  badge: 'Ayrı ürün',
  features: [
    '7 gün ücretsiz deneme',
    'Kendi workspace’iniz — başka hesapların verisi yok',
    'Şablonlar, yayın ve domain',
    'uygulama.bachmain.com/studio',
    'studio@bachmain.com kimliği',
  ],
  details: [
    {
      title: 'Uygulamadan ayrı',
      body: 'Bachmain uygulamasını ve Studio’yu ayrı ayrı satın alabilirsiniz. Studio üyeliği CRM paketini zorunlu kılmaz.',
    },
    {
      title: 'Temiz başlangıç',
      body: 'Her yeni Studio kullanıcısı kendi boş çalışma alanıyla açılır. Siteler, şablon seçimleri ve ayarlar yalnızca size aittir.',
    },
  ],
}

export function checkoutPath(planId, period = 'month') {
  return `/profil/odeme?plan=${encodeURIComponent(planId)}&period=${encodeURIComponent(period)}`
}
