import type { PageSeo } from './buildMetadata'
import { SEO_CONTENT } from './contentCatalog'

/** Related module graph for internal linking & AI semantic association (short URLs). */
export const MODULE_GRAPH = {
  crm: {
    name: 'CRM',
    path: '/crm',
    related: ['/teklif', '/siparis', '/uretim', '/whatsapp'],
  },
  erp: {
    name: 'ERP',
    path: '/erp',
    related: ['/crm', '/stok', '/uretim', '/finans'],
  },
  stock: {
    name: 'Depo & Stok',
    path: '/stok',
    related: ['/depo', '/uretim', '/lojistik', '/finans'],
  },
  finance: {
    name: 'Finans & Muhasebe',
    path: '/finans',
    related: ['/muhasebe', '/cari', '/e-fatura', '/raporlar'],
  },
  reports: {
    name: 'Raporlama & Analitik',
    path: '/raporlar',
    related: ['/dashboard', '/crm', '/finans', '/uretim'],
  },
  production: {
    name: 'Üretim',
    path: '/uretim',
    related: ['/depo', '/lojistik', '/uretim-takibi', '/stok'],
  },
  ecommerce: {
    name: 'E-Ticaret',
    path: '/siparis',
    related: ['/stok', '/crm', '/e-fatura', '/finans'],
  },
  fieldSales: {
    name: 'Saha Satış',
    path: '/saha-satis',
    related: ['/crm', '/stok', '/finans', '/bayi'],
  },
  eInvoice: {
    name: 'E-Fatura',
    path: '/e-fatura',
    related: ['/muhasebe', '/cari', '/finans', '/fiyatlar'],
  },
  whatsapp: {
    name: 'WhatsApp & Mesaj Merkezi',
    path: '/whatsapp',
    related: ['/crm', '/sosyal-medya', '/saha-satis', '/demo'],
  },
  hr: {
    name: 'İnsan Kaynakları',
    path: '/insan-kaynaklari',
    related: ['/saha-satis', '/erp', '/raporlar'],
  },
  logistics: {
    name: 'Lojistik & Nakliye',
    path: '/lojistik',
    related: ['/sevkiyat', '/depo', '/uretim', '/paketleme'],
  },
  ai: {
    name: 'Yapay Zeka',
    path: '/openai',
    related: ['/crm', '/raporlar', '/dashboard', '/fiyatlar'],
  },
} as const

/** Old path → new short URL (backwards compatibility / redirects). */
export const SEO_PATH_REDIRECTS: Record<string, string> = {
  '/Business': '/',
  '/business': '/',
  '/features/crm': '/crm',
  '/features/erp': '/erp',
  '/features/stock': '/stok',
  '/features/finance': '/finans',
  '/features/reports': '/raporlar',
  '/modules/production': '/uretim',
  '/modules/field-sales': '/saha-satis',
  '/modules/ecommerce': '/siparis',
  '/e-invoice': '/e-fatura',
  '/pricing': '/fiyatlar',
  '/login': '/giris',
  '/register': '/uye-ol',
  '/contact': '/iletisim',
}

/** Legacy / support pages not in the 37-path SEO catalog. */
const LEGACY_PAGE_SEO: Record<string, PageSeo> = {
  '/features': {
    path: '/features',
    title: 'Özellikler — CRM, ERP, Stok, Finans ve Daha Fazlası',
    description:
      'BACHMAIN özelliklerini keşfedin: CRM, ERP, stok/depo, finans, raporlama, WhatsApp mesaj merkezi ve yapay zeka destekli iş yönetimi.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Özellikler', path: '/features' },
    ],
  },
  '/modules': {
    path: '/modules',
    title: 'Sektörel Modüller — Üretim, E-Ticaret, Saha Satış',
    description:
      'Üretim takibi, e-ticaret, saha satış GPS, lojistik ve daha fazlası. BACHMAIN sektör modülleriyle büyüyün.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Modüller', path: '/modules' },
    ],
  },
  '/modules/ecommerce': {
    path: '/modules/ecommerce',
    title: 'E-Ticaret Entegrasyonu — Sipariş, Stok, Fatura',
    description:
      'Online siparişleri stok, fatura ve kargo süreçleriyle senkronize edin. BACHMAIN e-ticaret modülü.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Modüller', path: '/modules' },
      { name: 'E-Ticaret', path: '/modules/ecommerce' },
    ],
  },
  '/help': {
    path: '/help',
    title: 'Yardım Merkezi — Rehberler ve Destek',
    description:
      'Kurulum, modül eğitimleri ve destek kaynakları. BACHMAIN Yardım Merkezi ile hızlı çözüm bulun.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Yardım Merkezi', path: '/help' },
    ],
  },
  '/faq': {
    path: '/faq',
    title: 'Sık Sorulan Sorular — Deneme, KVKK, Modüller',
    description:
      'Ücretsiz deneme, güvenlik, KVKK, e-fatura, B2B portal ve fiyatlandırma hakkında sık sorulan sorular.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'SSS', path: '/faq' },
    ],
  },
  '/egitim': {
    path: '/egitim',
    title: 'Eğitimler — CRM, ERP, Stok ve Üretim Videoları',
    description:
      'BACHMAIN eğitim merkezi: kurulum, CRM, stok, üretim, saha satış ve finans modül eğitimleri.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Eğitimler', path: '/egitim' },
    ],
  },
  '/sifremi-unuttum': {
    path: '/sifremi-unuttum',
    title: 'Şifremi Unuttum',
    description: 'BACHMAIN şifre sıfırlama talebi oluşturun.',
    noIndex: true,
  },
  '/sifre-sifirla': {
    path: '/sifre-sifirla',
    title: 'Şifre Sıfırla',
    description: 'BACHMAIN yeni şifrenizi belirleyin.',
    noIndex: true,
  },
  '/gizlilik': {
    path: '/gizlilik',
    title: 'Gizlilik Politikası',
    description:
      'BACHMAIN gizlilik politikası: kişisel verilerin işlenmesi, saklanması ve haklarınız hakkında bilgilendirme.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Gizlilik Politikası', path: '/gizlilik' },
    ],
  },
  '/kvkk': {
    path: '/kvkk',
    title: 'KVKK Aydınlatma Metni',
    description:
      '6698 sayılı KVKK kapsamında BACHMAIN aydınlatma metni. Veri sorumlusu, işlenen veriler ve haklarınız.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'KVKK', path: '/kvkk' },
    ],
  },
  '/kullanim-kosullari': {
    path: '/kullanim-kosullari',
    title: 'Kullanım Koşulları',
    description:
      'BACHMAIN kullanım koşulları: hesap, güvenlik, kabul edilemez kullanım ve sorumluluk.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Kullanım Koşulları', path: '/kullanim-kosullari' },
    ],
  },
  '/hizmet-sozlesmesi': {
    path: '/hizmet-sozlesmesi',
    title: 'Hizmet Sözleşmesi',
    description: 'BACHMAIN abonelik hizmet sözleşmesi: ücret, süre, destek ve fesih hükümleri.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Hizmet Sözleşmesi', path: '/hizmet-sozlesmesi' },
    ],
  },
  '/gizlilik-politikasi': {
    path: '/gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    description:
      'BACHMAIN gizlilik politikası: kişisel verilerin işlenmesi, saklanması ve haklarınız.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Gizlilik Politikası', path: '/gizlilik-politikasi' },
    ],
  },
  '/kvkk-aydinlatma-metni': {
    path: '/kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    description: 'KVKK kapsamında BACHMAIN aydınlatma metni ve ilgili kişi hakları.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'KVKK Aydınlatma Metni', path: '/kvkk-aydinlatma-metni' },
    ],
  },
  '/cerez-politikasi': {
    path: '/cerez-politikasi',
    title: 'Çerez Politikası',
    description: 'BACHMAIN çerez politikası: zorunlu, tercih, istatistik ve pazarlama çerezleri.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Çerez Politikası', path: '/cerez-politikasi' },
    ],
  },
  '/acik-riza-metni': {
    path: '/acik-riza-metni',
    title: 'Açık Rıza Metni',
    description: 'BACHMAIN açık rıza metni: pazarlama ve iletişim rızası, geri alma hakkı.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Açık Rıza Metni', path: '/acik-riza-metni' },
    ],
  },
  '/elektronik-ileti-onayi': {
    path: '/elektronik-ileti-onayi',
    title: 'Elektronik İleti Onayı',
    description: 'Ticari elektronik ileti onayı ve ret hakları (6563 sayılı Kanun).',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Elektronik İleti Onayı', path: '/elektronik-ileti-onayi' },
    ],
  },
  '/iptal-iade-politikasi': {
    path: '/iptal-iade-politikasi',
    title: 'İptal / İade Politikası',
    description: 'BACHMAIN abonelik iptal, cayma ve iade politikası.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'İptal / İade Politikası', path: '/iptal-iade-politikasi' },
    ],
  },
  '/demo-kullanim-kosullari': {
    path: '/demo-kullanim-kosullari',
    title: 'Demo Kullanım Koşulları',
    description: 'BACHMAIN demo hesap kullanım şartları, süre ve veri politikası.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Demo Kullanım Koşulları', path: '/demo-kullanim-kosullari' },
    ],
  },
  '/veri-guvenligi': {
    path: '/veri-guvenligi',
    title: 'Veri Güvenliği',
    description: 'BACHMAIN teknik ve idari veri güvenliği tedbirleri.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Veri Güvenliği', path: '/veri-guvenligi' },
    ],
  },
  '/lisans-sozlesmesi': {
    path: '/lisans-sozlesmesi',
    title: 'Lisans Sözleşmesi',
    description: 'BACHMAIN yazılım lisans koşulları ve kullanım kısıtları.',
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Lisans Sözleşmesi', path: '/lisans-sozlesmesi' },
    ],
  },
}

function aliasFromRedirect(oldPath: string, newPath: string): PageSeo | null {
  const target = SEO_CONTENT[newPath]
  if (!target) return null
  return {
    ...target,
    path: oldPath,
    /** Prefer short Turkish URL in canonical (avoids duplicate-content signals). */
    canonicalPath: newPath,
    /** Alias HTML should not compete if served without the Vercel 301. */
    noIndex: true,
    breadcrumbs: target.breadcrumbs,
  }
}

const REDIRECT_ALIASES: Record<string, PageSeo> = {}
for (const [from, to] of Object.entries(SEO_PATH_REDIRECTS)) {
  const aliased = aliasFromRedirect(from, to)
  if (aliased) REDIRECT_ALIASES[from] = aliased
}

/**
 * PAGE_SEO prefers SEO_CONTENT (37 short URLs), keeps legacy support pages,
 * and aliases old paths for backwards-compatible metadata lookups.
 */
export const PAGE_SEO: Record<string, PageSeo> = {
  ...LEGACY_PAGE_SEO,
  ...REDIRECT_ALIASES,
  ...SEO_CONTENT,
}

export const BLOG_SEO: Record<string, PageSeo> = {
  'erp-gecis-rehberi': {
    path: '/blog/erp-gecis-rehberi',
    title: 'ERP Geçiş Rehberi: 7 Adımda Başarı',
    description: 'KOBİ’ler için ERP geçişinde dikkat edilmesi gerekenler. BACHMAIN blog rehberi.',
    ogType: 'article',
    publishedTime: '2026-06-12',
    authors: ['BACHMAIN'],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'ERP Geçiş Rehberi', path: '/blog/erp-gecis-rehberi' },
    ],
  },
  'b2b-portal-onemi': {
    path: '/blog/b2b-portal-onemi',
    title: 'B2B Portal Neden Kritik?',
    description: 'Müşterilerinizin self-servis beklentisi ve BACHMAIN B2B portal çözümü.',
    ogType: 'article',
    publishedTime: '2026-06-08',
    authors: ['BACHMAIN'],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'B2B Portal', path: '/blog/b2b-portal-onemi' },
    ],
  },
  'stok-yonetimi-ipuclari': {
    path: '/blog/stok-yonetimi-ipuclari',
    title: 'Stok Yönetiminde 5 Altın Kural',
    description: 'Depo verimliliğini artıran pratik stok yönetimi önerileri. BACHMAIN blog.',
    ogType: 'article',
    publishedTime: '2026-06-01',
    authors: ['BACHMAIN'],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'Stok Yönetimi', path: '/blog/stok-yonetimi-ipuclari' },
    ],
  },
  'e-fatura-2026': {
    path: '/blog/e-fatura-2026',
    title: '2026 E-Fatura Zorunlulukları',
    description: 'GİB düzenlemeleri ve uyum takvimi. 2026 e-fatura zorunlulukları rehberi.',
    ogType: 'article',
    publishedTime: '2026-05-28',
    authors: ['BACHMAIN'],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'E-Fatura 2026', path: '/blog/e-fatura-2026' },
    ],
  },
  'saha-satis-dijital': {
    path: '/blog/saha-satis-dijital',
    title: 'Saha Satışta Dijital Dönüşüm',
    description: 'Mobil CRM ile saha ekibi verimliliği. GPS, rota ve tahsilat dijitalleşmesi.',
    ogType: 'article',
    publishedTime: '2026-05-20',
    authors: ['BACHMAIN'],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'Saha Satış', path: '/blog/saha-satis-dijital' },
    ],
  },
  'uretim-takip': {
    path: '/blog/uretim-takip',
    title: 'Üretim Takibinde Canlı Panel',
    description: 'Müşteriye anlık üretim görünürlüğü ve fotoğraflı süreç takibi.',
    ogType: 'article',
    publishedTime: '2026-05-15',
    authors: ['BACHMAIN'],
    breadcrumbs: [
      { name: 'Ana Sayfa', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: 'Üretim Takibi', path: '/blog/uretim-takip' },
    ],
  },
}

/** Indexable paths for sitemap (excludes auth/noIndex). Prefers SEO_CONTENT short URLs. */
export function getSitemapEntries(): Array<{
  path: string
  changeFrequency: 'daily' | 'weekly' | 'monthly'
  priority: number
}> {
  const seen = new Set<string>()
  const entries: Array<{
    path: string
    changeFrequency: 'daily' | 'weekly' | 'monthly'
    priority: number
  }> = []

  const push = (
    page: PageSeo,
    changeFrequency: 'daily' | 'weekly' | 'monthly',
    priority: number,
  ) => {
    if (page.noIndex || seen.has(page.path)) return
    seen.add(page.path)
    entries.push({ path: page.path, changeFrequency, priority })
  }

  for (const page of Object.values(SEO_CONTENT)) {
    const priority =
      page.path === '/'
        ? 1
        : page.path === '/studio'
          ? 0.98
          : page.path === '/fiyatlar' || page.path === '/crm' || page.path === '/erp'
            ? 0.95
            : page.path === '/blog' || page.path === '/demo'
              ? 0.85
              : page.path === '/giris' || page.path === '/uye-ol'
                ? 0.3
                : 0.9
    push(page, page.path === '/' || page.path === '/blog' ? 'daily' : 'weekly', priority)
  }

  for (const page of Object.values(LEGACY_PAGE_SEO)) {
    push(page, 'weekly', page.path === '/features' || page.path === '/modules' ? 0.7 : 0.6)
  }

  for (const post of Object.values(BLOG_SEO)) {
    push(post, 'monthly', 0.65)
  }

  const salesHubs: PageSeo[] = [
    { path: '/sektorler', title: 'Sektörler', description: 'Sektörel çözümler' },
    { path: '/referanslar', title: 'Referanslar', description: 'Referanslar' },
    { path: '/basari-hikayeleri', title: 'Başarı Hikayeleri', description: 'Case studies' },
  ]
  for (const page of salesHubs) push(page, 'weekly', 0.85)

  const sectorSlugs = [
    'mobilya',
    'makine',
    'tekstil',
    'gida',
    'otomotiv',
    'insaat',
    'e-ticaret',
    'toptan-satis',
    'perakende',
    'medikal',
    'lojistik-sektor',
    'uretim-sektor',
    'kimya',
    'ambalaj',
    'elektronik',
  ]
  for (const slug of sectorSlugs) {
    push({ path: `/sektorler/${slug}`, title: slug, description: 'Sektör' }, 'monthly', 0.75)
  }
  for (const slug of ['mobilya-uretim-hizlandirma', 'toptan-cari-tahsilat', 'whatsapp-crm-satis']) {
    push({ path: `/basari-hikayeleri/${slug}`, title: slug, description: 'Case' }, 'monthly', 0.7)
  }

  // GEO hubs (Knowledge, Help, Akademi, Docs, SSS)
  const geoHubs: PageSeo[] = [
    {
      path: '/knowledge',
      title: 'Knowledge Base',
      description: 'BachMain Knowledge Base',
    },
    {
      path: '/sss',
      title: 'SSS Merkezi',
      description: 'BachMain SSS',
    },
    {
      path: '/help-center',
      title: 'Yardım Merkezi',
      description: 'BachMain Yardım',
    },
    {
      path: '/akademi',
      title: 'Akademi',
      description: 'BachMain Akademi',
    },
    {
      path: '/akademi/videolar',
      title: 'Video Eğitim',
      description: 'BachMain Videolar',
    },
    {
      path: '/docs',
      title: 'Docs',
      description: 'BachMain Docs',
    },
    {
      path: '/docs/api',
      title: 'API',
      description: 'BachMain API',
    },
    {
      path: '/docs/developers',
      title: 'Developers',
      description: 'BachMain Developers',
    },
    {
      path: '/sozluk',
      title: 'Sözlük',
      description: 'BachMain Sözlük',
    },
    {
      path: '/blog/konular',
      title: 'Blog Konuları',
      description: 'Blog konu planı',
    },
  ]
  for (const page of geoHubs) {
    push(page, 'weekly', 0.8)
  }

  try {
    // Dynamic import avoided — static list of knowledge slugs mirrored for sitemap stability
    const knowledgeSlugs = [
      'crm',
      'erp',
      'muhasebe',
      'e-fatura',
      'teklif',
      'siparis',
      'uretim',
      'uretim-takibi',
      'depo',
      'stok',
      'cari-hesap',
      'finans',
      'lojistik',
      'insan-kaynaklari',
      'whatsapp',
      'instagram',
      'facebook',
      'linkedin',
      'yapay-zeka',
      'openai',
      'raporlama',
      'dashboard',
    ]
    for (const slug of knowledgeSlugs) {
      push(
        {
          path: `/knowledge/${slug}`,
          title: slug,
          description: 'BachMain Knowledge Guide',
        },
        'monthly',
        0.75,
      )
    }
    const helpSlugs = [
      'crm-kullanim',
      'erp-kullanim',
      'muhasebe-kullanim',
      'uretim-kullanim',
      'depo-kullanim',
      'finans-kullanim',
      'lojistik-kullanim',
      'whatsapp-kullanim',
      'instagram-kullanim',
      'ai-asistan-kullanim',
    ]
    for (const slug of helpSlugs) {
      push(
        {
          path: `/help-center/${slug}`,
          title: slug,
          description: 'BachMain Help',
        },
        'monthly',
        0.7,
      )
    }
  } catch {
    // ignore
  }

  return entries
}
