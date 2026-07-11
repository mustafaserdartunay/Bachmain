export const landingStats = [
  { end: 120, suffix: "+", label: "Modül" },
  { end: 40000, suffix: "+", label: "Aktif Kullanıcı" },
  { end: 12, suffix: " Milyon", label: "İşlem" },
  { end: 99.99, suffix: "%", label: "Uptime", decimal: true },
];

export const coreModules = [
  { emoji: "👥", name: "CRM", desc: "Müşteri ilişkilerini, teklifleri ve satış süreçlerini merkezi panelden yönetin.", ic: "ic-b", href: "/features/crm" },
  { emoji: "🏢", name: "ERP", desc: "Tüm kurumsal operasyonlarınızı tek ekranda görün ve yönetin.", ic: "ic-n", href: "/features/erp" },
  { emoji: "💰", name: "Muhasebe", desc: "Gelir-gider takibi, fatura yönetimi ve finansal raporlama.", ic: "ic-g", href: "/features/finance" },
  { emoji: "📦", name: "Stok", desc: "Gerçek zamanlı stok takibi, kritik seviye uyarıları ve depo yönetimi.", ic: "ic-o", href: "/features/stock" },
  { emoji: "🏭", name: "Depo", desc: "Depo düzeni, raf yönetimi ve envanter optimizasyonu.", ic: "ic-t", href: "/features/stock" },
  { emoji: "⚙️", name: "Üretim", desc: "Üretim planlaması, iş emirleri ve kalite kontrol süreçleri.", ic: "ic-p", href: "/modules/production" },
  { emoji: "👨‍💼", name: "İnsan Kaynakları", desc: "İşe alım, özlük işleri, izin ve performans yönetimi.", ic: "ic-y", href: "/features/erp" },
  { emoji: "🕓", name: "Personel Takip", desc: "Vardiya planlaması, devam takibi ve mesai hesaplama.", ic: "ic-r", href: "/features/erp" },
  { emoji: "💳", name: "Canlı Kasa", desc: "Anlık kasa takibi, tahsilat yönetimi ve ödeme geçmişi.", ic: "ic-go", href: "/features/finance" },
  { emoji: "🌍", name: "B2B Portal", desc: "Müşterileriniz üretim, numune ve siparişlerini kendi panelinden yönetir.", ic: "ic-c", href: "/features/erp" },
  { emoji: "📄", name: "E-Fatura", desc: "GİB entegrasyonlu e-fatura, e-arşiv ve e-irsaliye otomasyonu.", ic: "ic-i", href: "/e-invoice" },
  { emoji: "✨", name: "Yapay Zekâ", desc: "AI destekli tahmin, anomali tespiti ve otomatik raporlama.", ic: "ic-pk", href: "/features/reports" },
];

export const processSteps = [
  { emoji: "👥", label: "CRM", hi: true },
  { emoji: "📋", label: "Teklif" },
  { emoji: "🛒", label: "Sipariş", hi: true },
  { emoji: "⚙️", label: "Üretim" },
  { emoji: "✅", label: "Kalite", hi: true },
  { emoji: "📦", label: "Paketleme" },
  { emoji: "🚛", label: "Sevkiyat", hi: true },
  { emoji: "📄", label: "Fatura" },
  { emoji: "💳", label: "Tahsilat", hi: true },
];

export const fieldFeatures = [
  { emoji: "🗺️", name: "Rota Planlama", desc: "Akıllı rota önerileri ile yakıt ve zaman tasarrufu" },
  { emoji: "📍", name: "GPS Takip", desc: "Temsilcilerin anlık ve geçmiş konum geçmişi" },
  { emoji: "📅", name: "Günlük Plan", desc: "Otomatik oluşturulan günlük ziyaret programı" },
  { emoji: "🏪", name: "Bayi Ziyaretleri", desc: "Ziyaret kayıtları, fotoğraf ve notlar ile raporlama" },
  { emoji: "📊", name: "Performans Analizi", desc: "Temsilci bazlı satış, ziyaret ve dönüşüm raporları" },
];

export const messageChannels = [
  { emoji: "📸", name: "Instagram", count: "1.2K mesaj", bg: "linear-gradient(135deg,#F77737,#E1306C)" },
  { emoji: "💬", name: "WhatsApp", count: "3.4K mesaj", bg: "#25D366" },
  { emoji: "👤", name: "Facebook", count: "842 mesaj", bg: "#1877F2" },
  { emoji: "🎵", name: "TikTok", count: "518 mesaj", bg: "#010101" },
  { emoji: "✉️", name: "Messenger", count: "1.1K mesaj", bg: "#0084FF" },
  { emoji: "📧", name: "E-Mail", count: "2.8K mesaj", bg: "var(--bach-navy)" },
  { emoji: "✈️", name: "Telegram", count: "674 mesaj", bg: "#229ED9" },
  { emoji: "✨", name: "AI Yanıtla", count: "Otomatik", bg: "var(--bach-gold)" },
];

export const timelineItems = [
  { emoji: "📋", name: "Teklif & Sipariş", desc: "Müşteri onaylı sipariş sisteme girer, üretim planı otomatik oluşur", tag: "✓ Tamamlandı", tagClass: "tag-green", active: true },
  { emoji: "📦", name: "Malzeme & Stok", desc: "Gerekli malzemeler stoktan rezerve edilir, eksik varsa otomatik sipariş açılır", tag: "✓ Tamamlandı", tagClass: "tag-green", active: true },
  { emoji: "⚙️", name: "Üretim Başladı", desc: "Üretim hattı atandı, operatörler iş emirlerini panellerinde görür", tag: "🔄 Devam Ediyor", tagClass: "tag-blue", active: true },
  { emoji: "✅", name: "Kalite Kontrol", desc: "QC ekibi onay/ret kaydeder, fire oranı otomatik hesaplanır", tag: "⏳ Bekliyor", tagClass: "tag-amber" },
  { emoji: "🏷️", name: "Paketleme", desc: "Barkod, etiket ve palet optimizasyonu otomatik yapılır", tag: "⏳ Bekliyor", tagClass: "tag-amber" },
  { emoji: "🚛", name: "Sevkiyat", desc: "Kurye atandı, müşteriye otomatik bildirim gönderilir", tag: "⏳ Bekliyor", tagClass: "tag-amber" },
  { emoji: "📄", name: "E-Fatura & Tahsilat", desc: "GİB'e otomatik iletilir, ödeme takibi başlar", tag: "⏳ Bekliyor", tagClass: "tag-amber" },
];

export const glowMetrics = [
  { emoji: "💰", label: "Günlük Gelir", value: "₺284K", trend: "↑ %12 dün", gc: "gc1" },
  { emoji: "🛒", label: "Aktif Sipariş", value: "1.847", trend: "↑ %8 büyüme", gc: "gc2" },
  { emoji: "👥", label: "Yeni Müşteri", value: "214", trend: "Bu ay", gc: "gc3" },
  { emoji: "⚙️", label: "Üretim Verimi", value: "%93", trend: "Hedef: %95", gc: "gc4" },
  { emoji: "📍", label: "Saha Ziyareti", value: "84", trend: "Bugün aktif", gc: "gc5" },
  { emoji: "💬", label: "Mesaj Cevaplanma", value: "%98", trend: "Avg 3 dk", gc: "gc6" },
  { emoji: "📦", label: "Stok Devir Hızı", value: "4.2x", trend: "Aylık oran", gc: "gc7" },
  { emoji: "✨", label: "AI Tahmin Doğr.", value: "%94", trend: "Son 30 gün", gc: "gc8" },
];

export const comparisonRows = [
  { feature: "CRM — Müşteri Yönetimi", bach: "yes", other: "yes" },
  { feature: "ERP — Kurumsal Kaynak Planlaması", bach: "yes", other: "yes" },
  { feature: "Muhasebe & E-Fatura", bach: "yes", other: "yes" },
  { feature: "B2B Müşteri Portalı", bach: "yes", other: "warn" },
  { feature: "Yapay Zekâ Modülü", bach: "yes", other: "no" },
  { feature: "WhatsApp & Toplu Mesaj", bach: "yes", other: "no" },
  { feature: "Instagram & TikTok Entegrasyonu", bach: "yes", other: "no" },
  { feature: "GPS & Saha Satış Takibi", bach: "yes", other: "no" },
  { feature: "Kurye & Lojistik Yönetimi", bach: "yes", other: "no" },
  { feature: "Palet & Koli Sığma Hesaplama", bach: "yes", other: "no" },
  { feature: "Araç Takip Sistemi", bach: "yes", other: "no" },
  { feature: "Tek Platform, Sıfır Entegrasyon", bach: "yes", other: "no" },
];

export const landingPricing = [
  {
    plan: "Starter",
    price: "₺1.490",
    per: "/ ay · KDV dahil",
    featured: false,
    features: ["CRM & ERP Modülü", "Muhasebe & E-Fatura", "Stok & Depo Yönetimi", "5 Kullanıcı", "E-posta Desteği"],
    cta: "Ücretsiz Başla",
    to: "/register",
    btn: "outline",
  },
  {
    plan: "Professional",
    price: "₺2.990",
    per: "/ ay · KDV dahil",
    featured: true,
    badge: "⭐ En Popüler",
    features: ["Tüm Starter Özellikleri", "WhatsApp & Mesaj Merkezi", "Saha Satış & GPS Takip", "B2B Müşteri Portalı", "Üretim Takip", "25 Kullanıcı", "7/24 Öncelikli Destek"],
    cta: "Hemen Başla",
    to: "/demo",
    btn: "primary",
  },
  {
    plan: "Enterprise",
    price: "Teklif Al",
    per: "Sınırsız kullanıcı",
    featured: false,
    largePrice: true,
    features: ["Tüm Professional Özellikleri", "AI & Tahmin Motoru", "Özel Entegrasyon & API", "On-premise veya Özel Cloud", "SLA Garantisi", "Dedicated Destek Ekibi"],
    cta: "İletişime Geç",
    to: "/contact",
    btn: "navy",
  },
];

export const marqueeLogos = [
  "🏗️ Zorlu Holding", "🚗 Doğuş Grup", "🏪 Migros", "🏭 Vestel", "✈️ THY Tedarik",
  "💊 Eczacıbaşı", "🏦 İş Bankası", "🚛 Aras Kargo", "🔧 Arçelik", "🏬 LC Waikiki",
];

export const testimonials = [
  { quote: "BACH ile 6 ayrı yazılımı tek platformda birleştirdik. Operasyon maliyetimiz %40 düştü.", name: "Mehmet Kaya", role: "CFO — Tekstil A.Ş.", stars: 5 },
  { quote: "B2B portalımız sayesinde müşterilerimiz üretimi canlı izliyor. Destek talepleri %60 azaldı.", name: "Ayşe Demir", role: "Operasyon Müdürü — Mobilya Grubu", stars: 5 },
  { quote: "Saha satış ekibimizin performansı GPS takip ile %35 arttı. Raporlama artık saniyeler sürüyor.", name: "Can Öztürk", role: "Satış Direktörü — Gıda Distribütör", stars: 5 },
];
