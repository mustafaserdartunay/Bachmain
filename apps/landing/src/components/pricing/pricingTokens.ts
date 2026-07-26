/**
 * Design tokens — BachMain Pricing
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

export type BillingPeriod = 'month' | 'year'

/** Tek full paketteki tüm özellikler */
export const fullPackageFeatures = [
  'Teklif & Sipariş Yönetimi',
  'Müşteriler / Cari Kartlar',
  'Satış Faturaları & Tahsilat',
  'Stok, Depo & Transfer',
  'Üretim Takibi',
  'İrsaliye & Fiyat Listeleri',
  'Maliyet Hesaplama',
  'Tedarikçiler & Giderler',
  'Kasa, Banka, Çek & Senet',
  'E-Fatura / E-Arşiv',
  'Mesaj Merkezi (WhatsApp / E-posta)',
  'Saha Satış & Temsilci Takibi',
  'Görevler, Randevu & Not Defteri',
  'Lojistik & Sevkiyat',
  'Analytics, KPI & Dashboard',
  'API & Entegrasyonlar',
  'Çoklu Şirket / Şube',
  'AI Modülleri',
  'Sınırsız Kullanıcı',
  '7/24 Destek',
] as const

export type FeatureGroup = {
  title: string
  items: readonly string[]
}

/** Tek paket — en iyi full çözüm */
export const referencePricingPlans = [
  {
    id: 'full',
    name: 'Enterprise Full Paket',
    description:
      'CRM, ERP, stok, üretim, finans ve entegrasyonların tamamı tek pakette. Tüm modüller açık.',
    price: 2990,
    /** Yıllık toplam = aylık × 12 × %20 indirim */
    yearlyTotal: Math.round(2990 * 12 * 0.8),
    yearlyDiscountPercent: 20,
    period: '/aylık',
    badge: 'FULL PAKET',
    kontorGift: 100,
    featureGroups: [
      {
        title: 'Pakete dahil',
        items: fullPackageFeatures,
      },
    ] as const satisfies readonly FeatureGroup[],
    cta: 'Satın Al',
    to: '/register?plan=full',
    theme: 'featured' as const,
    mascot: '/bachy/bachy-pro.webp',
    mascotAlt: 'Bachy Full',
  },
] as const

/** Ek kontör paketleri */
export const kontorPackages = [
  {
    id: 'kontor-100',
    amount: 100,
    price: 199,
    tagline: 'Düşük hacim',
    popular: false,
  },
  {
    id: 'kontor-300',
    amount: 300,
    price: 499,
    tagline: 'En çok tercih',
    popular: true,
  },
  {
    id: 'kontor-500',
    amount: 500,
    price: 799,
    tagline: 'Orta hacim',
    popular: false,
  },
  {
    id: 'kontor-1000',
    amount: 1000,
    price: 1499,
    tagline: 'Yoğun kullanım',
    popular: false,
  },
  {
    id: 'kontor-2500',
    amount: 2500,
    price: 3299,
    tagline: 'Yüksek hacim',
    popular: false,
  },
  {
    id: 'kontor-5000',
    amount: 5000,
    price: 5999,
    tagline: 'Kurumsal',
    popular: false,
  },
  {
    id: 'kontor-10000',
    amount: 10000,
    price: 9999,
    tagline: 'Kurumsal max',
    popular: false,
  },
] as const

export function planDisplayPrice(
  plan: (typeof referencePricingPlans)[number],
  period: BillingPeriod,
) {
  if (period === 'year') {
    const monthlyEquiv = Math.round(plan.yearlyTotal / 12)
    return {
      display: monthlyEquiv,
      listDisplay: plan.price,
      suffix: '/aylık',
      yearlyTotal: plan.yearlyTotal,
      discountPercent: plan.yearlyDiscountPercent ?? 20,
    }
  }
  return {
    display: plan.price,
    listDisplay: null as number | null,
    suffix: '/aylık',
    yearlyTotal: null as number | null,
    discountPercent: 0,
  }
}

export function planCheckoutAmount(
  plan: (typeof referencePricingPlans)[number],
  period: BillingPeriod,
) {
  return period === 'year' ? plan.yearlyTotal : plan.price
}

/** Örn. 2990 → "2.990,00₺" */
export function formatMoneyTry(value: number) {
  return `${Number(value).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}₺`
}
