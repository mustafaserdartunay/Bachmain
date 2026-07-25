/**
 * Design tokens — BachMain Pricing (reference-locked)
 * Source: ChatGPT_Image pricing mockup + UI brief
 */
export const pricingTokens = {
  colors: {
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    orange: '#FFB000',
    background: '#F8FAFC',
    white: '#FFFFFF',
    dark: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
  },
  layout: {
    container: 1600,
    gap: 32,
    sectionY: 120,
    cardPadding: 40,
    cardRadius: 32,
    buttonRadius: 18,
    inputRadius: 18,
    controlHeight: 58,
  },
  shadow: {
    card: '0 20px 60px rgba(15,23,42,0.08)',
    cardHover: '0 35px 90px rgba(37,99,235,0.18)',
  },
  type: {
    heading: { size: 72, weight: 800, lineHeight: 1.1 },
    sub: { size: 24, weight: 600, lineHeight: 1.45 },
    paragraph: { size: 18, weight: 500, lineHeight: 1.5 },
    body: { size: 16, weight: 400, lineHeight: 1.5 },
    small: { size: 14, weight: 500, lineHeight: 1.45 },
    button: { size: 16, weight: 700 },
  },
} as const

/** Copy + prices locked to reference mockup */
export const referencePricingPlans = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Küçük işletmeler için başlangıç paketi.',
    price: 499,
    period: '/aylık',
    features: [
      'Teklif & Sipariş Yönetimi',
      'Cari & Fatura Yönetimi',
      'Stok Takibi',
      'Temel Raporlar',
      'E-posta Desteği',
    ],
    cta: 'Başla',
    to: '/register?plan=starter',
    theme: 'light' as const,
    mascot: '/bachy/bachy-starter.png',
    mascotAlt: 'Bachy Starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Büyüyen işletmeler için en ideal paket.',
    price: 1499,
    period: '/aylık',
    badge: 'EN POPÜLER',
    features: [
      'Starter tüm özellikleri',
      'Üretim Yönetimi',
      'Depo & Lojistik',
      'Gelişmiş Raporlar',
      'WhatsApp Entegrasyonu',
      'Öncelikli Destek',
    ],
    cta: 'Hemen Başla',
    to: '/register?plan=pro',
    theme: 'featured' as const,
    mascot: '/bachy/bachy-pro.png',
    mascotAlt: 'Bachy Pro',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Büyük ölçekli işletmeler için sınırsız çözüm.',
    price: 4999,
    period: '/aylık',
    features: [
      'Pro tüm özellikleri',
      'Sınırsız Kullanıcı',
      'Özel Raporlamalar',
      'API & Entegrasyon',
      'Özel Geliştirme',
      '7/24 VIP Destek',
    ],
    cta: 'Hemen Başla',
    to: '/register?plan=enterprise',
    theme: 'dark' as const,
    mascot: '/bachy/bachy-enterprise.png',
    mascotAlt: 'Bachy Enterprise',
  },
] as const
