import { APP_VERSION, APP_VERSION_META } from './appVersion'

/**
 * Aktif sürümün özellik kataloğu.
 * Yeni sürüm yayınında: APP_VERSION güncelle, kategorileri yenile,
 * VERSION_CHANGELOG’a bir önceki sürüme göre eklenenleri ekle.
 */
export const VERSION_FEATURES = {
  version: APP_VERSION,
  releasedAt: APP_VERSION_META.releasedAt,
  categories: [
    {
      title: 'Güncel durum',
      features: [
        {
          title: 'Güncel durum paneli',
          detail: 'Operasyon özeti, hızlı erişim ve güncel iş durumu.',
        },
        { title: 'Duyurular', detail: 'Firma içi duyuru ve bilgilendirme alanı.' },
        { title: 'Eğitim', detail: 'Modül kullanım rehberleri ve eğitim içerikleri.' },
      ],
    },
    {
      title: 'CRM ve ajanda',
      features: [
        { title: 'Ajanda', detail: 'Görev, randevu ve not defteri tek akışta.' },
        { title: 'Görevler', detail: 'Atama, takip ve tamamlama.' },
        { title: 'Randevular', detail: 'Tarih/saatli müşteri ve iç randevular.' },
        { title: 'Note defteri', detail: 'Hızlı not ve ajanda kayıtları.' },
        {
          title: 'Fotoğraflı süreç rayı',
          detail: 'CRM süreç aşamaları, aşama fotoğrafları ve önizleme.',
        },
      ],
    },
    {
      title: 'Müşteri ve satış',
      features: [
        { title: 'Müşteriler', detail: 'Cari kart, hareketler ve belge merkezi.' },
        { title: 'Faturalar', detail: 'Satış faturaları listesi ve detay.' },
        { title: 'Satışlar raporu', detail: 'Dönemsel satış özeti.' },
        { title: 'Tahsilatlar raporu', detail: 'Tahsilat takibi ve raporlama.' },
        { title: 'Gelir gider raporu', detail: 'Gelir–gider karşılaştırması.' },
        { title: 'Müşteri bulucu', detail: 'Hızlı müşteri arama ve seçim.' },
      ],
    },
    {
      title: 'Teklif, sipariş ve üretim',
      features: [
        { title: 'Teklifler', detail: 'Teklif oluşturma, PDF ve süreç takibi.' },
        { title: 'Siparişler', detail: 'Sipariş akışı ve durum yönetimi.' },
        { title: 'Üretim takibi', detail: 'Üretim kayıtları, aşamalar ve fotoğraflı süreç.' },
        { title: 'Depo', detail: 'Depo süreçleri ve belge akışı.' },
        { title: 'Teslim edilenler', detail: 'Tamamlanan teslimat kayıtları.' },
        { title: 'Projeler', detail: 'Proje oluşturma, liste ve durum yönetimi.' },
      ],
    },
    {
      title: 'Stok',
      features: [
        { title: 'Ürünler', detail: 'Ürün kartları ve stok bilgisi.' },
        { title: 'Depolar', detail: 'Çoklu depo tanımları.' },
        { title: 'Depo transferi', detail: 'Depolar arası stok hareketi.' },
        { title: 'İrsaliyeler', detail: 'Giden ve gelen irsaliye.' },
        { title: 'Fiyat listeleri', detail: 'Ürün fiyat tarifeleri.' },
        { title: 'Stok geçmişi', detail: 'Hareket geçmişi ve izlenebilirlik.' },
        { title: 'Maliyet hesaplama', detail: 'Ürün / kutu maliyet hesaplayıcı.' },
      ],
    },
    {
      title: 'Finans ve kasa',
      features: [
        { title: 'Finans merkezi', detail: 'Finans özeti ve e-fatura sekmesi.' },
        { title: 'E-fatura', detail: 'Gelen e-fatura önizleme ve bağlantı.' },
        { title: 'Kasa / banka', detail: 'Hesaplar, hareketler ve nakit akışı.' },
        { title: 'Çekler', detail: 'Çek takibi.' },
        { title: 'Senetler', detail: 'Senet takibi.' },
        { title: 'Kasa banka raporu', detail: 'Hesap bazlı raporlar.' },
        { title: 'Nakit akış raporu', detail: 'Giriş–çıkış nakit özeti.' },
      ],
    },
    {
      title: 'Giderler',
      features: [
        { title: 'Gider listesi', detail: 'Gider kayıtları ve kategoriler.' },
        { title: 'Kredi ödemeleri', detail: 'Kredi / taksit ödemeleri.' },
        { title: 'Gelen e-faturalar', detail: 'Gider tarafı e-fatura kutusu.' },
        { title: 'Gider ve ödeme raporları', detail: 'Gider, ödeme ve KDV raporları.' },
      ],
    },
    {
      title: 'Lojistik ve saha',
      features: [
        { title: 'Lojistik', detail: 'Planlanan, yoldaki ve teslim edilen sevkiyatlar.' },
        { title: 'Kamyon yük hesaplama', detail: 'Yük planı ve kapasite hesabı.' },
        { title: 'Kurye takip', detail: 'Müşteri bağlantılı kurye izleme.' },
        { title: 'Saha satış', detail: 'Saha ziyaret, müşteri ve raporlar.' },
        { title: 'Pos', detail: 'Hızlı satış / pos ekranı.' },
      ],
    },
    {
      title: 'İnsan kaynakları',
      features: [
        { title: 'Personel', detail: 'Personel kartları ve yönetim.' },
        { title: 'Giriş / mesai', detail: 'Giriş, mesai ve izin süreçleri.' },
        { title: 'Saha ve mobil IK', detail: 'Saha personel ve mobil takip.' },
      ],
    },
    {
      title: 'Mesajlaşma ve iletişim',
      features: [
        { title: 'Mesaj merkezi', detail: 'Omnichannel konuşmalar ve atamalar.' },
        { title: 'WhatsApp hattı', detail: 'Mesaj merkezine entegre WhatsApp akışı.' },
      ],
    },
    {
      title: 'Sosyal medya',
      features: [
        { title: 'Sosyal medya paneli', detail: 'Hesap, içerik ve yayın yönetimi.' },
        { title: 'Content Studio', detail: 'İçerik üretimi ve medya kütüphanesi.' },
        { title: 'Zamanlama ve onay', detail: 'Takvim, kuyruk ve onay süreci.' },
        { title: 'Sosyal analitik', detail: 'Yayın ve etkileşim özetleri.' },
      ],
    },
    {
      title: 'Yapay zeka',
      features: [
        { title: 'AIOS', detail: 'AI işletim merkezi ve Bachy asistan.' },
        { title: 'AI organizasyon', detail: 'Kurumsal AI org yapısı.' },
        { title: 'Otonom şirket', detail: 'Otonom iş akışları.' },
        { title: 'App Builder', detail: 'AI destekli uygulama oluşturma.' },
        { title: 'Sesli asistan', detail: 'Ses tanıma ve komut desteği.' },
        { title: 'OpenAI ayarları', detail: 'Model ve API yapılandırması.' },
      ],
    },
    {
      title: 'Analitik ve belgeler',
      features: [
        { title: 'Analytics', detail: 'KPI, raporlar, tahmin ve gösterge panelleri.' },
        { title: 'Belge merkezi', detail: 'Şablon, etiket, yazdırma ve versiyonlar.' },
        { title: 'Bilgi merkezi', detail: 'Kurumsal bilgi ve dokümantasyon.' },
      ],
    },
    {
      title: 'Ayarlar ve hesap',
      features: [
        { title: 'Yönetici ayarları', detail: 'Firma, vergi, sektörel ve süreç ayarları.' },
        { title: 'Kurumsal yapı', detail: 'Şirket, şube, depo, departman ve yetkiler.' },
        { title: 'Profil ve paketler', detail: 'Kullanıcı profili, paket ve ödeme.' },
        { title: 'Sürüm paneli', detail: 'Aktif sürüm, özellik listesi ve cihaz geçişleri.' },
        {
          title: 'Otomatik yenileme',
          detail: 'Yeni yayın sonrası uygulama yenilenir; üye verileri korunur.',
        },
      ],
    },
  ],
}

/**
 * Sürümden sürüme eklenenler.
 * Sonraki yayınlarda previousVersion doldurulur; yalnızca yeni / değişen kategoriler yazılır.
 */
export const VERSION_CHANGELOG = [
  {
    version: APP_VERSION,
    previousVersion: null,
    releasedAt: APP_VERSION_META.releasedAt,
    title: 'BM-V1.726 özellik seti',
    categories: VERSION_FEATURES.categories,
  },
]

export function getVersionFeatures() {
  return VERSION_FEATURES
}

export function getVersionHistory() {
  return VERSION_CHANGELOG
}

export function getCurrentVersionCategories() {
  return VERSION_FEATURES.categories
}
