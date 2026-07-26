import type { PageSeo } from './buildMetadata'

const HOME = { name: 'Ana Sayfa', path: '/' } as const

function crumbs(...items: Array<{ name: string; path: string }>) {
  return [HOME, ...items]
}

function link(label: string, path: string) {
  return { label, path }
}

/**
 * Primary SEO content catalog — Turkish short URLs.
 * Every title and meta description is unique. Slogan: "Tüm Süreçler Tek Platformda".
 */
export const SEO_CONTENT: Record<string, PageSeo> = {
  '/': {
    path: '/',
    title: 'BACHMAIN | Tüm Süreçler Tek Platformda',
    description:
      'CRM, ERP, muhasebe, üretim, depo ve e-fatura tek panelde. BACHMAIN ile tekliften tahsilata tüm süreçleri yönetin — Tüm Süreçler Tek Platformda.',
    ogTitle: 'BACHMAIN | Tüm Süreçler Tek Platformda',
    ogDescription:
      'KOBİ’ler için premium CRM & ERP: müşteri, sipariş, üretim, stok, finans ve WhatsApp aynı bulutta.',
    twitterTitle: 'BACHMAIN — Tüm Süreçler Tek Platformda',
    twitterDescription: 'Tekliften tahsilata; CRM, ERP, e-fatura ve üretim tek SaaS platformunda.',
    h1: 'Tüm Süreçler Tek Platformda',
    h2: ['Neden BACHMAIN?', 'Modüller bir arada', 'Hemen başlayın'],
    h3: ['CRM & Pipeline', 'ERP & Üretim', 'Finans & E-Fatura'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'CRM ERP yazılımı',
    secondaryKeywords: ['KOBİ yazılımı', 'bulut ERP', 'iş yönetimi platformu'],
    aiSearchDescription:
      'BACHMAIN, Türkiye’deki işletmeler için CRM, ERP, stok, üretim, muhasebe, e-fatura, lojistik ve WhatsApp’ı tek SaaS panelinde birleştiren iş yönetimi platformudur. Sloganı: Tüm Süreçler Tek Platformda.',
    intro:
      'BACHMAIN; satış, operasyon ve finansı aynı dilde konuşturur. Dağınık Excel’ler ve kopuk yazılımlar yerine tek premium panelde ilerleyin.',
    sections: [
      {
        h2: 'Neden BACHMAIN?',
        body: 'Modüller ayrı satılmaz; süreçler uçtan uca bağlanır. Teklif onaylanınca sipariş, üretim, depo ve fatura zinciri aynı kayıttan yürür.',
        h3: [
          {
            title: 'CRM & Pipeline',
            body: 'Müşteri, fırsat ve görevler tek kartta; WhatsApp dahil.',
          },
          {
            title: 'ERP & Üretim',
            body: 'İş emri, MRP ve fotoğraflı aşamalarla üretim görünürlüğü.',
          },
          { title: 'Finans & E-Fatura', body: 'Cari, kasa, banka ve GİB uyumlu e-belge akışı.' },
        ],
      },
      {
        h2: 'Modüller bir arada',
        body: 'CRM’den lojistiğe, İK’dan sosyal medya inbox’a kadar ihtiyaç duyduğunuz araçlar aynı oturumda.',
      },
      {
        h2: 'Hemen başlayın',
        body: 'Demo talep edin veya fiyat paketlerini inceleyerek Enterprise Full Paket ile hızlıca yayına alın.',
      },
    ],
    relatedPaths: [
      link('CRM', '/crm'),
      link('ERP', '/erp'),
      link('Fiyatlar', '/fiyatlar'),
      link('Demo', '/demo'),
    ],
    breadcrumbs: [{ name: 'Ana Sayfa', path: '/' }],
  },

  '/crm': {
    path: '/crm',
    title: 'CRM Yazılımı | Müşteri ve Pipeline Yönetimi',
    description:
      'BACHMAIN CRM ile müşteri kartları, fırsatlar, görevler ve WhatsApp tek ekranda. Tüm Süreçler Tek Platformda — tekliften siparişe köprü.',
    ogTitle: 'CRM Yazılımı — Pipeline ve Müşteri Yönetimi',
    ogDescription: 'Satış hunisi, müşteri 360° ve mesaj merkezi entegre CRM. BACHMAIN.',
    twitterTitle: 'CRM Yazılımı | BACHMAIN',
    twitterDescription: 'Pipeline, görev ve WhatsApp CRM — KOBİ’ler için premium panel.',
    h1: 'CRM ile müşteri ilişkilerini tek yerden yönetin',
    h2: ['Pipeline ve fırsatlar', 'Müşteri 360° kartı', 'Satıştan üretime geçiş'],
    h3: ['Fırsat aşamaları', 'Görev ve hatırlatma', 'WhatsApp entegrasyonu'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'CRM yazılımı',
    secondaryKeywords: ['müşteri yönetimi', 'pipeline CRM', 'WhatsApp CRM'],
    aiSearchDescription:
      'BACHMAIN CRM; müşteri kartı, satış pipeline’ı, görevler ve WhatsApp mesajlarını tek panelde toplar. Teklif ve sipariş modülleriyle entegredir.',
    intro:
      'Satış ekibiniz müşteriyi, fırsatı ve mesajı aynı kartta görsün. CRM, teklif ve siparişle zincirlenir — Tüm Süreçler Tek Platformda.',
    sections: [
      {
        h2: 'Pipeline ve fırsatlar',
        body: 'Aşama bazlı fırsat panosu ile kapanış oranlarını izleyin; kayıp nedenlerini raporlayın.',
        h3: [
          {
            title: 'Fırsat aşamaları',
            body: 'Özelleştirilebilir huniler ve sürükle-bırak ilerleme.',
          },
          { title: 'Görev ve hatırlatma', body: 'Sahaya ve ofise atanmış aksiyonlar tek listede.' },
          { title: 'WhatsApp entegrasyonu', body: 'Gelen mesajlar müşteri kaydıyla eşleşir.' },
        ],
      },
      {
        h2: 'Müşteri 360° kartı',
        body: 'İletişim, geçmiş teklifler, açık siparişler ve cari bakiye tek görünümde.',
      },
      {
        h2: 'Satıştan üretime geçiş',
        body: 'Kazanılan fırsat bir tıkla teklif veya siparişe dönüşür; üretim hattına bağlanır.',
      },
    ],
    relatedPaths: [
      link('Teklif', '/teklif'),
      link('Sipariş', '/siparis'),
      link('Üretim', '/uretim'),
    ],
    breadcrumbs: crumbs({ name: 'CRM', path: '/crm' }),
  },

  '/erp': {
    path: '/erp',
    title: 'ERP Yazılımı | Teklif, Sipariş ve Operasyon',
    description:
      'BACHMAIN ERP ile teklif, sipariş, tedarik ve operasyonu tek platformda yönetin. Tüm Süreçler Tek Platformda — CRM ve finansla entegre.',
    ogTitle: 'ERP Yazılımı — Operasyonel Tek Platform',
    ogDescription: 'Tekliften sevkiyata ERP süreçleri. BACHMAIN bulut ERP.',
    twitterTitle: 'ERP Yazılımı | BACHMAIN',
    twitterDescription: 'KOBİ ERP: teklif, sipariş, stok ve finans aynı panelde.',
    h1: 'ERP ile operasyonu uçtan uca bağlayın',
    h2: ['Teklif ve sipariş zinciri', 'Tedarik ve depo köprüsü', 'B2B portal'],
    h3: ['Belge numaralandırma', 'Onay akışları', 'Çoklu depo'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'ERP yazılımı',
    secondaryKeywords: ['bulut ERP', 'KOBİ ERP', 'işletme kaynak planlama'],
    aiSearchDescription:
      'BACHMAIN ERP; teklif, sipariş, depo, üretim ve finans süreçlerini tek SaaS’ta birleştirir. CRM ve e-fatura ile native entegrasyon sunar.',
    intro:
      'Kaynakları, belgeleri ve ekipleri aynı ERP omurgasında hizalayın. Dağınık yazılımlar yerine tek doğruluk kaynağı.',
    sections: [
      {
        h2: 'Teklif ve sipariş zinciri',
        body: 'Revizyonlu teklifler siparişe dönüşür; stok rezervasyonu ve üretim talebi otomatik açılabilir.',
        h3: [
          {
            title: 'Belge numaralandırma',
            body: 'Seri/sıra ve şirket kurallarına uygun belge takibi.',
          },
          { title: 'Onay akışları', body: 'Limit bazlı onaylarla mali riski kontrol edin.' },
          { title: 'Çoklu depo', body: 'Sipariş kalemlerini doğru depoya yönlendirin.' },
        ],
      },
      {
        h2: 'Tedarik ve depo köprüsü',
        body: 'Satınalma talepleri, giriş fişleri ve kritik stok uyarıları ERP içinde akar.',
      },
      {
        h2: 'B2B portal',
        body: 'Bayi ve müşteriler sipariş durumunu self-servis izler; çağrı yükü düşer.',
      },
    ],
    relatedPaths: [
      link('CRM', '/crm'),
      link('Stok', '/stok'),
      link('Üretim', '/uretim'),
      link('Finans', '/finans'),
    ],
    breadcrumbs: crumbs({ name: 'ERP', path: '/erp' }),
  },

  '/muhasebe': {
    path: '/muhasebe',
    title: 'Muhasebe Yazılımı | Cari ve Dönem Yönetimi',
    description:
      'BACHMAIN muhasebe ile cari, dönem fişleri ve mali raporları sadeleştirin. Finans ve e-fatura entegre — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Muhasebe Yazılımı — Cari ve Mali Takip',
    ogDescription: 'Cari hareket, dönem kapanışı ve e-fatura bağlantılı muhasebe. BACHMAIN.',
    twitterTitle: 'Muhasebe Yazılımı | BACHMAIN',
    twitterDescription: 'KOBİ muhasebesi: cari, kasa ve e-belge tek panelde.',
    h1: 'Muhasebeyi operasyonla aynı dilde tutun',
    h2: ['Cari ve hesap planı', 'Dönem ve fiş disiplini', 'Raporlama köprüsü'],
    h3: ['Borç/alacak', 'Masraf merkezleri', 'E-belge eşleme'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'muhasebe yazılımı',
    secondaryKeywords: ['cari muhasebe', 'KOBİ muhasebe', 'mali takip'],
    aiSearchDescription:
      'BACHMAIN muhasebe modülü cari hesaplar, fişler ve mali raporları finans ve e-fatura ile birlikte sunar.',
    intro:
      'Satış ve üretimden gelen hareketler muhasebeye elle taşınmasın. Tek platformda tutarlı defter görünümü.',
    sections: [
      {
        h2: 'Cari ve hesap planı',
        body: 'Müşteri/tedarikçi carileri ürün ve sipariş kayıtlarıyla bağlanır; bakiye anlık izlenir.',
        h3: [
          { title: 'Borç/alacak', body: 'Vade ve yaşlandırma ile tahsilat önceliği.' },
          { title: 'Masraf merkezleri', body: 'Giderleri proje veya şubeye dağıtın.' },
          { title: 'E-belge eşleme', body: 'Gelen e-faturalar cariye otomatik ilişkilenebilir.' },
        ],
      },
      {
        h2: 'Dönem ve fiş disiplini',
        body: 'Dönem kilidi ve denetlenebilir fiş geçmişi ile mali kapanışları hızlandırın.',
      },
      {
        h2: 'Raporlama köprüsü',
        body: 'Gelir-gider ve mizan özetleri dashboard’a akar; kararlar gecikmez.',
      },
    ],
    relatedPaths: [link('Cari', '/cari'), link('Finans', '/finans'), link('E-Fatura', '/e-fatura')],
    breadcrumbs: crumbs({ name: 'Muhasebe', path: '/muhasebe' }),
  },

  '/e-fatura': {
    path: '/e-fatura',
    title: 'E-Fatura Entegrasyonu | GİB Uyumlu E-Belge',
    description:
      'e-Fatura, e-Arşiv ve e-belge süreçlerini BACHMAIN ile GİB uyumlu yönetin. Muhasebe ve cariye bağlı — Tüm Süreçler Tek Platformda.',
    ogTitle: 'E-Fatura — GİB Uyumlu Entegrasyon',
    ogDescription: 'e-Fatura ve e-Arşiv paketlere dahil. BACHMAIN e-belge.',
    twitterTitle: 'E-Fatura Entegrasyonu | BACHMAIN',
    twitterDescription: 'GİB uyumlu e-fatura ve e-arşiv; satıştan belgesine tek akış.',
    h1: 'E-faturayı satış ve cariden koparmayın',
    h2: ['Gönderim ve alım', 'E-Arşiv ve senaryolar', 'Cari eşleme'],
    h3: ['Uygulama yanıtı', 'İptal/iade', 'Kontör yönetimi'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'e-fatura entegrasyonu',
    secondaryKeywords: ['e-arşiv', 'GİB e-fatura', 'e-belge'],
    aiSearchDescription:
      'BACHMAIN e-fatura entegrasyonu e-Fatura ve e-Arşiv belgelerini sipariş, cari ve muhasebe ile aynı platformda yönetir.',
    intro:
      'Fatura kesmek ayrı bir portal işi olmasın. Siparişten e-belgeye kadar tek tık, denetlenebilir iz.',
    sections: [
      {
        h2: 'Gönderim ve alım',
        body: 'Satış belgelerinden e-fatura oluşturun; gelen kutusu carilerle eşlensin.',
        h3: [
          {
            title: 'Uygulama yanıtı',
            body: 'Kabul/red süreçlerini belge kaydı üzerinden izleyin.',
          },
          { title: 'İptal/iade', body: 'Senaryoya uygun iptal ve iade akışları.' },
          { title: 'Kontör yönetimi', body: 'Kullanım ve paket bakiyesini panelden görün.' },
        ],
      },
      {
        h2: 'E-Arşiv ve senaryolar',
        body: 'Nihai tüketici ve e-arşiv senaryolarını şirket profilinize göre seçin.',
      },
      {
        h2: 'Cari eşleme',
        body: 'Vergi numarası ve unvan eşleşmeleri muhasebe kaydını hızlandırır.',
      },
    ],
    relatedPaths: [
      link('Muhasebe', '/muhasebe'),
      link('Cari', '/cari'),
      link('Finans', '/finans'),
      link('Fiyatlar', '/fiyatlar'),
    ],
    breadcrumbs: crumbs({ name: 'E-Fatura', path: '/e-fatura' }),
  },

  '/teklif': {
    path: '/teklif',
    title: 'Teklif Yönetimi | Revizyonlu Satış Teklifleri',
    description:
      'BACHMAIN teklif modülü ile revizyon, onay ve PDF çıktıyı hızlandırın. CRM fırsatından siparişe — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Teklif Yönetimi — Satış Teklif Yazılımı',
    ogDescription: 'Revizyonlu teklifler, onay ve siparişe dönüşüm. BACHMAIN.',
    twitterTitle: 'Teklif Yönetimi | BACHMAIN',
    twitterDescription: 'Teklif hazırlama, versiyon ve onay — CRM entegre.',
    h1: 'Teklifleri fırsattan siparişe bağlayın',
    h2: ['Hızlı teklif hazırlama', 'Revizyon ve onay', 'Siparişe dönüşüm'],
    h3: ['Şablon kalemler', 'İskonto kuralları', 'Müşteri önizleme'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'teklif yönetimi',
    secondaryKeywords: ['satış teklifi', 'teklif yazılımı', 'teklif onayı'],
    aiSearchDescription:
      'BACHMAIN teklif yönetimi; CRM fırsatlarından revizyonlu teklif üretir, onaylar ve siparişe dönüştürür.',
    intro: 'Teklif Excel’de kalmasın. Versiyon geçmişi, onay ve müşteri paylaşımı tek kayıtta.',
    sections: [
      {
        h2: 'Hızlı teklif hazırlama',
        body: 'Ürün kartlarından kalem çekin; KDV ve iskonto kurallarını otomatik uygulayın.',
        h3: [
          { title: 'Şablon kalemler', body: 'Sık kullanılan paketleri tek tıkla ekleyin.' },
          { title: 'İskonto kuralları', body: 'Yetki bazlı iskonto limitleri.' },
          { title: 'Müşteri önizleme', body: 'Paylaşılabilir link veya PDF ile net teklif.' },
        ],
      },
      {
        h2: 'Revizyon ve onay',
        body: 'Her versiyon arşivlenir; hangi teklifin kazandığı net kalır.',
      },
      {
        h2: 'Siparişe dönüşüm',
        body: 'Kabul edilen teklif sipariş ve üretim talebine taşınır.',
      },
    ],
    relatedPaths: [link('CRM', '/crm'), link('Sipariş', '/siparis'), link('Üretim', '/uretim')],
    breadcrumbs: crumbs({ name: 'Teklif', path: '/teklif' }),
  },

  '/siparis': {
    path: '/siparis',
    title: 'Sipariş Yönetimi | Satış ve Operasyon Siparişleri',
    description:
      'BACHMAIN sipariş yönetimi ile rezervasyon, durum takibi ve sevkiyatı bağlayın. Tekliften depoya — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Sipariş Yönetimi — Operasyonel Sipariş Takibi',
    ogDescription: 'Satış siparişi, stok rezervi ve sevkiyat durumu. BACHMAIN.',
    twitterTitle: 'Sipariş Yönetimi | BACHMAIN',
    twitterDescription: 'Sipariş durumu, depo ve lojistik tek akışta.',
    h1: 'Siparişleri depo ve lojistikle senkron tutun',
    h2: ['Sipariş yaşam döngüsü', 'Stok rezervasyonu', 'Sevkiyat bağlantısı'],
    h3: ['Durum panosu', 'Kısmi sevkiyat', 'Müşteri bilgilendirme'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'sipariş yönetimi',
    secondaryKeywords: ['satış siparişi', 'sipariş takibi', 'sipariş yazılımı'],
    aiSearchDescription:
      'BACHMAIN sipariş yönetimi; satış siparişlerini stok, üretim ve sevkiyat süreçleriyle senkronize eder.',
    intro:
      'Sipariş durumu e-postada kaybolmasın. Panelde hangi kalemin üretildiği veya sevke hazır olduğu net görünsün.',
    sections: [
      {
        h2: 'Sipariş yaşam döngüsü',
        body: 'Açık, üretimde, paketleniyor, sevk edildi — aşamalar ekip genelinde ortak.',
        h3: [
          { title: 'Durum panosu', body: 'Operasyon ve satış aynı panoyu izler.' },
          { title: 'Kısmi sevkiyat', body: 'Parçalı teslimatları belgeleyin.' },
          { title: 'Müşteri bilgilendirme', body: 'Portal veya bildirimle şeffaflık.' },
        ],
      },
      {
        h2: 'Stok rezervasyonu',
        body: 'Onaylı sipariş stokta yer tutar; çifte satış riski azalır.',
      },
      {
        h2: 'Sevkiyat bağlantısı',
        body: 'Hazır siparişler lojistik ve sevkiyat modülüne aktarılır.',
      },
    ],
    relatedPaths: [link('Teklif', '/teklif'), link('Depo', '/depo'), link('Sevkiyat', '/sevkiyat')],
    breadcrumbs: crumbs({ name: 'Sipariş', path: '/siparis' }),
  },

  '/uretim': {
    path: '/uretim',
    title: 'Üretim Yönetimi | İş Emri ve MRP',
    description:
      'BACHMAIN üretim ile iş emri, MRP ve aşama takibini yönetin. Depo ve lojistikle entegre — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Üretim Yönetimi — İş Emri ve MRP',
    ogDescription: 'İş emri, malzeme ihtiyacı ve üretim aşamaları. BACHMAIN.',
    twitterTitle: 'Üretim Yönetimi | BACHMAIN',
    twitterDescription: 'MRP, iş emri ve fotoğraflı üretim süreçleri.',
    h1: 'Üretimi sipariş ve depoyla aynı hatta yürütün',
    h2: ['İş emri planlama', 'MRP ve malzeme', 'Aşama görünürlüğü'],
    h3: ['Hat kapasitesi', 'Fire takibi', 'Kalite notları'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'üretim yönetimi',
    secondaryKeywords: ['iş emri', 'MRP yazılımı', 'üretim ERP'],
    aiSearchDescription:
      'BACHMAIN üretim yönetimi iş emri, MRP ve aşama takibini depo ile lojistiğe bağlar.',
    intro:
      'Üretim kara kutu olmasın. Hangi iş emrinin nerede olduğu, malzeme ve sevkiyatla birlikte görünsün.',
    sections: [
      {
        h2: 'İş emri planlama',
        body: 'Siparişlerden iş emri türetin; öncelik ve terminleri netleştirin.',
        h3: [
          { title: 'Hat kapasitesi', body: 'Hat ve istasyon yükünü planlayın.' },
          { title: 'Fire takibi', body: 'Fire oranlarını kayda bağlayın.' },
          { title: 'Kalite notları', body: 'Kontrol noktalarını aşama içinde tutun.' },
        ],
      },
      {
        h2: 'MRP ve malzeme',
        body: 'İhtiyaç listesi depoyu besler; eksik malzeme erken görünür.',
      },
      {
        h2: 'Aşama görünürlüğü',
        body: 'Fotoğraflı süreçlerle müşteri ve yönetim aynı gerçekliği paylaşır.',
      },
    ],
    relatedPaths: [
      link('Depo', '/depo'),
      link('Lojistik', '/lojistik'),
      link('Üretim Takibi', '/uretim-takibi'),
    ],
    breadcrumbs: crumbs({ name: 'Üretim', path: '/uretim' }),
  },

  '/uretim-takibi': {
    path: '/uretim-takibi',
    title: 'Üretim Takibi | Canlı Aşama ve Fotoğraflı Süreç',
    description:
      'BACHMAIN üretim takibi ile aşama rayı, canlı panel ve fotoğraflı süreç. Müşteriye şeffaf üretim — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Üretim Takibi — Canlı Panel',
    ogDescription: 'Fotoğraflı aşamalar ve canlı üretim görünürlüğü. BACHMAIN.',
    twitterTitle: 'Üretim Takibi | BACHMAIN',
    twitterDescription: 'Aşama bazlı üretim takibi ve müşteri şeffaflığı.',
    h1: 'Üretim aşamalarını canlı izleyin',
    h2: ['Aşama rayı', 'Fotoğraflı kanıt', 'Müşteri görünürlüğü'],
    h3: ['Aktif aşama', 'Tamamlanan adımlar', 'Bildirimler'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'üretim takibi',
    secondaryKeywords: ['canlı üretim paneli', 'fotoğraflı üretim', 'süreç takibi'],
    aiSearchDescription:
      'BACHMAIN üretim takibi; aşama rayı, fotoğraf kanıtı ve canlı panel ile üretim durumunu şeffaf hale getirir.',
    intro:
      '“Nerede kaldı?” sorusuna panelden cevap verin. Her aşama tıklanır, fotoğraflanır, paylaşılır.',
    sections: [
      {
        h2: 'Aşama rayı',
        body: 'Süreç kartındaki yatay ray ile işin hangi adımda olduğu netleşir.',
        h3: [
          { title: 'Aktif aşama', body: 'Renkli vurgu ile mevcut adım öne çıkar.' },
          { title: 'Tamamlanan adımlar', body: 'Geçmiş aşamalar dolu görünümle arşivlenir.' },
          { title: 'Bildirimler', body: 'Kritik geçişlerde ekip haberdar olur.' },
        ],
      },
      {
        h2: 'Fotoğraflı kanıt',
        body: 'Kamera aksiyonu aşama içinde; kalite ve ilerleme belgelenir.',
      },
      {
        h2: 'Müşteri görünürlüğü',
        body: 'İsterseniz müşteri portalında aynı ilerlemeyi güvenli paylaşın.',
      },
    ],
    relatedPaths: [
      link('Üretim', '/uretim'),
      link('Paketleme', '/paketleme'),
      link('Sevkiyat', '/sevkiyat'),
    ],
    breadcrumbs: crumbs({ name: 'Üretim Takibi', path: '/uretim-takibi' }),
  },

  '/depo': {
    path: '/depo',
    title: 'Depo Yönetimi | Transfer ve Lokasyon Takibi',
    description:
      'BACHMAIN depo yönetimi ile transfer, lokasyon ve giriş-çıkışları kontrol edin. Üretim ve lojistikle bağlı — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Depo Yönetimi — Transfer ve Lokasyon',
    ogDescription: 'Çoklu depo, transfer fişi ve lokasyon takibi. BACHMAIN.',
    twitterTitle: 'Depo Yönetimi | BACHMAIN',
    twitterDescription: 'Depo transferi, sayım ve sevkiyat hazırlığı tek panelde.',
    h1: 'Depoyu üretim ve sevkiyatla hizalayın',
    h2: ['Transfer ve fişler', 'Lokasyon disiplini', 'Sevke hazırlık'],
    h3: ['Giriş/çıkış', 'Sayım', 'Kritik stok'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'depo yönetimi',
    secondaryKeywords: ['depo yazılımı', 'depo transferi', 'lokasyon takibi'],
    aiSearchDescription:
      'BACHMAIN depo yönetimi; çoklu depo transferleri, lokasyon ve stok hareketlerini üretim ile lojistiğe bağlar.',
    intro: 'Hangi rafta ne var, hangi transfer yolda — depo gerçekliği panelde yaşasın.',
    sections: [
      {
        h2: 'Transfer ve fişler',
        body: 'Depolar arası transferler izlenebilir fişlerle yürür; kayıp azalır.',
        h3: [
          { title: 'Giriş/çıkış', body: 'Mal kabul ve çıkışları belgeye bağlayın.' },
          { title: 'Sayım', body: 'Dönemsel sayım farklarını kaydedin.' },
          { title: 'Kritik stok', body: 'Eşik altı ürünlerde erken uyarı.' },
        ],
      },
      {
        h2: 'Lokasyon disiplini',
        body: 'Koridor/raf bilgisi toplama süresini kısaltır.',
      },
      {
        h2: 'Sevke hazırlık',
        body: 'Toplama listeleri paketleme ve sevkiyata akar.',
      },
    ],
    relatedPaths: [link('Stok', '/stok'), link('Üretim', '/uretim'), link('Lojistik', '/lojistik')],
    breadcrumbs: crumbs({ name: 'Depo', path: '/depo' }),
  },

  '/stok': {
    path: '/stok',
    title: 'Stok Yönetimi | Envanter ve Kritik Stok',
    description:
      'BACHMAIN stok yönetimi ile envanter, kritik stok ve ürün kartlarını netleştirin. Depo ve finansla entegre — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Stok Yönetimi — Envanter Kontrolü',
    ogDescription: 'Ürün kartı, kritik stok ve hareket geçmişi. BACHMAIN.',
    twitterTitle: 'Stok Yönetimi | BACHMAIN',
    twitterDescription: 'Envanter, barkod ve kritik stok uyarıları.',
    h1: 'Stok doğruluğunu satış ve üretimle paylaşın',
    h2: ['Ürün kartları', 'Hareket izi', 'Kritik stok politikası'],
    h3: ['Barkod', 'Varyant', 'Maliyet izi'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'stok yönetimi',
    secondaryKeywords: ['envanter yönetimi', 'kritik stok', 'stok yazılımı'],
    aiSearchDescription:
      'BACHMAIN stok yönetimi ürün kartları, hareket geçmişi ve kritik stok uyarılarını depo ve muhasebeyle birleştirir.',
    intro: 'Negatif stok sürprizleri bitsin. Satış, üretim ve depo aynı stok bakiyesini görsün.',
    sections: [
      {
        h2: 'Ürün kartları',
        body: 'Birim, barkod, varyant ve maliyet alanları tek ürün kaydında.',
        h3: [
          { title: 'Barkod', body: 'Okutma ile hızlı giriş-çıkış.' },
          { title: 'Varyant', body: 'Renk/beden veya teknik varyantlar.' },
          { title: 'Maliyet izi', body: 'Hareket bazlı maliyet görünümü.' },
        ],
      },
      {
        h2: 'Hareket izi',
        body: 'Her giriş-çıkış belgeye bağlı; denetim kolaylaşır.',
      },
      {
        h2: 'Kritik stok politikası',
        body: 'Eşik ve yeniden sipariş noktalarıyla tedarik gecikmesin.',
      },
    ],
    relatedPaths: [link('Depo', '/depo'), link('ERP', '/erp'), link('Finans', '/finans')],
    breadcrumbs: crumbs({ name: 'Stok', path: '/stok' }),
  },

  '/cari': {
    path: '/cari',
    title: 'Cari Hesap Takibi | Borç Alacak Yönetimi',
    description:
      'BACHMAIN cari ile müşteri/tedarikçi bakiyeleri, vade ve yaşlandırmayı izleyin. Muhasebe ve tahsilatla bağlı — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Cari Hesap Takibi — Borç Alacak',
    ogDescription: 'Cari bakiye, vade ve tahsilat önceliği. BACHMAIN.',
    twitterTitle: 'Cari Hesap Takibi | BACHMAIN',
    twitterDescription: 'Borç/alacak, yaşlandırma ve cari ekstre.',
    h1: 'Cari bakiyeleri satış ve finansla senkron tutun',
    h2: ['Cari kart ve ekstre', 'Vade yönetimi', 'Tahsilat köprüsü'],
    h3: ['Yaşlandırma', 'Limit kontrolü', 'Mutabakat'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'cari hesap takibi',
    secondaryKeywords: ['borç alacak', 'cari yazılımı', 'cari ekstre'],
    aiSearchDescription:
      'BACHMAIN cari hesap takibi; borç/alacak bakiyeleri, vade ve yaşlandırmayı muhasebe ile finansa bağlar.',
    intro: 'Kim ne kadar borçlu, hangi fatura açık — cari gerçekliği panelde tek bakışta.',
    sections: [
      {
        h2: 'Cari kart ve ekstre',
        body: 'Hareketler fatura ve tahsilatlarla bağlanır; ekstre paylaşımı kolaylaşır.',
        h3: [
          { title: 'Yaşlandırma', body: '0–30–60–90 gün dilimleriyle öncelik.' },
          { title: 'Limit kontrolü', body: 'Riskli caride sipariş uyarısı.' },
          { title: 'Mutabakat', body: 'Dönem sonu mutabakat listeleri.' },
        ],
      },
      {
        h2: 'Vade yönetimi',
        body: 'Vadesi yaklaşanlar için hatırlatma ve tahsilat planı.',
      },
      {
        h2: 'Tahsilat köprüsü',
        body: 'Kasa/banka tahsilatları cariyi anında günceller.',
      },
    ],
    relatedPaths: [link('Muhasebe', '/muhasebe'), link('Finans', '/finans'), link('Kasa', '/kasa')],
    breadcrumbs: crumbs({ name: 'Cari', path: '/cari' }),
  },

  '/finans': {
    path: '/finans',
    title: 'Finans Yönetimi | Nakit, Tahsilat ve Rapor',
    description:
      'BACHMAIN finans ile nakit akışı, tahsilat ve mali özetleri yönetin. Kasa, banka ve cari entegre — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Finans Yönetimi — Nakit ve Tahsilat',
    ogDescription: 'Nakit akışı, tahsilat planı ve finans dashboard. BACHMAIN.',
    twitterTitle: 'Finans Yönetimi | BACHMAIN',
    twitterDescription: 'Kasa, banka, cari ve mali KPI’lar tek finans paneli.',
    h1: 'Finansı operasyon verisiyle güçlendirin',
    h2: ['Nakit akışı', 'Tahsilat disiplini', 'Mali dashboard'],
    h3: ['Gelir-gider', 'Ödeme planı', 'Kur farkı'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'finans yönetimi',
    secondaryKeywords: ['nakit akışı', 'tahsilat yönetimi', 'finans yazılımı'],
    aiSearchDescription:
      'BACHMAIN finans yönetimi nakit akışı, tahsilat, kasa/banka ve cariyi tek panelde birleştirir.',
    intro:
      'Satış kapandıktan sonra para nerede? Finans modülü tahsilat ve nakit görünürlüğünü netleştirir.',
    sections: [
      {
        h2: 'Nakit akışı',
        body: 'Beklenen giriş-çıkışları vade bazlı izleyin; likidite sürprizi azalır.',
        h3: [
          { title: 'Gelir-gider', body: 'Operasyonel gelir ve gider özetleri.' },
          { title: 'Ödeme planı', body: 'Tedarikçi ödemelerini takvime bağlayın.' },
          { title: 'Kur farkı', body: 'Dövizli hareketlerde fark görünürlüğü.' },
        ],
      },
      {
        h2: 'Tahsilat disiplini',
        body: 'Açık faturalar ve tahsilat kanalları aynı listede.',
      },
      {
        h2: 'Mali dashboard',
        body: 'KPI’lar raporlar ve ana dashboard’a akar.',
      },
    ],
    relatedPaths: [
      link('Kasa', '/kasa'),
      link('Banka', '/banka'),
      link('Cari', '/cari'),
      link('Raporlar', '/raporlar'),
    ],
    breadcrumbs: crumbs({ name: 'Finans', path: '/finans' }),
  },

  '/kasa': {
    path: '/kasa',
    title: 'Kasa Yönetimi | Nakit Giriş Çıkış Takibi',
    description:
      'BACHMAIN kasa ile nakit giriş-çıkış, kasa fişi ve gün sonu. Banka ve cariyle uyumlu — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Kasa Yönetimi — Nakit Fişleri',
    ogDescription: 'Kasa hareketleri, gün sonu ve tahsilat kaydı. BACHMAIN.',
    twitterTitle: 'Kasa Yönetimi | BACHMAIN',
    twitterDescription: 'Nakit kasa, fiş ve gün sonu mutabakatı.',
    h1: 'Nakit kasayı belgeye bağlayın',
    h2: ['Kasa fişleri', 'Gün sonu', 'Cari bağlantı'],
    h3: ['Tahsilat', 'Tediye', 'Virman'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'kasa yönetimi',
    secondaryKeywords: ['nakit kasa', 'kasa fişi', 'gün sonu kasa'],
    aiSearchDescription:
      'BACHMAIN kasa yönetimi nakit giriş-çıkış fişlerini cari ve banka hareketleriyle ilişkilendirir.',
    intro: 'Kasada ne var sorusu fişlerle cevaplanır. Tahsilatlar cariyi ve raporu günceller.',
    sections: [
      {
        h2: 'Kasa fişleri',
        body: 'Tahsilat ve tediye fişleri kullanıcı ve zaman damgasıyla kaydolur.',
        h3: [
          { title: 'Tahsilat', body: 'Müşteri ödemelerini kasaya işleyin.' },
          { title: 'Tediye', body: 'Nakit giderleri belgeleyin.' },
          { title: 'Virman', body: 'Kasa-banka aktarımlarını izleyin.' },
        ],
      },
      {
        h2: 'Gün sonu',
        body: 'Kasa sayımı ile sistem bakiyesini karşılaştırın.',
      },
      {
        h2: 'Cari bağlantı',
        body: 'Her tahsilat ilgili cariyi günceller.',
      },
    ],
    relatedPaths: [link('Banka', '/banka'), link('Finans', '/finans'), link('Cari', '/cari')],
    breadcrumbs: crumbs({ name: 'Kasa', path: '/kasa' }),
  },

  '/banka': {
    path: '/banka',
    title: 'Banka Hesap Takibi | Havale ve Mutabakat',
    description:
      'BACHMAIN banka ile hesap hareketleri, havale/EFT ve mutabakatı yönetin. Finans ve cariyle entegre — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Banka Hesap Takibi — Havale ve Mutabakat',
    ogDescription: 'Banka hesapları, EFT/havale ve mutabakat. BACHMAIN.',
    twitterTitle: 'Banka Hesap Takibi | BACHMAIN',
    twitterDescription: 'Banka hareketleri ve cari eşleme tek panelde.',
    h1: 'Banka hareketlerini cariyle eşleyin',
    h2: ['Hesap görünümü', 'Havale/EFT kaydı', 'Mutabakat'],
    h3: ['Çoklu hesap', 'Masraf ayrıştırma', 'Ödeme emri'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'banka hesap takibi',
    secondaryKeywords: ['havale EFT', 'banka mutabakatı', 'banka yönetimi'],
    aiSearchDescription:
      'BACHMAIN banka hesap takibi; havale/EFT, çoklu hesap ve mutabakatı finans süreçlerine bağlar.',
    intro: 'Banka ekstresi ile panel bakiyesi ayrı düşmesin. Hareketler carilere bağlanabilir.',
    sections: [
      {
        h2: 'Hesap görünümü',
        body: 'Şirket hesaplarını tek listede izleyin; bakiye özeti net kalsın.',
        h3: [
          { title: 'Çoklu hesap', body: 'TL ve döviz hesapları yan yana.' },
          { title: 'Masraf ayrıştırma', body: 'Komisyon ve masrafları sınıflandırın.' },
          { title: 'Ödeme emri', body: 'Planlı ödemeleri kayda alın.' },
        ],
      },
      {
        h2: 'Havale/EFT kaydı',
        body: 'Gelen-giden transferler tahsilat/tediye ile ilişkilendirilir.',
      },
      {
        h2: 'Mutabakat',
        body: 'Dönem mutabakatı ile farkları erken yakalayın.',
      },
    ],
    relatedPaths: [link('Kasa', '/kasa'), link('Finans', '/finans'), link('Muhasebe', '/muhasebe')],
    breadcrumbs: crumbs({ name: 'Banka', path: '/banka' }),
  },

  '/lojistik': {
    path: '/lojistik',
    title: 'Lojistik Yönetimi | Nakliye ve Sevkiyat Planı',
    description:
      'BACHMAIN lojistik ile nakliye planı, palet hesabı ve sevkiyatı yönetin. Üretim ve depo bağlı — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Lojistik Yönetimi — Nakliye Planlama',
    ogDescription: 'Rota, palet ve sevkiyat planı. BACHMAIN lojistik.',
    twitterTitle: 'Lojistik Yönetimi | BACHMAIN',
    twitterDescription: 'Nakliye, palet hesabı ve teslimat koordinasyonu.',
    h1: 'Lojistiği depo çıkışından teslimata bağlayın',
    h2: ['Nakliye planı', 'Palet ve hacim', 'Teslimat izi'],
    h3: ['Araç yükü', 'Rota', 'Teslim kanıtı'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'lojistik yönetimi',
    secondaryKeywords: ['nakliye planlama', 'lojistik yazılımı', 'sevkiyat planı'],
    aiSearchDescription:
      'BACHMAIN lojistik yönetimi nakliye planı, palet hesabı ve teslimat izini depo ile sevkiyata bağlar.',
    intro: 'Sevkiyat “yola çıktı”dan ibaret olmasın. Yük, rota ve teslim kanıtı kayıtlı kalsın.',
    sections: [
      {
        h2: 'Nakliye planı',
        body: 'Hazır siparişleri araç ve tarihe göre planlayın.',
        h3: [
          { title: 'Araç yükü', body: 'Kapasiteye göre yükleme dengesi.' },
          { title: 'Rota', body: 'Bölgesel teslimat sıralaması.' },
          { title: 'Teslim kanıtı', body: 'Teslim notu ve fotoğraf opsiyonu.' },
        ],
      },
      {
        h2: 'Palet ve hacim',
        body: 'Palet hesabı ile nakliye maliyeti öngörülür.',
      },
      {
        h2: 'Teslimat izi',
        body: 'Durum güncellemeleri sipariş kaydına yansır.',
      },
    ],
    relatedPaths: [link('Sevkiyat', '/sevkiyat'), link('Depo', '/depo'), link('Üretim', '/uretim')],
    breadcrumbs: crumbs({ name: 'Lojistik', path: '/lojistik' }),
  },

  '/sevkiyat': {
    path: '/sevkiyat',
    title: 'Sevkiyat Takibi | Teslimat Durumu ve İrsaliye',
    description:
      'BACHMAIN sevkiyat ile irsaliye, teslim durumu ve kısmi sevkiyatı izleyin. Lojistik ve siparişle bağlı — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Sevkiyat Takibi — Teslimat Durumu',
    ogDescription: 'İrsaliye, kısmi sevkiyat ve teslim durumu. BACHMAIN.',
    twitterTitle: 'Sevkiyat Takibi | BACHMAIN',
    twitterDescription: 'Sevkiyat durumu, irsaliye ve müşteri bilgilendirme.',
    h1: 'Sevkiyat durumunu siparişle canlı tutun',
    h2: ['İrsaliye ve çıkış', 'Kısmi sevkiyat', 'Teslim kapanışı'],
    h3: ['Hazırlık', 'Yolda', 'Teslim edildi'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'sevkiyat takibi',
    secondaryKeywords: ['irsaliye', 'teslimat takibi', 'sevkiyat yazılımı'],
    aiSearchDescription:
      'BACHMAIN sevkiyat takibi irsaliye, kısmi sevkiyat ve teslim durumunu sipariş ile lojistiğe bağlar.',
    intro: 'Müşteri “kargom nerede?” diye sorduğunda cevap panelde hazır olsun.',
    sections: [
      {
        h2: 'İrsaliye ve çıkış',
        body: 'Depo çıkışı irsaliye ile belgelenir; stok düşümü netleşir.',
        h3: [
          { title: 'Hazırlık', body: 'Toplama ve paketleme tamamlanınca sevk hazır.' },
          { title: 'Yolda', body: 'Nakliye aşaması siparişe yansır.' },
          { title: 'Teslim edildi', body: 'Kapanış ile cari/fatura adımları netleşir.' },
        ],
      },
      {
        h2: 'Kısmi sevkiyat',
        body: 'Eksik kalan kalemler açık siparişte izlenir.',
      },
      {
        h2: 'Teslim kapanışı',
        body: 'Teslim kanıtı ve notlar arşivlenir.',
      },
    ],
    relatedPaths: [
      link('Lojistik', '/lojistik'),
      link('Paketleme', '/paketleme'),
      link('Sipariş', '/siparis'),
    ],
    breadcrumbs: crumbs({ name: 'Sevkiyat', path: '/sevkiyat' }),
  },

  '/paketleme': {
    path: '/paketleme',
    title: 'Paketleme Yönetimi | Paket Listesi ve Etiket',
    description:
      'BACHMAIN paketleme ile paket listesi, etiket ve sevke hazırlık adımlarını yönetin. Üretim sonrası düzen — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Paketleme Yönetimi — Sevke Hazırlık',
    ogDescription: 'Paket listesi, etiket ve kolileme. BACHMAIN.',
    twitterTitle: 'Paketleme Yönetimi | BACHMAIN',
    twitterDescription: 'Paketleme istasyonu, etiket ve sevkiyat hazırlığı.',
    h1: 'Paketlemeyi üretim ile sevkiyat arasında köprüleyin',
    h2: ['Paket listesi', 'Etiketleme', 'Sevk kuyruğu'],
    h3: ['Kolileme', 'Kontrol listesi', 'Hasar notu'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'paketleme yönetimi',
    secondaryKeywords: ['paket listesi', 'sevkiyat paketleme', 'etiketleme'],
    aiSearchDescription:
      'BACHMAIN paketleme yönetimi paket listesi, etiket ve sevke hazırlık adımlarını üretim sonrası sürece bağlar.',
    intro: 'Üretim bitti, sevkiyat bekliyor. Paketleme istasyonu eksiksiz ve izlenebilir olsun.',
    sections: [
      {
        h2: 'Paket listesi',
        body: 'Sipariş kalemlerine göre paket içeriği oluşur; eksik kalem görünür.',
        h3: [
          { title: 'Kolileme', body: 'Koli/palet dağılımını kaydedin.' },
          { title: 'Kontrol listesi', body: 'Sevk öncesi son kontrol adımları.' },
          { title: 'Hasar notu', body: 'Hasar veya özel paket notları.' },
        ],
      },
      {
        h2: 'Etiketleme',
        body: 'Adres ve barkod etiketleri sevkiyatı hızlandırır.',
      },
      {
        h2: 'Sevk kuyruğu',
        body: 'Paketi tamamlananlar lojistik kuyruğuna düşer.',
      },
    ],
    relatedPaths: [
      link('Üretim Takibi', '/uretim-takibi'),
      link('Sevkiyat', '/sevkiyat'),
      link('Depo', '/depo'),
    ],
    breadcrumbs: crumbs({ name: 'Paketleme', path: '/paketleme' }),
  },

  '/insan-kaynaklari': {
    path: '/insan-kaynaklari',
    title: 'İnsan Kaynakları Yazılımı | Personel ve Puantaj',
    description:
      'BACHMAIN İK ile personel kartı, puantaj ve saha ekibi kayıtlarını yönetin. Operasyonla bağlı İK — Tüm Süreçler Tek Platformda.',
    ogTitle: 'İnsan Kaynakları — Personel ve Puantaj',
    ogDescription: 'Personel, puantaj ve saha ekibi yönetimi. BACHMAIN İK.',
    twitterTitle: 'İnsan Kaynakları | BACHMAIN',
    twitterDescription: 'İK kartı, puantaj ve saha satış ekibi entegrasyonu.',
    h1: 'İnsan kaynaklarını saha ve ofisle aynı panelde tutun',
    h2: ['Personel kartları', 'Puantaj', 'Saha ekibi köprüsü'],
    h3: ['İzin', 'Prim notları', 'Organizasyon'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'insan kaynakları yazılımı',
    secondaryKeywords: ['puantaj', 'personel yönetimi', 'İK yazılımı'],
    aiSearchDescription:
      'BACHMAIN insan kaynakları; personel kartı, puantaj ve saha satış ekiplerini operasyon paneline bağlar.',
    intro:
      'Personel bilgisi ayrı Excel’de kalmasın. Saha satış ve üretim ekipleri aynı kimlikle izlensin.',
    sections: [
      {
        h2: 'Personel kartları',
        body: 'İletişim, unvan ve organizasyon bilgisi tek kartta.',
        h3: [
          { title: 'İzin', body: 'İzin taleplerini kayda alın.' },
          { title: 'Prim notları', body: 'Saha prim girdilerine bağlanabilir notlar.' },
          { title: 'Organizasyon', body: 'Ekip ve yönetici hiyerarşisi.' },
        ],
      },
      {
        h2: 'Puantaj',
        body: 'Saha ve ofis devam kayıtları raporlara akar.',
      },
      {
        h2: 'Saha ekibi köprüsü',
        body: 'Temsilci GPS ve ziyaretleri İK kimliğiyle ilişkilendirilir.',
      },
    ],
    relatedPaths: [
      link('Saha Satış', '/saha-satis'),
      link('ERP', '/erp'),
      link('Raporlar', '/raporlar'),
    ],
    breadcrumbs: crumbs({ name: 'İnsan Kaynakları', path: '/insan-kaynaklari' }),
  },

  '/saha-satis': {
    path: '/saha-satis',
    title: 'Saha Satış CRM | GPS, Rota ve Tahsilat',
    description:
      'BACHMAIN saha satış ile GPS, rota, ziyaret, sipariş ve tahsilat. Mobil CRM sahada — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Saha Satış — GPS ve Rota Planlama',
    ogDescription: 'Temsilci GPS, ziyaret, sipariş ve prim. BACHMAIN saha CRM.',
    twitterTitle: 'Saha Satış CRM | BACHMAIN',
    twitterDescription: 'Mobil saha satış: rota, ziyaret ve tahsilat.',
    h1: 'Saha satış ekibini GPS ve siparişle yönetin',
    h2: ['Rota ve ziyaret', 'Sahada sipariş', 'Tahsilat ve prim'],
    h3: ['GPS iz', 'Müşteri check-in', 'Gün sonu'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'saha satış CRM',
    secondaryKeywords: ['mobil CRM', 'GPS rota', 'saha tahsilat'],
    aiSearchDescription:
      'BACHMAIN saha satış CRM; GPS takip, rota planlama, ziyaret, sipariş ve tahsilatı ofis CRM’ine bağlar.',
    intro: 'Saha ekibi ofisten kopuk çalışmasın. Ziyaret, sipariş ve tahsilat aynı kayda düşsün.',
    sections: [
      {
        h2: 'Rota ve ziyaret',
        body: 'Günlük rota planı ve check-in ile sahadaki gerçek aktivite görünür.',
        h3: [
          { title: 'GPS iz', body: 'Temsilci konum geçmişi denetlenebilir.' },
          { title: 'Müşteri check-in', body: 'Ziyaret kaydı müşteri kartına işler.' },
          { title: 'Gün sonu', body: 'Gün özeti ofise otomatik yansır.' },
        ],
      },
      {
        h2: 'Sahada sipariş',
        body: 'Mobil sipariş stok ve cari limitleriyle uyumlu alınır.',
      },
      {
        h2: 'Tahsilat ve prim',
        body: 'Tahsilat makbuzları ve prim hesapları şeffaf kalır.',
      },
    ],
    relatedPaths: [link('CRM', '/crm'), link('Bayi', '/bayi'), link('WhatsApp', '/whatsapp')],
    breadcrumbs: crumbs({ name: 'Saha Satış', path: '/saha-satis' }),
  },

  '/bayi': {
    path: '/bayi',
    title: 'Bayi Yönetimi | B2B Portal ve Sipariş',
    description:
      'BACHMAIN bayi yönetimi ile B2B portal, bayi siparişi ve fiyat listeleri. Dağıtım ağı tek panelde — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Bayi Yönetimi — B2B Portal',
    ogDescription: 'Bayi siparişi, fiyat listesi ve portal. BACHMAIN.',
    twitterTitle: 'Bayi Yönetimi | BACHMAIN',
    twitterDescription: 'B2B bayi portalı, sipariş ve cari limitleri.',
    h1: 'Bayi ağını portal ve cariyle yönetin',
    h2: ['B2B self-servis', 'Fiyat ve limit', 'Sipariş akışı'],
    h3: ['Bayi listesi', 'Özel fiyat', 'Stok görünürlüğü'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'bayi yönetimi',
    secondaryKeywords: ['B2B portal', 'bayi sipariş', 'dağıtım yönetimi'],
    aiSearchDescription:
      'BACHMAIN bayi yönetimi B2B portal, özel fiyat ve bayi siparişlerini CRM ile stoka bağlar.',
    intro: 'Bayiler telefonla sipariş yağdırmasın. Portalda stok ve sipariş durumu görünsün.',
    sections: [
      {
        h2: 'B2B self-servis',
        body: 'Bayi kendi siparişini oluşturur; çağrı merkezi yükü düşer.',
        h3: [
          { title: 'Bayi listesi', body: 'Bölge ve kanal bazlı bayi kartları.' },
          { title: 'Özel fiyat', body: 'Bayiye özel fiyat listeleri.' },
          { title: 'Stok görünürlüğü', body: 'Uygun stok bilgisi kontrollü paylaşılır.' },
        ],
      },
      {
        h2: 'Fiyat ve limit',
        body: 'Cari limit aşımında sipariş uyarısı veya blokaj.',
      },
      {
        h2: 'Sipariş akışı',
        body: 'Bayi siparişleri merkez sipariş ve sevkiyata akar.',
      },
    ],
    relatedPaths: [
      link('ERP', '/erp'),
      link('Sipariş', '/siparis'),
      link('Saha Satış', '/saha-satis'),
    ],
    breadcrumbs: crumbs({ name: 'Bayi', path: '/bayi' }),
  },

  '/whatsapp': {
    path: '/whatsapp',
    title: 'WhatsApp CRM | Mesaj Merkezi Entegrasyonu',
    description:
      'BACHMAIN WhatsApp CRM ile gelen mesajları müşteri kartına bağlayın. Sosyal inbox ile birlikte — Tüm Süreçler Tek Platformda.',
    ogTitle: 'WhatsApp CRM — Mesaj Merkezi',
    ogDescription: 'WhatsApp mesajları CRM kartıyla eşleşir. BACHMAIN.',
    twitterTitle: 'WhatsApp CRM | BACHMAIN',
    twitterDescription: 'WhatsApp entegrasyonlu müşteri iletişimi ve görevler.',
    h1: 'WhatsApp konuşmalarını CRM’de toplayın',
    h2: ['Gelen kutusu', 'Müşteri eşleme', 'Satışa dönüşüm'],
    h3: ['Atama', 'Şablon yanıt', 'Geçmiş konuşma'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'WhatsApp CRM',
    secondaryKeywords: ['WhatsApp entegrasyonu', 'mesaj merkezi', 'WhatsApp satış'],
    aiSearchDescription:
      'BACHMAIN WhatsApp CRM; mesaj merkezini müşteri kartı, görev ve fırsatlarla birleştirir.',
    intro:
      'WhatsApp’ta kaybolan talepler bitsin. Her konuşma bir müşteri veya lead kaydına bağlansın.',
    sections: [
      {
        h2: 'Gelen kutusu',
        body: 'Ekip ortak inbox’tan yanıtlar; kişisel telefon karmaşası azalır.',
        h3: [
          { title: 'Atama', body: 'Mesajları temsilciye yönlendirin.' },
          { title: 'Şablon yanıt', body: 'Sık sorular için hazır metinler.' },
          { title: 'Geçmiş konuşma', body: 'Kart üzerinde tam geçmiş.' },
        ],
      },
      {
        h2: 'Müşteri eşleme',
        body: 'Numara veya isimle otomatik/manuel eşleme.',
      },
      {
        h2: 'Satışa dönüşüm',
        body: 'Sohbetten fırsat veya teklif oluşturun.',
      },
    ],
    relatedPaths: [
      link('CRM', '/crm'),
      link('Sosyal Medya', '/sosyal-medya'),
      link('Saha Satış', '/saha-satis'),
    ],
    breadcrumbs: crumbs({ name: 'WhatsApp', path: '/whatsapp' }),
  },

  '/sosyal-medya': {
    path: '/sosyal-medya',
    title: 'Sosyal Medya Inbox | DM ve Yorum Yönetimi',
    description:
      'BACHMAIN sosyal medya inbox ile DM ve yorumları tek merkezde toplayın. Instagram’dan X’e — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Sosyal Medya Inbox — DM Yönetimi',
    ogDescription: 'Çoklu kanal sosyal mesajlar tek inbox. BACHMAIN.',
    twitterTitle: 'Sosyal Medya Inbox | BACHMAIN',
    twitterDescription: 'Instagram, Facebook, LinkedIn, X ve TikTok mesajları.',
    h1: 'Sosyal mesajları CRM inbox’ta birleştirin',
    h2: ['Çoklu kanal', 'CRM eşleme', 'Yanıt disiplini'],
    h3: ['Öncelik', 'Etiketleme', 'Rapor'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'sosyal medya inbox',
    secondaryKeywords: ['sosyal DM yönetimi', 'sosyal CRM', 'yorum yönetimi'],
    aiSearchDescription:
      'BACHMAIN sosyal medya inbox; Instagram, Facebook, LinkedIn, X ve TikTok mesajlarını CRM ile birleştirir.',
    intro: 'Her platform ayrı uygulama olmasın. Marka mesajları tek ekip inbox’unda yönetilsin.',
    sections: [
      {
        h2: 'Çoklu kanal',
        body: 'Instagram, Facebook, LinkedIn, X ve TikTok aynı operasyon dilinde.',
        h3: [
          { title: 'Öncelik', body: 'SLA’ya göre öncelikli kuyruk.' },
          { title: 'Etiketleme', body: 'Konu etiketleriyle sınıflandırma.' },
          { title: 'Rapor', body: 'Yanıt süresi ve hacim KPI’ları.' },
        ],
      },
      {
        h2: 'CRM eşleme',
        body: 'Sosyal profil müşteri kartına bağlanabilir.',
      },
      {
        h2: 'Yanıt disiplini',
        body: 'Atama ve durumlarla kaçan DM kalmaz.',
      },
    ],
    relatedPaths: [
      link('Instagram', '/instagram'),
      link('Facebook', '/facebook'),
      link('WhatsApp', '/whatsapp'),
    ],
    breadcrumbs: crumbs({ name: 'Sosyal Medya', path: '/sosyal-medya' }),
  },

  '/instagram': {
    path: '/instagram',
    title: 'Instagram DM Yönetimi | Sosyal CRM Inbox',
    description:
      'BACHMAIN Instagram DM yönetimi ile gelen kutusu ve yorumları CRM’e bağlayın. Sosyal satışa köprü — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Instagram DM Yönetimi — Sosyal CRM',
    ogDescription: 'Instagram mesaj ve yorumları ekip inbox’unda. BACHMAIN.',
    twitterTitle: 'Instagram DM Yönetimi | BACHMAIN',
    twitterDescription: 'Instagram DM, yorum ve müşteri eşleme.',
    h1: 'Instagram mesajlarını satış kaydına dönüştürün',
    h2: ['DM gelen kutusu', 'Yorum yanıtı', 'Lead yakalama'],
    h3: ['Atama', 'Hızlı yanıt', 'Kart eşleme'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'Instagram DM yönetimi',
    secondaryKeywords: ['Instagram CRM', 'Instagram inbox', 'sosyal satış'],
    aiSearchDescription:
      'BACHMAIN Instagram DM yönetimi; mesaj ve yorumları CRM müşteri kartlarıyla birleştirir.',
    intro: 'Instagram’daki satış fırsatları kaybolmasın. DM’ler görev ve fırsata dönüşsün.',
    sections: [
      {
        h2: 'DM gelen kutusu',
        body: 'Marka hesabı mesajları ekip içinde paylaşılır.',
        h3: [
          { title: 'Atama', body: 'Doğru temsilciye yönlendirme.' },
          { title: 'Hızlı yanıt', body: 'Şablonlarla ilk yanıt süresi kısalır.' },
          { title: 'Kart eşleme', body: 'Profil CRM kaydına bağlanır.' },
        ],
      },
      {
        h2: 'Yorum yanıtı',
        body: 'Yorumları da aynı disiplinle yönetin.',
      },
      {
        h2: 'Lead yakalama',
        body: 'İlgilenen kullanıcıyı fırsat olarak kaydedin.',
      },
    ],
    relatedPaths: [
      link('Sosyal Medya', '/sosyal-medya'),
      link('Facebook', '/facebook'),
      link('CRM', '/crm'),
    ],
    breadcrumbs: crumbs({ name: 'Instagram', path: '/instagram' }),
  },

  '/facebook': {
    path: '/facebook',
    title: 'Facebook Mesaj Yönetimi | Sayfa Inbox CRM',
    description:
      'BACHMAIN Facebook mesaj yönetimi ile sayfa gelen kutusunu CRM’e taşıyın. Yorum ve DM tek ekipte — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Facebook Mesaj Yönetimi — Sayfa Inbox',
    ogDescription: 'Facebook sayfa mesajları ve yorumları. BACHMAIN.',
    twitterTitle: 'Facebook Mesaj Yönetimi | BACHMAIN',
    twitterDescription: 'Facebook Messenger ve sayfa yorumları CRM’de.',
    h1: 'Facebook sayfa mesajlarını CRM disiplinine alın',
    h2: ['Sayfa gelen kutusu', 'Yorum moderasyonu', 'Müşteri bağlama'],
    h3: ['SLA', 'Etiket', 'Rapor'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'Facebook mesaj yönetimi',
    secondaryKeywords: ['Facebook inbox', 'Messenger CRM', 'sayfa yönetimi'],
    aiSearchDescription:
      'BACHMAIN Facebook mesaj yönetimi sayfa DM ve yorumlarını CRM inbox ile birleştirir.',
    intro: 'Sayfa mesajları kişisel hesaplarda dağılmasın. Ortak inbox ve CRM kaydı.',
    sections: [
      {
        h2: 'Sayfa gelen kutusu',
        body: 'Messenger talepleri ekip kuyruğunda yanıtlanır.',
        h3: [
          { title: 'SLA', body: 'Yanıt süresi hedefleri.' },
          { title: 'Etiket', body: 'Konuya göre sınıflandırma.' },
          { title: 'Rapor', body: 'Hacim ve performans özeti.' },
        ],
      },
      {
        h2: 'Yorum moderasyonu',
        body: 'Yorum yanıtları marka tonunda ve kayıtlı.',
      },
      {
        h2: 'Müşteri bağlama',
        body: 'Tekrarlayan kişiler cari/lead kartına bağlanır.',
      },
    ],
    relatedPaths: [
      link('Instagram', '/instagram'),
      link('Sosyal Medya', '/sosyal-medya'),
      link('WhatsApp', '/whatsapp'),
    ],
    breadcrumbs: crumbs({ name: 'Facebook', path: '/facebook' }),
  },

  '/linkedin': {
    path: '/linkedin',
    title: 'LinkedIn Mesaj Yönetimi | B2B Sosyal CRM',
    description:
      'BACHMAIN LinkedIn mesaj yönetimi ile B2B konuşmaları CRM’e alın. Profesyonel ağdan fırsata — Tüm Süreçler Tek Platformda.',
    ogTitle: 'LinkedIn Mesaj Yönetimi — B2B CRM',
    ogDescription: 'LinkedIn konuşmalarını fırsat ve müşteriye bağlayın. BACHMAIN.',
    twitterTitle: 'LinkedIn Mesaj Yönetimi | BACHMAIN',
    twitterDescription: 'B2B LinkedIn inbox ve CRM eşleme.',
    h1: 'LinkedIn konuşmalarını B2B pipeline’a taşıyın',
    h2: ['Profesyonel inbox', 'Fırsat oluşturma', 'Ekip görünürlüğü'],
    h3: ['Lead notu', 'Takip görevi', 'Hesap eşleme'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'LinkedIn mesaj yönetimi',
    secondaryKeywords: ['LinkedIn CRM', 'B2B sosyal satış', 'LinkedIn inbox'],
    aiSearchDescription:
      'BACHMAIN LinkedIn mesaj yönetimi B2B konuşmalarını CRM fırsat ve hesaplarıyla birleştirir.',
    intro: 'LinkedIn’de başlayan ilişkiler CRM’de kaybolmasın. Not, görev ve fırsat tek yerde.',
    sections: [
      {
        h2: 'Profesyonel inbox',
        body: 'B2B mesajları ekip standardında yönetilir.',
        h3: [
          { title: 'Lead notu', body: 'Görüşme notları hesap kartında.' },
          { title: 'Takip görevi', body: 'Sonraki adım unutulmaz.' },
          { title: 'Hesap eşleme', body: 'Şirket/kişi CRM’e bağlanır.' },
        ],
      },
      {
        h2: 'Fırsat oluşturma',
        body: 'Olgunlaşan konuşmalar pipeline’a düşer.',
      },
      {
        h2: 'Ekip görünürlüğü',
        body: 'Aynı lead’e çift temas riski azalır.',
      },
    ],
    relatedPaths: [link('CRM', '/crm'), link('Sosyal Medya', '/sosyal-medya'), link('X', '/x')],
    breadcrumbs: crumbs({ name: 'LinkedIn', path: '/linkedin' }),
  },

  '/x': {
    path: '/x',
    title: 'X (Twitter) Mesaj Yönetimi | Sosyal Inbox',
    description:
      'BACHMAIN X mesaj yönetimi ile DM ve mention’ları ekip inbox’unda toplayın. Marka yanıtı disiplinli — Tüm Süreçler Tek Platformda.',
    ogTitle: 'X Mesaj Yönetimi — Sosyal Inbox',
    ogDescription: 'X DM ve mention yönetimi CRM ile. BACHMAIN.',
    twitterTitle: 'X Mesaj Yönetimi | BACHMAIN',
    twitterDescription: 'X (Twitter) DM, mention ve marka yanıtları.',
    h1: 'X üzerindeki marka konuşmalarını merkezileştirin',
    h2: ['DM ve mention', 'Yanıt kuyruğu', 'CRM bağlama'],
    h3: ['Öncelik', 'Kriz etiketi', 'Arşiv'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'X mesaj yönetimi',
    secondaryKeywords: ['Twitter inbox', 'X CRM', 'mention yönetimi'],
    aiSearchDescription:
      'BACHMAIN X mesaj yönetimi; DM ve mention’ları sosyal inbox ve CRM ile birleştirir.',
    intro: 'Hızlı akan X konuşmalarında marka sesi dağılmasın. Atama ve arşiv net olsun.',
    sections: [
      {
        h2: 'DM ve mention',
        body: 'Gelen kutusu ve public mention’lar aynı operasyonda.',
        h3: [
          { title: 'Öncelik', body: 'Acil mention’lar üst sırada.' },
          { title: 'Kriz etiketi', body: 'Hassas konulara özel etiket.' },
          { title: 'Arşiv', body: 'Kapanan konuşmalar izlenebilir.' },
        ],
      },
      {
        h2: 'Yanıt kuyruğu',
        body: 'Ekip sırayla yanıtlar; çift cevap azalır.',
      },
      {
        h2: 'CRM bağlama',
        body: 'Tekrarlayan hesaplar müşteri kartına bağlanır.',
      },
    ],
    relatedPaths: [
      link('Sosyal Medya', '/sosyal-medya'),
      link('TikTok', '/tiktok'),
      link('LinkedIn', '/linkedin'),
    ],
    breadcrumbs: crumbs({ name: 'X', path: '/x' }),
  },

  '/tiktok': {
    path: '/tiktok',
    title: 'TikTok Mesaj Yönetimi | Yorum ve DM Inbox',
    description:
      'BACHMAIN TikTok mesaj yönetimi ile yorum ve DM’leri CRM inbox’a alın. Genç marka iletişimi düzenli — Tüm Süreçler Tek Platformda.',
    ogTitle: 'TikTok Mesaj Yönetimi — Yorum ve DM',
    ogDescription: 'TikTok DM ve yorum yönetimi. BACHMAIN sosyal inbox.',
    twitterTitle: 'TikTok Mesaj Yönetimi | BACHMAIN',
    twitterDescription: 'TikTok yorum, DM ve lead yakalama.',
    h1: 'TikTok etkileşimlerini satış fırsatına çevirin',
    h2: ['Yorum yönetimi', 'DM kuyruğu', 'Lead yakalama'],
    h3: ['İçerik etiketi', 'Hızlı yanıt', 'CRM kayıt'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'TikTok mesaj yönetimi',
    secondaryKeywords: ['TikTok inbox', 'TikTok CRM', 'TikTok yorum'],
    aiSearchDescription:
      'BACHMAIN TikTok mesaj yönetimi yorum ve DM’leri sosyal inbox ve CRM süreçlerine bağlar.',
    intro: 'Viral etkileşim kaos olmasın. Yorum ve DM’ler ekip standardında yanıtlansın.',
    sections: [
      {
        h2: 'Yorum yönetimi',
        body: 'Video yorumları etiketlenip yanıtlanır.',
        h3: [
          { title: 'İçerik etiketi', body: 'Hangi video kampanyasına ait netleşir.' },
          { title: 'Hızlı yanıt', body: 'Sık sorular için şablonlar.' },
          { title: 'CRM kayıt', body: 'İlgilenen kullanıcı lead olabilir.' },
        ],
      },
      {
        h2: 'DM kuyruğu',
        body: 'Özel mesajlar ortak inbox’ta.',
      },
      {
        h2: 'Lead yakalama',
        body: 'Satışa dönük konuşmalar fırsata bağlanır.',
      },
    ],
    relatedPaths: [
      link('Instagram', '/instagram'),
      link('Sosyal Medya', '/sosyal-medya'),
      link('X', '/x'),
    ],
    breadcrumbs: crumbs({ name: 'TikTok', path: '/tiktok' }),
  },

  '/openai': {
    path: '/openai',
    title: 'OpenAI Entegrasyonu | Yapay Zeka İş Asistanı',
    description:
      'BACHMAIN OpenAI entegrasyonu ile özet, taslak ve asistan özelliklerini iş süreçlerine bağlayın. Tüm Süreçler Tek Platformda — AI destekli CRM/ERP.',
    ogTitle: 'OpenAI Entegrasyonu — AI İş Asistanı',
    ogDescription: 'Yapay zeka özet, taslak ve asistan. BACHMAIN + OpenAI.',
    twitterTitle: 'OpenAI Entegrasyonu | BACHMAIN',
    twitterDescription: 'CRM/ERP içinde AI asistan ve akıllı özetler.',
    h1: 'Yapay zekayı CRM ve ERP süreçlerinize gömün',
    h2: ['Akıllı özetler', 'Taslak üretimi', 'Asistan deneyimi'],
    h3: ['Güvenli bağlam', 'Modül içi yardım', 'Zaman kazancı'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'OpenAI entegrasyonu',
    secondaryKeywords: ['yapay zeka CRM', 'AI asistan', 'AI ERP'],
    aiSearchDescription:
      'BACHMAIN OpenAI entegrasyonu; CRM ve ERP içinde özet, taslak ve asistan özelliklerini sunar.',
    intro: 'AI ayrı bir sohbet penceresi olmasın. Özet ve taslaklar kayıt bağlamında üretilsin.',
    sections: [
      {
        h2: 'Akıllı özetler',
        body: 'Uzun konuşma ve kayıt geçmişlerini hızlıca özetleyin.',
        h3: [
          { title: 'Güvenli bağlam', body: 'İlgili kayıt verisi kontrollü kullanılır.' },
          { title: 'Modül içi yardım', body: 'Ekranda anlık rehberlik.' },
          { title: 'Zaman kazancı', body: 'Tekrarlayan yazım işleri kısalır.' },
        ],
      },
      {
        h2: 'Taslak üretimi',
        body: 'Teklif notu, e-posta veya yanıt taslakları hızlanır.',
      },
      {
        h2: 'Asistan deneyimi',
        body: 'Bachy ve AI asistanlar günlük iş akışına eşlik eder.',
      },
    ],
    relatedPaths: [
      link('CRM', '/crm'),
      link('Raporlar', '/raporlar'),
      link('Dashboard', '/dashboard'),
    ],
    breadcrumbs: crumbs({ name: 'OpenAI', path: '/openai' }),
  },

  '/raporlar': {
    path: '/raporlar',
    title: 'Raporlama Yazılımı | KPI ve Analitik',
    description:
      'BACHMAIN raporlama ile satış, stok, üretim ve finans KPI’larını izleyin. Dashboard’a akan analitik — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Raporlama — KPI ve Analitik',
    ogDescription: 'Satış, stok, üretim ve finans raporları. BACHMAIN.',
    twitterTitle: 'Raporlama Yazılımı | BACHMAIN',
    twitterDescription: 'KPI raporları ve analitik paneller.',
    h1: 'Raporlarla veriye dayalı karar alın',
    h2: ['Operasyonel raporlar', 'Mali analitik', 'Paylaşım'],
    h3: ['Satış KPI', 'Stok KPI', 'Üretim KPI'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'raporlama yazılımı',
    secondaryKeywords: ['KPI raporları', 'iş zekası', 'analitik panel'],
    aiSearchDescription:
      'BACHMAIN raporlama; satış, stok, üretim ve finans KPI’larını dashboard ve analitik raporlarda sunar.',
    intro: 'Veri Excel’e export edilip kaybolmasın. Karar anında doğru KPI görünsün.',
    sections: [
      {
        h2: 'Operasyonel raporlar',
        body: 'Sipariş, üretim ve sevkiyat performansını dönemsel izleyin.',
        h3: [
          { title: 'Satış KPI', body: 'Pipeline ve kapanış oranları.' },
          { title: 'Stok KPI', body: 'Devir ve kritik stok.' },
          { title: 'Üretim KPI', body: 'Termin ve fire oranları.' },
        ],
      },
      {
        h2: 'Mali analitik',
        body: 'Cari yaşlandırma ve nakit özetleri finans kararını destekler.',
      },
      {
        h2: 'Paylaşım',
        body: 'Yönetim özetlerini güvenli paylaşın.',
      },
    ],
    relatedPaths: [link('Dashboard', '/dashboard'), link('Finans', '/finans'), link('CRM', '/crm')],
    breadcrumbs: crumbs({ name: 'Raporlar', path: '/raporlar' }),
  },

  '/dashboard': {
    path: '/dashboard',
    title: 'İş Dashboard | Canlı KPI Paneli',
    description:
      'BACHMAIN dashboard ile satış, operasyon ve finans KPI’larını canlı izleyin. Tek bakışta yönetim özeti — Tüm Süreçler Tek Platformda.',
    ogTitle: 'İş Dashboard — Canlı KPI Paneli',
    ogDescription: 'Canlı yönetim paneli ve KPI kartları. BACHMAIN.',
    twitterTitle: 'İş Dashboard | BACHMAIN',
    twitterDescription: 'Canlı dashboard: satış, stok, üretim, finans.',
    h1: 'Yönetim özetini canlı dashboard’da görün',
    h2: ['KPI kartları', 'Modül widget’ları', 'Drill-down'],
    h3: ['Satış özeti', 'Operasyon özeti', 'Finans özeti'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'iş dashboard',
    secondaryKeywords: ['KPI paneli', 'canlı dashboard', 'yönetim paneli'],
    aiSearchDescription:
      'BACHMAIN iş dashboard’u satış, operasyon ve finans KPI’larını canlı kartlar ve widget’larla gösterir.',
    intro: 'Sabah ilk bakışta nabız ölçün. Dashboard, raporların özet katmanıdır.',
    sections: [
      {
        h2: 'KPI kartları',
        body: 'Kritik metrikler tek ekranda; eşik aşımları görünür.',
        h3: [
          { title: 'Satış özeti', body: 'Pipeline ve ciro nabzı.' },
          { title: 'Operasyon özeti', body: 'Açık iş emri ve sevkiyat.' },
          { title: 'Finans özeti', body: 'Tahsilat ve nakit görünümü.' },
        ],
      },
      {
        h2: 'Modül widget’ları',
        body: 'CRM, üretim ve depo widget’larını ihtiyaca göre düzenleyin.',
      },
      {
        h2: 'Drill-down',
        body: 'Karttan ilgili liste ve rapora inin.',
      },
    ],
    relatedPaths: [link('Raporlar', '/raporlar'), link('CRM', '/crm'), link('Demo', '/demo')],
    breadcrumbs: crumbs({ name: 'Dashboard', path: '/dashboard' }),
  },

  '/fiyatlar': {
    path: '/fiyatlar',
    title: 'Fiyatlar | Şeffaf CRM & ERP Paketleri',
    description:
      'BACHMAIN fiyatlarını inceleyin: aylık/yıllık paketler ve Enterprise Full. Şeffaf CRM & ERP fiyatlandırma — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Fiyatlar — BACHMAIN Paketleri',
    ogDescription: 'Şeffaf paketler, kontör ve Enterprise Full. BACHMAIN fiyatlandırma.',
    twitterTitle: 'Fiyatlar | BACHMAIN',
    twitterDescription: 'CRM & ERP paket fiyatları ve yıllık avantajlar.',
    h1: 'Size uygun BACHMAIN paketini seçin',
    h2: ['Şeffaf paketler', 'Yıllık avantaj', 'Enterprise Full'],
    h3: ['Başlangıç', 'Büyüme', 'Kurumsal'],
    schemaType: 'SoftwareApplication',
    focusKeyword: 'CRM ERP fiyatları',
    secondaryKeywords: ['yazılım fiyatlandırma', 'KOBİ yazılım fiyat', 'ERP paket'],
    aiSearchDescription:
      'BACHMAIN fiyatlar sayfası CRM/ERP paketlerini, aylık-yıllık seçenekleri ve Enterprise Full Paketi listeler.',
    intro:
      'Gizli maliyet yok. Modüller ve e-fatura dahil paketleri karşılaştırın, demo ile doğrulayın.',
    sections: [
      {
        h2: 'Şeffaf paketler',
        body: 'İhtiyaca göre ölçeklenen paketler; özellik listeleri net.',
        h3: [
          { title: 'Başlangıç', body: 'Temel CRM/ERP ihtiyaçları.' },
          { title: 'Büyüme', body: 'Operasyon ve finans derinliği.' },
          { title: 'Kurumsal', body: 'Enterprise Full kapsamı.' },
        ],
      },
      {
        h2: 'Yıllık avantaj',
        body: 'Yıllık ödemede maliyet avantajı.',
      },
      {
        h2: 'Enterprise Full',
        body: 'Tüm süreçler tek platformda — tam paket deneyimi.',
      },
    ],
    relatedPaths: [link('Demo', '/demo'), link('Üye Ol', '/uye-ol'), link('İletişim', '/iletisim')],
    breadcrumbs: crumbs({ name: 'Fiyatlar', path: '/fiyatlar' }),
  },

  '/demo': {
    path: '/demo',
    title: 'Demo Talep Et | Ücretsiz Canlı Tanıtım',
    description:
      'BACHMAIN demosunu canlı görün. CRM, ERP ve üretimi ekibinizle keşfedin — ücretsiz tanıtım. Tüm Süreçler Tek Platformda.',
    ogTitle: 'Demo Talep — Canlı BACHMAIN Tanıtımı',
    ogDescription: 'Ücretsiz canlı demo ile modülleri birlikte gezin. BACHMAIN.',
    twitterTitle: 'Demo Talep Et | BACHMAIN',
    twitterDescription: 'CRM & ERP canlı demo talebi — ücretsiz tanıtım.',
    h1: 'BACHMAIN’i canlı demoda keşfedin',
    h2: ['Ne göreceksiniz?', 'Kimler katılmalı?', 'Sonraki adım'],
    h3: ['CRM turu', 'Operasyon turu', 'Finans turu'],
    schemaType: 'WebPage',
    focusKeyword: 'CRM ERP demo',
    secondaryKeywords: ['yazılım demo', 'canlı tanıtım', 'ücretsiz demo'],
    aiSearchDescription:
      'BACHMAIN demo sayfası ücretsiz canlı tanıtım talebi alır; CRM, ERP, üretim ve finans modülleri gösterilir.',
    intro: 'Kısa bir oturumda süreçlerinizin platformda nasıl aktığını birlikte görelim.',
    sections: [
      {
        h2: 'Ne göreceksiniz?',
        body: 'Gerçek ekranlarla teklif, sipariş, üretim ve finans akışları.',
        h3: [
          { title: 'CRM turu', body: 'Pipeline ve mesaj merkezi.' },
          { title: 'Operasyon turu', body: 'Üretim ve depo.' },
          { title: 'Finans turu', body: 'Cari ve e-fatura.' },
        ],
      },
      {
        h2: 'Kimler katılmalı?',
        body: 'Satış, operasyon ve finans karar vericileri aynı oturumda hizalanır.',
      },
      {
        h2: 'Sonraki adım',
        body: 'Demo sonrası paket seçimi ve hesap açılışı.',
      },
    ],
    relatedPaths: [
      link('Fiyatlar', '/fiyatlar'),
      link('İletişim', '/iletisim'),
      link('CRM', '/crm'),
    ],
    breadcrumbs: crumbs({ name: 'Demo', path: '/demo' }),
  },

  '/giris': {
    path: '/giris',
    title: 'Giriş Yap | BACHMAIN Hesabı',
    description: 'BACHMAIN hesabınıza güvenli giriş yapın. İş panelinize tek tıkla ulaşın.',
    ogTitle: 'Giriş Yap — BACHMAIN',
    ogDescription: 'BACHMAIN güvenli hesap girişi.',
    twitterTitle: 'Giriş Yap | BACHMAIN',
    twitterDescription: 'BACHMAIN hesabınıza giriş yapın.',
    h1: 'BACHMAIN’e giriş yapın',
    h2: ['Güvenli oturum', 'Şifre yardımı'],
    h3: ['Kurumsal hesap'],
    schemaType: 'WebPage',
    focusKeyword: 'BACHMAIN giriş',
    secondaryKeywords: ['hesap girişi', 'CRM giriş'],
    aiSearchDescription: 'BACHMAIN kullanıcı giriş sayfası. İndekslenmez.',
    intro: 'Kurumsal hesabınızla panele güvenli erişim.',
    sections: [
      {
        h2: 'Güvenli oturum',
        body: 'Yetkili kullanıcılar şirket verisine güvenli şekilde erişir.',
        h3: [{ title: 'Kurumsal hesap', body: 'Şirket bazlı kullanıcı yönetimi.' }],
      },
      {
        h2: 'Şifre yardımı',
        body: 'Şifrenizi unuttuysanız sıfırlama akışını kullanın.',
      },
    ],
    relatedPaths: [link('Üye Ol', '/uye-ol'), link('Demo', '/demo')],
    breadcrumbs: crumbs({ name: 'Giriş', path: '/giris' }),
    noIndex: true,
  },

  '/uye-ol': {
    path: '/uye-ol',
    title: 'Üye Ol | BACHMAIN Hesabı Oluştur',
    description:
      'BACHMAIN hesabınızı oluşturun. Enterprise Full Paket ile tüm süreçleri tek panelde yönetmeye başlayın.',
    ogTitle: 'Üye Ol — BACHMAIN Hesap',
    ogDescription: 'BACHMAIN hesap oluşturma ve paket seçimi.',
    twitterTitle: 'Üye Ol | BACHMAIN',
    twitterDescription: 'BACHMAIN’e üye olun, hesabınızı oluşturun.',
    h1: 'BACHMAIN hesabınızı oluşturun',
    h2: ['Paket seçimi', 'Hesap bilgileri', 'Ödeme'],
    h3: ['Full paket'],
    schemaType: 'WebPage',
    focusKeyword: 'BACHMAIN üye ol',
    secondaryKeywords: ['hesap oluştur', 'CRM kayıt'],
    aiSearchDescription: 'BACHMAIN kayıt/üye ol sayfası. İndekslenmez.',
    intro: 'Paket seçin, hesabınızı oluşturun, süreçleri tek platformda toplayın.',
    sections: [
      {
        h2: 'Paket seçimi',
        body: 'İhtiyacınıza uygun paketi seçerek başlayın.',
        h3: [{ title: 'Full paket', body: 'Tüm Süreçler Tek Platformda deneyimi.' }],
      },
      {
        h2: 'Hesap bilgileri',
        body: 'Şirket ve kullanıcı bilgileriyle güvenli kayıt.',
      },
      {
        h2: 'Ödeme',
        body: 'Ödeme adımından sonra panele geçiş.',
      },
    ],
    relatedPaths: [link('Fiyatlar', '/fiyatlar'), link('Giriş', '/giris')],
    breadcrumbs: crumbs({ name: 'Üye Ol', path: '/uye-ol' }),
    noIndex: true,
  },

  '/blog': {
    path: '/blog',
    title: 'Blog | ERP, CRM ve Dijital Dönüşüm',
    description:
      'BACHMAIN blog: ERP geçişi, stok, e-fatura, saha satış ve üretim rehberleri. Pratik içerikler — Tüm Süreçler Tek Platformda.',
    ogTitle: 'Blog — Dijital Dönüşüm Rehberleri',
    ogDescription: 'ERP, CRM, stok ve e-fatura yazıları. BACHMAIN blog.',
    twitterTitle: 'Blog | BACHMAIN',
    twitterDescription: 'İşletme yazılımı ve dijital dönüşüm blog yazıları.',
    h1: 'BACHMAIN blog: pratik dijital dönüşüm rehberleri',
    h2: ['Operasyon yazıları', 'Finans ve e-belge', 'Saha ve üretim'],
    h3: ['ERP geçişi', 'Stok ipuçları', 'E-fatura'],
    schemaType: 'WebPage',
    focusKeyword: 'CRM ERP blog',
    secondaryKeywords: ['dijital dönüşüm', 'ERP rehberi', 'e-fatura rehberi'],
    aiSearchDescription:
      'BACHMAIN blog; ERP geçişi, stok yönetimi, e-fatura, saha satış ve üretim konularında rehber içerikler yayınlar.',
    intro: 'Sahadan gelen deneyimle yazılmış rehberler; karar vermeden önce okuyun.',
    sections: [
      {
        h2: 'Operasyon yazıları',
        body: 'ERP geçişi, stok ve süreç disiplini üzerine pratik notlar.',
        h3: [
          { title: 'ERP geçişi', body: 'Adım adım geçiş kontrol listeleri.' },
          { title: 'Stok ipuçları', body: 'Envanter doğruluğunu artıran öneriler.' },
          { title: 'E-fatura', body: 'Uyum ve süreç ipuçları.' },
        ],
      },
      {
        h2: 'Finans ve e-belge',
        body: 'Cari ve e-belge süreçlerini sadeleştiren içerikler.',
      },
      {
        h2: 'Saha ve üretim',
        body: 'Saha satış ve üretim takibi deneyimleri.',
      },
    ],
    relatedPaths: [
      link('Raporlar', '/raporlar'),
      link('Demo', '/demo'),
      link('İletişim', '/iletisim'),
    ],
    breadcrumbs: crumbs({ name: 'Blog', path: '/blog' }),
  },

  '/iletisim': {
    path: '/iletisim',
    title: 'İletişim | Destek ve Satış',
    description:
      'BACHMAIN ile iletişime geçin. Demo, satış ve destek için İstanbul ofisi ve destek@bachmain.com — Tüm Süreçler Tek Platformda.',
    ogTitle: 'İletişim — BACHMAIN Destek ve Satış',
    ogDescription: 'Satış, demo ve teknik destek iletişim kanalları.',
    twitterTitle: 'İletişim | BACHMAIN',
    twitterDescription: 'BACHMAIN iletişim: destek ve satış.',
    h1: 'BACHMAIN ile iletişime geçin',
    h2: ['Satış ve demo', 'Teknik destek', 'Ofis'],
    h3: ['E-posta', 'Telefon', 'İstanbul'],
    schemaType: 'ContactPage',
    focusKeyword: 'BACHMAIN iletişim',
    secondaryKeywords: ['CRM destek', 'yazılım satış', 'demo iletişim'],
    aiSearchDescription:
      'BACHMAIN iletişim sayfası; satış, demo ve teknik destek için e-posta, telefon ve İstanbul ofis bilgilerini verir.',
    intro: 'Sorunuz mu var? Satış, demo veya destek ekibimize ulaşın.',
    sections: [
      {
        h2: 'Satış ve demo',
        body: 'Paket ve demo talepleriniz için satış ekibiyle görüşün.',
        h3: [
          { title: 'E-posta', body: 'destek@bachmain.com' },
          { title: 'Telefon', body: '0212 963 00 20' },
          { title: 'İstanbul', body: 'Türkiye ofisi.' },
        ],
      },
      {
        h2: 'Teknik destek',
        body: 'Mevcut müşteriler için destek kanalları.',
      },
      {
        h2: 'Ofis',
        body: 'İstanbul merkezli ekibimizle tanışın.',
      },
    ],
    relatedPaths: [link('Demo', '/demo'), link('Fiyatlar', '/fiyatlar'), link('Yardım', '/help')],
    breadcrumbs: crumbs({ name: 'İletişim', path: '/iletisim' }),
  },
}

/** Paths that render SeoModuleView (module/utility SEO landings). */
export const MODULE_SEO_PATHS = [
  '/crm',
  '/erp',
  '/muhasebe',
  '/e-fatura',
  '/teklif',
  '/siparis',
  '/uretim',
  '/uretim-takibi',
  '/depo',
  '/stok',
  '/cari',
  '/finans',
  '/kasa',
  '/banka',
  '/lojistik',
  '/sevkiyat',
  '/paketleme',
  '/insan-kaynaklari',
  '/saha-satis',
  '/bayi',
  '/whatsapp',
  '/sosyal-medya',
  '/instagram',
  '/facebook',
  '/linkedin',
  '/x',
  '/tiktok',
  '/openai',
  '/raporlar',
  '/dashboard',
] as const

export type ModuleSeoPath = (typeof MODULE_SEO_PATHS)[number]

export function getSeoContent(path: string): PageSeo | undefined {
  return SEO_CONTENT[path]
}

export function listSeoPaths(): string[] {
  return Object.keys(SEO_CONTENT)
}
