/**
 * Legal document catalog — TR draft templates (not legal advice).
 * Kept in sync conceptually with apps/landing/src/legal/catalog.ts
 */

export const LAWYER_NOTICE =
  'Bu sözleşmeler yayına alınmadan önce KVKK, e-Ticaret ve Tüketici Hukuku alanında uzman bir avukat tarafından kontrol edilmelidir.'

export const DEFAULT_LEGAL_COMPANY = {
  legalName: 'BachMain Yazılım Teknoloji ve Bilişim Hizmetleri A.Ş.',
  brandName: 'BACHMAIN',
  location: 'İstanbul / Anadolu Yakası',
  country: 'Türkiye',
  contactEmail: 'info@bachmain.com',
  supportEmail: 'destek@bachmain.com',
  kvkkEmail: 'kvkk@bachmain.com',
  webUrl: 'https://www.bachmain.com',
  appUrl: 'https://uygulama.bachmain.com',
}

export const LEGAL_DOC_TYPES = [
  { type: 'terms_of_use', slug: 'kullanim-kosullari', title: 'Kullanım Koşulları', aliases: [] },
  { type: 'service_agreement', slug: 'hizmet-sozlesmesi', title: 'Hizmet Sözleşmesi', aliases: [] },
  {
    type: 'privacy_policy',
    slug: 'gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    aliases: ['gizlilik'],
  },
  {
    type: 'kvkk_notice',
    slug: 'kvkk-aydinlatma-metni',
    title: 'KVKK Aydınlatma Metni',
    aliases: ['kvkk'],
  },
  { type: 'cookie_policy', slug: 'cerez-politikasi', title: 'Çerez Politikası', aliases: [] },
  { type: 'explicit_consent', slug: 'acik-riza-metni', title: 'Açık Rıza Metni', aliases: [] },
  {
    type: 'electronic_comms',
    slug: 'elektronik-ileti-onayi',
    title: 'Elektronik İleti Onayı',
    aliases: [],
  },
  {
    type: 'cancel_refund',
    slug: 'iptal-iade-politikasi',
    title: 'İptal / İade Politikası',
    aliases: [],
  },
  {
    type: 'demo_terms',
    slug: 'demo-kullanim-kosullari',
    title: 'Demo Kullanım Koşulları',
    aliases: [],
  },
  { type: 'data_security', slug: 'veri-guvenligi', title: 'Veri Güvenliği', aliases: [] },
  { type: 'license_agreement', slug: 'lisans-sozlesmesi', title: 'Lisans Sözleşmesi', aliases: [] },
]

export const CONSENT_PACKS = {
  purchase: [
    'service_agreement',
    'terms_of_use',
    'privacy_policy',
    'kvkk_notice',
    'cookie_policy',
    'cancel_refund',
  ],
  demo: ['demo_terms', 'kvkk_notice', 'privacy_policy', 'cookie_policy'],
  register: ['kvkk_notice', 'terms_of_use', 'privacy_policy'],
  /** App gate: published docs that require re-accept after version bump */
  app: [
    'terms_of_use',
    'privacy_policy',
    'kvkk_notice',
    'service_agreement',
    'cookie_policy',
    'cancel_refund',
    'demo_terms',
  ],
}

function companyBlock(c = DEFAULT_LEGAL_COMPANY) {
  return `${c.legalName} (“Şirket”, “BACHMAIN”), ${c.location}, ${c.country}. İletişim: ${c.contactEmail}. Uygulama: ${c.appUrl}. Web: ${c.webUrl}.`
}

function sections(title, paras) {
  return [`## ${title}`, ...paras].join('\n\n')
}

export function buildDraftBody(type, company = DEFAULT_LEGAL_COMPANY) {
  const co = companyBlock(company)
  const common = [
    sections('1. Taraflar ve kapsam', [
      co,
      'Bu metin, BACHMAIN bulut yazılım hizmetlerinin kullanımı ile ilgili hak ve yükümlülükleri düzenler. Metinler taslak niteliğindedir.',
      LAWYER_NOTICE,
    ]),
    sections('2. Tanımlar', [
      '“Hizmet”: BACHMAIN CRM/ERP ve bağlı bulut modülleri.',
      '“Kullanıcı”: Hizmete erişen gerçek veya tüzel kişi temsilcisi.',
      '“Abonelik”: Ücretli paket (Starter, Pro, Enterprise / Full Paket) dönemi.',
      '“Demo”: Sınırlı süreli deneme hesabı.',
    ]),
  ]

  const bodies = {
    terms_of_use: [
      `# Kullanım Koşulları`,
      ...common,
      sections('3. Hesap ve güvenlik', [
        'Kullanıcı doğru bilgi vermekle, hesap güvenliğini sağlamakla ve yetkisiz erişimi derhal bildirmekle yükümlüdür.',
        'Şirket, güvenlik ihlali şüphesinde hesabı geçici olarak askıya alabilir.',
      ]),
      sections('4. Kabul edilemez kullanım', [
        'Hizmet; yasa dışı faaliyet, zararlı yazılım, yetkisiz veri madenciliği, üçüncü kişi haklarını ihlal eden içerik veya sistemin aşırı yüklenmesi için kullanılamaz.',
      ]),
      sections('5. Fikri mülkiyet', [
        'Platform yazılımı, marka ve içerikler Şirkete veya lisansörlerine aittir. Kullanıcıya münhasır olmayan, devredilemeyen bir kullanım hakkı tanınır.',
      ]),
      sections('6. Sorumluluk sınırları', [
        'Hizmet “olduğu gibi” sunulur. Zorunlu tüketici hakları saklı kalmak kaydıyla, dolaylı zararlardan sorumluluk mümkün olduğunca sınırlanır.',
      ]),
      sections('7. Uygulanacak hukuk', [
        'Bu koşullar Türkiye Cumhuriyeti hukukuna tabidir. Uyuşmazlıklarda İstanbul Anadolu mahkemeleri ve icra daireleri yetkilidir (tüketici işlemlerinde zorunlu hükümler saklıdır).',
      ]),
    ].join('\n\n'),

    service_agreement: [
      `# Hizmet Sözleşmesi`,
      ...common,
      sections('3. Hizmetin konusu', [
        'Şirket, seçilen abonelik paketi kapsamında bulut tabanlı iş yönetimi yazılımı sağlar. Paket kapsamı fiyatlandırma sayfasında ve sipariş özetinde belirtilir.',
      ]),
      sections('4. Ücret, fatura ve ödeme', [
        'Ücretler KDV hariç/ dahil olarak sipariş anında gösterilir. Havale/EFT veya kart ile ödeme yapılabilir. Ödeme onaylanana kadar giriş kısıtlanabilir.',
        'Eksik veya hatalı ödeme durumunda abonelik aktifleştirilmez.',
      ]),
      sections('5. Süre ve yenileme', [
        'Abonelik aylık veya yıllık seçilebilir. Süre sonunda yenilenmezse erişim askıya alınabilir; veriler makul süre saklanır.',
      ]),
      sections('6. Destek', [
        `Destek talepleri ${company.supportEmail} üzerinden iletilir. SLA süreleri paket seviyesine göre değişebilir.`,
      ]),
      sections('7. Fesih', [
        'Taraflar, sözleşmeye aykırılık veya yasal zorunluluk halinde fesih hakkına sahiptir. Tüketiciye tanınan cayma/iptal hakları saklıdır.',
      ]),
    ].join('\n\n'),

    privacy_policy: [
      `# Gizlilik Politikası`,
      ...common,
      sections('3. Toplanan veriler', [
        'Kimlik ve iletişim bilgileri, şirket/fatura bilgileri, kullanım logları, destek kayıtları ve çerez/cihaz verileri işlenebilir.',
      ]),
      sections('4. İşleme amaçları', [
        'Sözleşmenin kurulması/ifası, faturalama, güvenlik, ürün geliştirme, yasal yükümlülükler ve (varsa) açık rızaya dayalı pazarlama.',
      ]),
      sections('5. Aktarım ve saklama', [
        'Veriler Türkiye’de veya yeterli koruma sağlayan altyapılarda saklanabilir. Saklama süreleri amaçla sınırlıdır.',
      ]),
      sections('6. Haklarınız', [
        `KVKK m.11 kapsamındaki haklarınız için ${company.kvkkEmail} adresine başvurabilirsiniz.`,
      ]),
    ].join('\n\n'),

    kvkk_notice: [
      `# KVKK Aydınlatma Metni`,
      ...common,
      sections('3. Veri sorumlusu', [
        `${company.legalName} veri sorumlusudur. Adres bilgisi: ${company.location}.`,
      ]),
      sections('4. İşlenen kişisel veriler', [
        'Kimlik, iletişim, müşteri işlem, finans/fatura, işlem güvenliği ve pazarlama verileri (rıza halinde).',
      ]),
      sections('5. Hukuki sebepler', [
        'KVKK m.5/6: sözleşmenin kurulması/ifası, hukuki yükümlülük, meşru menfaat, açık rıza.',
      ]),
      sections('6. Haklar', [
        `Başvuru: ${company.kvkkEmail}. Başvurular KVKK ve ilgili yönetmeliklere uygun cevaplanır.`,
      ]),
    ].join('\n\n'),

    cookie_policy: [
      `# Çerez Politikası`,
      ...common,
      sections('3. Çerez türleri', [
        'Zorunlu: oturum ve güvenlik.',
        'Tercihler: dil/arayüz tercihleri.',
        'İstatistik: anonim/aggregated kullanım analitikleri.',
        'Pazarlama: yalnızca rıza ile.',
      ]),
      sections('4. Yönetim', [
        'İlk ziyarette çerez paneli ile tercihlerinizi yönetebilirsiniz. Zorunlu çerezler hizmet için gereklidir.',
      ]),
    ].join('\n\n'),

    explicit_consent: [
      `# Açık Rıza Metni`,
      ...common,
      sections('3. Rıza konusu', [
        'Belirtilen kişisel verilerinizin pazarlama iletişimi ve ürün önerileri amacıyla işlenmesine açık rıza vermeniz istenebilir. Rıza vermemeniz hizmetin temel kullanımını engellemez.',
      ]),
      sections('4. Geri alma', [
        `Rızanızı ${company.kvkkEmail} veya hesap ayarlarından geri alabilirsiniz.`,
      ]),
    ].join('\n\n'),

    electronic_comms: [
      `# Elektronik İleti Onayı`,
      ...common,
      sections('3. Onay', [
        '6563 sayılı Kanun ve ilgili mevzuat kapsamında ticari elektronik ileti (e-posta, SMS, çağrı) almak için onayınız alınabilir.',
      ]),
      sections('4. Ret', [
        'Her iletide sunulan ret imkânı veya hesap ayarları ile iletişimi durdurabilirsiniz.',
      ]),
    ].join('\n\n'),

    cancel_refund: [
      `# İptal / İade Politikası`,
      ...common,
      sections('3. Cayma ve iptal', [
        'Mesafeli sözleşmelerde tüketiciye tanınan yasal haklar saklıdır. Dijital içeriğin ifasına sizin onayınızla başlanmışsa cayma hakkı sınırlanabilir.',
      ]),
      sections('4. İade koşulları', [
        'Hatalı tahsilat veya hizmetin sağlanamaması durumunda iade değerlendirilir. Talep: ' +
          company.supportEmail,
      ]),
      sections('5. Abonelik iptali', [
        'Dönem sonuna kadar erişim sürebilir; erken iptalde kalan günlerin iadesi paket koşullarına bağlıdır.',
      ]),
    ].join('\n\n'),

    demo_terms: [
      `# Demo Kullanım Koşulları`,
      ...common,
      sections('3. Demo kapsamı', [
        'Demo hesap sınırlı süre (varsayılan 7 gün) ve özelliklerle sunulur. Ücretli abonelik hükümleri demo için uygulanmaz.',
      ]),
      sections('4. Veri ve süre', [
        'Demo verileri süre sonunda silinebilir veya arşivlenebilir. Üretime taşıma garantisi yoktur.',
        'Aynı e-posta ile ikinci demo açılamaz; süre uzatımı yalnızca yönetim onayı ile yapılır.',
      ]),
      sections('5. Sorumluluk', [
        'Demo ortamı test amaçlıdır; üretim verisi yüklememeniz önerilir.',
      ]),
    ].join('\n\n'),

    data_security: [
      `# Veri Güvenliği`,
      ...common,
      sections('3. Teknik ve idari tedbirler', [
        'Erişim kontrolü, şifreleme (aktarımda TLS), kayıt/loglama, yedekleme ve yetkilendirme prensipleri uygulanır.',
      ]),
      sections('4. İhlal bildirimi', [
        'Mevzuatın gerektirdiği hallerde ilgili kişilere ve Kuruluşa bildirim yapılır.',
      ]),
    ].join('\n\n'),

    license_agreement: [
      `# Lisans Sözleşmesi`,
      ...common,
      sections('3. Lisans', [
        'Abonelik süresince Hizmete erişim için münhasır olmayan, devredilemeyen lisans verilir. Kaynak kod hakkı verilmez.',
      ]),
      sections('4. Kısıtlar', [
        'Tersine mühendislik, yetkisiz kopyalama, alt lisans ve rekabet amaçlı kullanım yasaktır (zorunlu kanun hükümleri saklı).',
      ]),
    ].join('\n\n'),
  }

  return bodies[type] || `# ${type}\n\n${LAWYER_NOTICE}`
}

export function resolveDocMeta(slugOrType) {
  const key = String(slugOrType || '')
    .replace(/^\//, '')
    .trim()
  return (
    LEGAL_DOC_TYPES.find(
      (d) => d.type === key || d.slug === key || (d.aliases || []).includes(key),
    ) || null
  )
}

/** Very small markdown → HTML for print/PDF/UI. */
export function markdownToHtml(md) {
  const lines = String(md || '').split(/\r?\n/)
  const out = []
  let para = []
  const flush = () => {
    if (!para.length) return
    out.push(`<p>${escapeHtml(para.join(' ').trim())}</p>`)
    para = []
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    if (line.startsWith('# ')) {
      flush()
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
      continue
    }
    if (line.startsWith('## ')) {
      flush()
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
      continue
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      flush()
      out.push(`<li>${escapeHtml(line.replace(/^[-•]\s+/, ''))}</li>`)
      continue
    }
    para.push(line.trim())
  }
  flush()
  // wrap consecutive li
  let html = out.join('\n')
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\n?)+/g, (block) => `<ul>${block}</ul>`)
  return html
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
