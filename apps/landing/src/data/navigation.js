export const featuresDropdown = [
  { label: "CRM", href: "/features/crm" },
  { label: "ERP", href: "/features/erp" },
  { label: "Stok Yönetimi", href: "/features/stock" },
  { label: "Cari Takip", href: "/features/finance" },
  { label: "Satış Yönetimi", href: "/features/crm" },
  { label: "Raporlama", href: "/features/reports" },
];

export const modulesDropdown = [
  { label: "Üretim", href: "/modules/production" },
  { label: "E-Ticaret", href: "/modules/ecommerce" },
  { label: "Depo", href: "/features/stock" },
  { label: "Saha Satış", href: "/modules/field-sales" },
  { label: "Finans", href: "/features/finance" },
  { label: "B2B", href: "/features/erp" },
];

export const supportDropdown = [
  { label: "Yardım Merkezi", href: "/help" },
  { label: "SSS", href: "/faq" },
  { label: "Eğitimler", href: "/help" },
];

export const mainNav = [
  { label: "Özellikler", dropdown: featuresDropdown },
  { label: "Sektörel Modüller", dropdown: modulesDropdown, href: "/modules" },
  { label: "E-Fatura", href: "/e-invoice" },
  { label: "Fiyatlar", href: "/pricing" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/contact" },
];

export const footerLinks = {
  products: [
    { label: "CRM", href: "/features/crm" },
    { label: "ERP", href: "/features/erp" },
    { label: "Stok Yönetimi", href: "/features/stock" },
    { label: "E-Fatura", href: "/e-invoice" },
    { label: "B2B Portal", href: "/features/erp" },
    { label: "Fiyatlandırma", href: "/pricing" },
  ],
  corporate: [
    { label: "Hakkımızda", href: "/contact" },
    { label: "Referanslar", href: "/contact" },
    { label: "Blog", href: "/blog" },
    { label: "Demo Talep", href: "/demo" },
  ],
  support: [
    { label: "Yardım Merkezi", href: "/help" },
    { label: "SSS", href: "/faq" },
    { label: "Eğitimler", href: "/help" },
    { label: "Destek", href: "/contact" },
  ],
};

export const homeModules = [
  { icon: "Users", title: "Müşteriler Yönetimi", href: "/features/crm" },
  { icon: "Truck", title: "Tedarikçiler Yönetimi", href: "/features/erp" },
  { icon: "Box", title: "Ürün ve Hizmetler", href: "/features/erp" },
  { icon: "Wallet", title: "Cari Hareket", href: "/features/finance" },
  { icon: "Landmark", title: "Kasa / Banka", href: "/features/finance" },
  { icon: "Package", title: "Depo & Stok", href: "/features/stock" },
  { icon: "UserCheck", title: "Müşteri Temsilcisi", href: "/features/crm" },
  { icon: "MapPin", title: "Saha Satış", href: "/modules/field-sales" },
  { icon: "Users", title: "İnsan Kaynakları", href: "/features/erp" },
  { icon: "BarChart3", title: "Ürün Maliyet", href: "/features/reports" },
  { icon: "FileText", title: "Detaylı Ürün Girişi", href: "/features/stock" },
  { icon: "FileText", title: "Teklif / Sipariş", href: "/features/erp" },
  { icon: "Truck", title: "Nakliye", href: "/features/stock" },
  { icon: "Globe", title: "Sosyal Ağ", href: "/features/crm" },
  { icon: "MessageCircle", title: "WhatsApp / E-Posta", href: "/features/crm" },
  { icon: "MapPin", title: "Kurye Takip", href: "/modules/field-sales" },
  { icon: "Wallet", title: "Canlı Kasa", href: "/features/finance" },
  { icon: "Calendar", title: "CRM Görev", href: "/features/crm" },
  { icon: "Factory", title: "Üretim Modülü", href: "/modules/production" },
  { icon: "Globe", title: "B2B Sistemi", href: "/features/erp" },
];

export const pricingPlans = [
  {
    name: "Başlangıç",
    price: "₺990",
    period: "/ay",
    desc: "Küçük ekipler için temel modüller",
    features: ["CRM & Müşteri", "Teklif/Sipariş", "E-Fatura", "5 kullanıcı", "E-posta destek"],
    featured: false,
  },
  {
    name: "Profesyonel",
    price: "₺2.490",
    period: "/ay",
    desc: "Büyüyen işletmeler için tam paket",
    features: ["Tüm Başlangıç", "Stok & Depo", "Üretim", "B2B Portal", "15 kullanıcı", "7/24 destek"],
    featured: true,
  },
  {
    name: "Kurumsal",
    price: "Özel",
    period: "",
    desc: "Enterprise entegrasyon ve SLA",
    features: ["Sınırsız modül", "API & entegrasyon", "Özel eğitim", "Dedicated destek", "SLA garantisi"],
    featured: false,
  },
];

export const blogPosts = [
  { slug: "erp-gecis-rehberi", title: "ERP Geçiş Rehberi: 7 Adımda Başarı", excerpt: "KOBİ'ler için ERP geçişinde dikkat edilmesi gerekenler.", date: "12 Haz 2026", category: "Rehber" },
  { slug: "b2b-portal-onemi", title: "B2B Portal Neden Kritik?", excerpt: "Müşterilerinizin self-servis beklentisi ve BACH çözümü.", date: "8 Haz 2026", category: "B2B" },
  { slug: "stok-yonetimi-ipuclari", title: "Stok Yönetiminde 5 Altın Kural", excerpt: "Depo verimliliğini artıran pratik öneriler.", date: "1 Haz 2026", category: "Stok" },
  { slug: "e-fatura-2026", title: "2026 E-Fatura Zorunlulukları", excerpt: "GİB düzenlemeleri ve uyum takvimi.", date: "28 May 2026", category: "E-Belge" },
  { slug: "saha-satis-dijital", title: "Saha Satışta Dijital Dönüşüm", excerpt: "Mobil CRM ile saha ekibi verimliliği.", date: "20 May 2026", category: "Satış" },
  { slug: "uretim-takip", title: "Üretim Takibinde Canlı Panel", excerpt: "Müşteriye anlık üretim görünürlüğü.", date: "15 May 2026", category: "Üretim" },
];

export const faqItems = [
  { q: "14 gün ücretsiz deneme nasıl çalışır?", a: "Kayıt olduktan sonra tüm modüllere 14 gün boyunca sınırsız erişim sağlarsınız. Kredi kartı gerekmez." },
  { q: "Verilerim güvende mi?", a: "Tüm veriler Türkiye'deki ISO 27001 sertifikalı veri merkezlerinde şifreli saklanır. KVKK uyumluyuz." },
  { q: "Mevcut sistemimden veri taşıyabilir miyim?", a: "Evet, Excel, Logo, Mikro ve diğer sistemlerden veri migrasyon desteği sunuyoruz." },
  { q: "Kaç kullanıcı ekleyebilirim?", a: "Paketinize göre 5'ten sınırsıza kadar kullanıcı ekleyebilirsiniz." },
  { q: "E-fatura entegrasyonu dahil mi?", a: "Tüm paketlerde e-fatura, e-arşiv ve e-irsaliye modülleri dahildir." },
  { q: "Mobil uygulama var mı?", a: "Evet, iOS ve Android uygulamalarımız ile saha satış, stok ve onay süreçlerini yönetebilirsiniz." },
];
