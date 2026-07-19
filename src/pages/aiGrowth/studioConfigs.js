export const AI_GROWTH_STUDIO_CONFIGS = {
  content: {
    title: 'İçerik Merkezi',
    description: 'Tek tıkla platforma özel sosyal içerik üretin.',
    feature: 'content_center',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', options: [
        'Instagram Post', 'Instagram Carousel', 'Instagram Story', 'Instagram Reel',
        'Facebook', 'LinkedIn', 'Threads', 'X', 'TikTok', 'Pinterest', 'Google Business',
      ] },
      { key: 'topic', label: 'Konu / ürün', type: 'text', placeholder: 'Örn: kraft kutu kampanyası' },
      { key: 'goal', label: 'Hedef', type: 'select', options: ['Satış', 'Farkındalık', 'Lead', 'Etkileşim'] },
    ],
    buildPrompt: (f) => `Platform: ${f.platform}
Konu: ${f.topic}
Hedef: ${f.goal}

Üret:
1) Ana metin (marka tonuna uygun, dengeli emoji)
2) CTA
3) 8-15 hashtag
4) Görsel / sahne önerisi
5) Kısa varyasyon (A/B)`,
  },
  social: {
    title: 'Sosyal Medya',
    description: 'Takvim için hazır gönderi paketleri oluşturun.',
    feature: 'social_media',
    fields: [
      { key: 'weekTheme', label: 'Haftanın teması', type: 'text' },
      { key: 'posts', label: 'Gönderi adedi', type: 'select', options: ['3', '5', '7'] },
    ],
    buildPrompt: (f) => `${f.posts} adet sosyal medya gönderisi planı hazırla. Tema: ${f.weekTheme}.
Her gönderi için: platform, başlık, metin, en iyi saat, hashtag, CTA.`,
  },
  blog: {
    title: 'Blog Merkezi',
    description: 'SEO uyumlu 3000–5000 kelimelik blog iskeleti + içerik.',
    feature: 'blog_center',
    fields: [
      { key: 'keyword', label: 'Ana anahtar kelime', type: 'text' },
      { key: 'title', label: 'Taslak başlık (opsiyonel)', type: 'text' },
      { key: 'audience', label: 'Hedef kitle', type: 'text' },
    ],
    buildPrompt: (f) => `SEO blog yazısı hazırla (3000-5000 kelime hedefiyle uzun, zengin içerik).
Anahtar kelime: ${f.keyword}
Başlık önerisi: ${f.title || 'AI belirlesin'}
Kitle: ${f.audience || 'B2B karar vericiler'}

Mutlaka dahil et:
- SEO başlık + meta description
- Schema (Article JSON-LD taslağı)
- H2/H3 alt başlıklar
- SSS (5 soru)
- İç link önerileri
- Anahtar kelime kullanımı notları`,
  },
  seo: {
    title: 'SEO Merkezi',
    description: 'Sayfa SEO puanı, eksikler ve aksiyon listesi.',
    feature: 'seo_center',
    fields: [
      { key: 'url', label: 'Sayfa URL / başlık', type: 'text' },
      { key: 'focus', label: 'Odak kelime', type: 'text' },
      { key: 'competitors', label: 'Rakipler (virgülle)', type: 'text' },
    ],
    buildPrompt: (f) => `Google uyumlu SEO analizi yap.
Sayfa: ${f.url}
Odak: ${f.focus}
Rakipler: ${f.competitors || '-'}

Ver: SEO puanı (0-100), eksikler, yapılması gerekenler, anahtar kelime önerileri, rakip karşılaştırma.`,
  },
  ads: {
    title: 'Reklam Merkezi',
    description: 'Meta, Google, LinkedIn, YouTube, TikTok reklam metinleri.',
    feature: 'ads_center',
    fields: [
      { key: 'channel', label: 'Kanal', type: 'select', options: [
        'Facebook', 'Instagram', 'Google Ads', 'LinkedIn Ads', 'YouTube Ads', 'TikTok Ads',
      ] },
      { key: 'offer', label: 'Teklif / ürün', type: 'text' },
      { key: 'budget', label: 'Bütçe seviyesi', type: 'select', options: ['Düşük', 'Orta', 'Yüksek'] },
    ],
    buildPrompt: (f) => `${f.channel} reklam paketi oluştur.
Teklif: ${f.offer}
Bütçe: ${f.budget}

Çıktı: başlıklar, açıklamalar, CTA, strateji, hedef kitle (yaş, şehir, ilgi alanı), A/B varyasyonlar.`,
  },
  video: {
    title: 'Video Merkezi',
    description: 'YouTube, Shorts, Reels, TikTok senaryoları.',
    feature: 'video_center',
    fields: [
      { key: 'format', label: 'Format', type: 'select', options: ['YouTube', 'Shorts', 'Reels', 'TikTok'] },
      { key: 'duration', label: 'Süre', type: 'select', options: ['30 sn', '60 sn', '90 sn', '5 dakika', '10 dakika'] },
      { key: 'topic', label: 'Konu', type: 'text' },
    ],
    buildPrompt: (f) => `${f.format} için ${f.duration} senaryo yaz.
Konu: ${f.topic}
Sahne sahne diyalog, görsel notlar, hook, CTA ve Thumbnail metni ekle.`,
  },
  email: {
    title: 'E-Mail Marketing',
    description: 'Konu satırı, içerik, CTA ve A/B test varyasyonları.',
    feature: 'email_marketing',
    fields: [
      { key: 'campaign', label: 'Kampanya amacı', type: 'text' },
      { key: 'segment', label: 'Segment', type: 'text' },
    ],
    buildPrompt: (f) => `E-posta kampanyası hazırla.
Amaç: ${f.campaign}
Segment: ${f.segment}
Konu (3), preview text, HTML-benzeri metin, CTA, A/B konu testleri, template yapısı.`,
  },
  whatsapp: {
    title: 'Whatsapp Kampanyaları',
    description: 'Kişiselleştirilebilir WhatsApp mesaj serileri.',
    feature: 'whatsapp_campaigns',
    fields: [
      { key: 'offer', label: 'Teklif', type: 'text' },
      { key: 'tone', label: 'Ton', type: 'select', options: ['Samimi', 'Kurumsal', 'Acil', 'VIP'] },
    ],
    buildPrompt: (f) => `WhatsApp kampanya mesajları yaz (${f.tone}).
Teklif: ${f.offer}
{{ad}}, {{firma}} değişkenleri kullan. 5 mesajlık sequence + opt-out notu.`,
  },
  landing: {
    title: 'Landing Page',
    description: 'Hero, avantajlar, SSS ve SEO hazır landing taslağı.',
    feature: 'landing_page',
    fields: [
      { key: 'product', label: 'Ürün / hizmet', type: 'text' },
      { key: 'cta', label: 'Ana CTA', type: 'text' },
    ],
    buildPrompt: (f) => `Landing page metin mimarisi:
Ürün: ${f.product}
CTA: ${f.cta || 'Hemen Teklif Al'}
Hero, alt başlık, avantajlar (6), sosyal kanıt, SSS (6), SEO title/meta.`,
  },
  competitor: {
    title: 'Rakip Analizi',
    description: 'SEO, sosyal, reklam dili ve ürün yapısı analizi.',
    feature: 'competitor_analysis',
    fields: [
      { key: 'name', label: 'Firma adı', type: 'text' },
      { key: 'website', label: 'Web sitesi', type: 'text' },
    ],
    buildPrompt: (f) => `Rakip analizi yap.
Firma: ${f.name}
Site: ${f.website}
SEO, sosyal medya, reklam dili, blog, anahtar kelime, ürün yapısı + bizim için fırsatlar.`,
  },
  trend: {
    title: 'Trend Analizi',
    description: 'Sektöre göre Google ve sosyal trendler.',
    feature: 'trend_analysis',
    fields: [
      { key: 'sector', label: 'Sektör', type: 'text' },
      { key: 'region', label: 'Bölge', type: 'select', options: ['Türkiye', 'Avrupa', 'Global'] },
    ],
    buildPrompt: (f) => `${f.sector} sektöründe ${f.region} trend analizi.
Google trendleri, sosyal trendler, popüler konular, hashtag önerileri, içerik takvimi fikirleri.`,
  },
  keywords: {
    title: 'Anahtar Kelime Merkezi',
    description: 'Ana / yan / long-tail kelime kümeleri.',
    feature: 'keyword_center',
    fields: [
      { key: 'seed', label: 'Çekirdek kelime', type: 'text' },
      { key: 'intent', label: 'Niyet', type: 'select', options: ['Bilgi', 'Ticari', 'İşlem', 'Navigasyon'] },
    ],
    buildPrompt: (f) => `Anahtar kelime araştırması: ${f.seed} (niyet: ${f.intent}).
Kümele: ana, yan, long-tail, soru kelimeleri, zorluk tahmini, içerik önerisi.`,
  },
  design: {
    title: 'Yapay Zeka Tasarım',
    description: 'Banner, kampanya ve post için kreatif brief.',
    feature: 'ai_design',
    fields: [
      { key: 'asset', label: 'Varlık', type: 'select', options: [
        'Banner', 'Kampanya görseli', 'Instagram post', 'Slider', 'Web banner', 'LinkedIn Banner', 'Ürün afişi', 'Fuar afişi',
      ] },
      { key: 'brief', label: 'Brief', type: 'textarea' },
    ],
    buildPrompt: (f) => `${f.asset} için tasarım brief + prompt üret.
Brief: ${f.brief}
Boyut önerisi, renk, tipografi, kompozisyon, AI görsel promptları (EN+TR).`,
  },
  visual: {
    title: 'Yapay Zeka Görsel',
    description: 'Görsel üretim promptları ve varyasyonlar.',
    feature: 'ai_visual',
    fields: [
      { key: 'subject', label: 'Konu', type: 'text' },
      { key: 'style', label: 'Stil', type: 'select', options: ['Premium katalog', 'Minimal', 'Lifestyle', 'Teknik'] },
    ],
    buildPrompt: (f) => `${f.subject} için ${f.style} görsel seti.
5 prompt, kamera/açı, ışık, negatif prompt, kullanım yeri.`,
  },
  banner: {
    title: 'Yapay Zeka Banner',
    description: 'Web ve kampanya banner metin + prompt.',
    feature: 'ai_banner',
    fields: [
      { key: 'size', label: 'Boyut', type: 'select', options: ['728x90', '300x250', '1080x1080', '1920x600'] },
      { key: 'offer', label: 'Mesaj', type: 'text' },
    ],
    buildPrompt: (f) => `${f.size} banner.
Mesaj: ${f.offer}
Başlık, alt metin, CTA, görsel prompt, layout notları.`,
  },
  productPhoto: {
    title: 'Ürün Fotoğrafı',
    description: 'Arka plan ayrımı, sahne ve 360 önerileri.',
    feature: 'product_photo',
    fields: [
      { key: 'product', label: 'Ürün', type: 'text' },
      { key: 'scene', label: 'Sahne tercihi', type: 'text' },
    ],
    buildPrompt: (f) => `Ürün fotoğrafı AI pipeline:
Ürün: ${f.product}
Sahne: ${f.scene}
Arka plan ayrımı adımları, yeni sahne promptları, premium katalog, 360 önerisi.`,
  },
  videoScript: {
    title: 'Video Senaryosu',
    description: 'Detaylı video senaryosu stüdyosu.',
    feature: 'video_script',
    fields: [
      { key: 'duration', label: 'Süre', type: 'select', options: ['30 sn', '60 sn', '90 sn', '5 dakika', '10 dakika'] },
      { key: 'topic', label: 'Konu', type: 'text' },
    ],
    buildPrompt: (f) => `${f.duration} video senaryosu: ${f.topic}. Hook, bölümler, seslendirici metni, B-roll, CTA.`,
  },
}
