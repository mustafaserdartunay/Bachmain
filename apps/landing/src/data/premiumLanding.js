export const processFlow = [
  { id: "teklif", label: "Teklif", desc: "Hızlı Teklif & Onay", icon: "FileText", tone: "blue" },
  { id: "siparis", label: "Sipariş", desc: "Sipariş Oluşturma", icon: "ShoppingCart", tone: "violet" },
  { id: "uretim", label: "Üretim", desc: "İş Emri & MRP", icon: "Cog", tone: "orange" },
  { id: "paketleme", label: "Paketleme", desc: "Koli & Paket", icon: "PackageCheck", tone: "amber" },
  { id: "depo", label: "Depo", desc: "Stok & Sevk Hazırlığı", icon: "Warehouse", tone: "cyan" },
  { id: "sevkiyat", label: "Sevkiyat", desc: "Nakliye & Rota", icon: "Truck", tone: "sky" },
  { id: "teslim", label: "Teslim", desc: "Teslimat & Tahsilat", icon: "PackageOpen", tone: "emerald" },
];

/** @deprecated use moduleShowcase in ModulesShowcase */
export const premiumModules = [];

export const moduleSpotlight = [
  {
    id: "dashboard",
    title: "Güncel Durum",
    desc: "Ana dinamik sayfa — canlı KPI, aktivite akışı ve anlık ödeme ekranı.",
    badge: "Canlı",
    href: "/features",
    tone: "blue",
    icon: "LayoutDashboard",
  },
  {
    id: "process",
    title: "Süreç Yönetimi",
    desc: "Teklif → sipariş → üretim → depo → teslimat. Fotoğraflı aşama takibi.",
    badge: "Uçtan uca",
    href: "/modules/production",
    tone: "violet",
    icon: "Workflow",
  },
  {
    id: "b2b",
    title: "B2B Müşteri Portalı",
    desc: "Sipariş, kampanya, cari, canlı mesaj ve ticket — müşteri self-servis.",
    badge: "Self-servis",
    href: "/features/erp",
    tone: "cyan",
    icon: "Globe2",
  },
  {
    id: "photos",
    title: "Fotoğraflı Üretim",
    desc: "Müşterileriniz üretimini görsellerle canlı izlesin, şeffaf ilerlesin.",
    badge: "Görsel",
    href: "/modules/production",
    tone: "orange",
    icon: "Camera",
  },
];

export const moduleShowcase = [
  { icon: "Users", title: "Müşteriler", desc: "Kartlar, fırsatlar ve ilişki geçmişi.", tone: "blue", href: "/features/crm", tag: "CRM" },
  { icon: "Factory", title: "Tedarikçiler", desc: "Tedarik zinciri ve performans.", tone: "slate", href: "/features/erp", tag: "ERP" },
  { icon: "Package", title: "Ürün & Hizmet", desc: "Katalog, varyant ve fiyat listeleri.", tone: "violet", href: "/features/stock", tag: "Katalog" },
  { icon: "Boxes", title: "Stok", desc: "Anlık stok, barkod ve rezervasyon.", tone: "amber", href: "/features/stock", tag: "Stok" },
  { icon: "Warehouse", title: "Depo", desc: "Çoklu depo, raf ve transfer.", tone: "orange", href: "/features/stock", tag: "Depo" },
  { icon: "Wallet", title: "Kasa", desc: "Nakit akış ve kasa hareketleri.", tone: "emerald", href: "/features/finance", tag: "Finans" },
  { icon: "Store", title: "POS & Kasa", desc: "Mağaza satışı, fiş ve canlı kasa.", tone: "rose", href: "/features/finance", tag: "POS" },
  { icon: "FileText", title: "e-Fatura", desc: "GİB uyumlu e-fatura / e-arşiv.", tone: "indigo", href: "/e-invoice", tag: "e-Belge" },
  { icon: "Landmark", title: "Banka · Çek · Senet", desc: "Banka, çek ve senet takibi.", tone: "teal", href: "/features/finance", tag: "Finans" },
  { icon: "MapPin", title: "Saha Satış", desc: "GPS, rota, ziyaret ve sipariş.", tone: "orange", href: "/modules/field-sales", tag: "Saha" },
  { icon: "Radar", title: "Temsilci İzleme", desc: "Saha ekibi, puantaj ve prim.", tone: "sky", href: "/modules/field-sales", tag: "Prim" },
  { icon: "MessageSquare", title: "Mesaj Merkezi", desc: "WhatsApp, IG, FB, SMS, mail.", tone: "pink", href: "/features/crm", tag: "Omni" },
  { icon: "Truck", title: "Nakliye & Palet", desc: "Tır, koli, paket, palet hesabı.", tone: "blue", href: "/features/stock", tag: "Lojistik" },
  { icon: "ClipboardList", title: "Teklif", desc: "Hızlı teklif, onay ve revizyon.", tone: "violet", href: "/features/erp", tag: "Satış" },
  { icon: "ShoppingCart", title: "Sipariş", desc: "Siparişten sevkiyata tek akış.", tone: "sky", href: "/features/erp", tag: "Satış" },
  { icon: "Cog", title: "Üretim", desc: "İş emri, MRP ve kalite kontrol.", tone: "slate", href: "/modules/production", tag: "MRP" },
  { icon: "Contact", title: "CRM", desc: "Pipeline, lead ve müşteri yolculuğu.", tone: "blue", href: "/features/crm", tag: "CRM" },
  { icon: "ListTodo", title: "Görevler", desc: "Görev oluştur, ata, takip et.", tone: "emerald", href: "/features/crm", tag: "İş" },
  { icon: "CalendarDays", title: "Randevu", desc: "Takvim, hatırlatma ve ziyaret.", tone: "cyan", href: "/features/crm", tag: "Takvim" },
  { icon: "NotebookPen", title: "Not Defteri", desc: "Kayıt notları ve hatırlatmalar.", tone: "amber", href: "/features/crm", tag: "Not" },
  { icon: "Activity", title: "Canlı Ödeme", desc: "Aktivite ve tahsilat ekranı.", tone: "green", href: "/features/finance", tag: "Canlı" },
  { icon: "MoonStar", title: "Gündüz / Gece", desc: "Tek tıkla tema değiştirme.", tone: "fuchsia", href: "/features", tag: "Tema" },
  { icon: "UserCog", title: "Personel", desc: "İşe giriş-çıkış ve vardiya.", tone: "purple", href: "/features/erp", tag: "İK" },
  { icon: "IdCard", title: "İK & Bordro", desc: "Personel, puantaj, bordro.", tone: "violet", href: "/features/erp", tag: "İK" },
  { icon: "BarChart3", title: "Detaylı Raporlar", desc: "KPI, dashboard ve derin analiz.", tone: "teal", href: "/features/reports", tag: "BI" },
  { icon: "Ticket", title: "Ticket & Destek", desc: "B2B destek talepleri ve SLA.", tone: "rose", href: "/help", tag: "Destek" },
  { icon: "Megaphone", title: "Kampanyalar", desc: "B2B kampanya ve fırsat takibi.", tone: "orange", href: "/features/erp", tag: "B2B" },
  { icon: "Receipt", title: "Cari Takip", desc: "Borç-alacak ve cari ekstre.", tone: "emerald", href: "/features/finance", tag: "Cari" },
];

export const moduleChannels = [
  { id: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { id: "instagram", label: "Instagram", color: "#E1306C" },
  { id: "facebook", label: "Facebook", color: "#1877F2" },
  { id: "x", label: "X", color: "#0F1419" },
  { id: "tiktok", label: "TikTok", color: "#111111" },
  { id: "mail", label: "Mail", color: "#EA4335" },
  { id: "b2b", label: "B2B", color: "#2563EB" },
];

export const moduleMarquee = [
  "Müşteri kartı", "Tedarikçi", "Stok", "Depo", "Kasa", "POS", "e-Fatura",
  "Çek-Senet", "Saha GPS", "Prim", "B2B sipariş", "Kampanya", "Cari",
  "Canlı mesaj", "Ticket", "Palet hesabı", "Fotoğraflı süreç", "Gece modu",
  "Görev", "Randevu", "Not defteri", "Canlı ödeme", "Raporlar",
];

export const b2bFeatures = [
  "Sipariş Verme", "Kampanya Takibi", "Cari Hesap", "Canlı Mesaj",
  "Ticket Gönderme", "Fatura Görüntüleme", "Borç / Alacak", "Üretim İzleme",
  "Teklif Onaylama", "Ödeme Takibi", "Kargo Takibi", "Canlı Stok",
];

export const fieldFeatures = [
  { title: "Canlı GPS", desc: "Temsilci konumunu anlık izleyin." },
  { title: "Rota Optimizasyonu", desc: "Akıllı ziyaret sırası." },
  { title: "Puantaj & Prim", desc: "Performansa göre prim sistemi." },
  { title: "Fotoğraf & Not", desc: "Ziyaret kanıtı ve rapor." },
];

export const integrations = [
  "Logo", "Paraşüt", "Trendyol", "Hepsiburada", "N11", "WooCommerce",
  "Shopify", "Mikro", "Nebim", "e-Fatura", "WhatsApp", "SMS", "Mail", "API",
];

export const floatMetrics = [
  { label: "Aktif Müşteri", value: "1.240", tone: "text-blue-600" },
  { label: "Bekleyen Ödeme", value: "₺125K", tone: "text-orange-500" },
  { label: "Açık Teklif", value: "214", tone: "text-violet-600" },
  { label: "Sevkiyat", value: "48", tone: "text-emerald-600" },
  { label: "Günlük Ciro", value: "₺284K", tone: "text-blue-700" },
  { label: "Mesaj", value: "98%", tone: "text-rose-500" },
];

export const bandStats = [
  { value: "10.000+", label: "Mutlu Kullanıcı" },
  { value: "500+", label: "Aktif Firma" },
  { value: "99.9%", label: "Uptime" },
  { value: "7/24", label: "Teknik Destek" },
  { value: "%90", label: "Zaman Tasarrufu" },
  { value: "%45", label: "Maliyet Azaltma" },
];

export const testimonials = [
  {
    quote: "6 ayrı yazılımı tek panelde birleştirdik. Operasyon maliyetimiz %40 düştü.",
    name: "Mehmet Kaya",
    role: "CFO",
    company: "Tekstil A.Ş.",
    image: "/assets/testimonials/mehmet.jpg",
    rating: 5,
  },
  {
    quote: "B2B portal ile müşteriler üretimi canlı izliyor. Destek talepleri yarıya indi.",
    name: "Ayşe Demir",
    role: "Operasyon Müdürü",
    company: "Mobilya",
    image: "/assets/testimonials/ayse.jpg",
    rating: 5,
  },
  {
    quote: "Saha ekibimizin performansı GPS ile %35 arttı. Raporlar saniyeler sürüyor.",
    name: "Can Öztürk",
    role: "Satış Direktörü",
    company: "Dağıtım",
    image: "/assets/testimonials/can.jpg",
    rating: 5,
  },
];

export const heroChecks = [
  "B2B Müşteri Yönetimi",
  "Saha Satış & Mobil",
  "CRM & Görev Yönetimi",
  "Tüm Modüller Entegre",
];
