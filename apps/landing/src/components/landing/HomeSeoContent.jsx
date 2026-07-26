'use client'

import { Link } from 'react-router-dom'
import ScrollReveal from '../ScrollReveal'

const sections = [
  {
    title: 'İşletmenizin Tüm Süreçlerini Tek Platformdan Yönetin',
    body: 'Farklı programlar arasında veri aktarmak, aynı bilgileri tekrar tekrar girmek ve süreçleri manuel olarak takip etmek hem zaman kaybına hem de operasyonel hatalara neden olur. BachMain, tüm departmanları ortak bir veri yapısında buluşturarak işletmenizin tüm süreçlerini tek merkezden yönetmenizi sağlar. Satış, muhasebe, üretim, stok, depo, finans ve lojistik ekipleri aynı sistem üzerinde gerçek zamanlı çalışır. Böylece bilgi kaybı yaşanmaz, süreçler hızlanır ve işletme genelinde tam kontrol sağlanır.',
  },
  {
    title: 'CRM ile Müşteri İlişkilerinizi Güçlendirin',
    body: 'Müşteri ilişkileri işletmelerin en önemli varlıklarından biridir. BachMain CRM modülü sayesinde potansiyel müşterilerinizi takip edebilir, satış fırsatlarını yönetebilir, teklif hazırlayabilir, sipariş oluşturabilir ve tüm müşteri geçmişini tek ekranda görüntüleyebilirsiniz. Görev yönetimi, randevu planlama, satış süreçleri, müşteri notları ve ekip performansı gibi birçok işlemi kolayca yöneterek satış süreçlerinizi daha verimli hale getirebilirsiniz.',
  },
  {
    title: 'ERP ile İşletmenizin Tüm Operasyonlarını Tek Çatı Altında Toplayın',
    body: 'BachMain ERP sistemi, işletmenizin tüm operasyonlarını birbirine entegre eder. Üretim, stok, depo, satın alma, finans, muhasebe ve lojistik süreçleri aynı veri tabanı üzerinde çalışır. Departmanlar arasında veri tekrarını ortadan kaldırır ve tüm süreçlerin gerçek zamanlı olarak izlenmesini sağlar. Böylece işletmeniz daha planlı, daha hızlı ve daha verimli çalışır.',
  },
  {
    title: 'Muhasebe ve Finans Yönetimini Kolaylaştırın',
    body: 'BachMain Ön Muhasebe modülü ile cari hesaplarınızı takip edebilir, tahsilat ve ödeme işlemlerinizi yönetebilir, kasa ve banka hareketlerinizi görüntüleyebilir, gelir gider kayıtlarınızı oluşturabilir ve finansal raporlarınızı anlık olarak alabilirsiniz. Finansal süreçlerinizi tek ekranda yöneterek işletmenizin nakit akışını daha sağlıklı şekilde kontrol edebilirsiniz.',
  },
  {
    title: 'E-Fatura ve Dijital Belge Yönetimini Hızlandırın',
    body: 'BachMain ile E-Fatura, E-Arşiv Fatura ve diğer dijital belgelerinizi kolayca oluşturabilir, müşterilerinize güvenli şekilde iletebilir ve tüm belge süreçlerinizi tek panelden yönetebilirsiniz. Tekliften faturaya kadar geçen tüm süreç otomatik olarak birbirine bağlı çalışır ve manuel işlem ihtiyacını önemli ölçüde azaltır.',
  },
  {
    title: 'Tekliften Teslime Kadar Uçtan Uca Süreç Yönetimi',
    body: "BachMain'in en güçlü özelliklerinden biri tüm operasyonları tek bir iş akışı içinde yönetebilmesidir. Bir müşteri için hazırlanan teklif, onaylandığında siparişe dönüşebilir. Sipariş üretime aktarılır, üretim tamamlandığında depo süreci başlar, ardından paketleme ve sevkiyat planlanır. Teslimat tamamlandıktan sonra faturalandırma ve tahsilat süreçleri aynı sistem üzerinden takip edilir. Böylece tekliften teslimata kadar geçen tüm süreç eksiksiz olarak tek platform üzerinden yönetilir.",
  },
  {
    title: 'Üretim Takibini Gerçek Zamanlı Olarak İzleyin',
    body: 'Üretim sürecindeki her ürünün hangi aşamada olduğunu anlık olarak görüntüleyebilirsiniz. İş emirleri, üretim istasyonları, operatör bilgileri, tamamlanma oranları ve planlanan teslim tarihleri tek ekranda takip edilir. Üretimde oluşabilecek gecikmeler erken tespit edilerek operasyonların daha verimli yönetilmesi sağlanır.',
  },
  {
    title: 'Depo ve Stok Yönetiminde Tam Kontrol Sağlayın',
    body: 'BachMain Depo Yönetim Sistemi sayesinde ürün girişleri, ürün çıkışları, stok hareketleri, barkod işlemleri, raf yönetimi, palet planlaması ve minimum stok seviyeleri kolayca takip edilir. Gerçek zamanlı stok bilgileri sayesinde hem satın alma hem de üretim süreçleri daha doğru planlanabilir.',
  },
  {
    title: 'Lojistik ve Sevkiyat Süreçlerini Planlayın',
    body: 'Araç planlama, yük optimizasyonu, palet hesaplamaları, koli planlaması ve sevkiyat organizasyonları BachMain üzerinden kolayca yönetilebilir. Siparişlerin hangi araçla, hangi tarihte ve hangi rota üzerinden teslim edileceği detaylı şekilde planlanabilir. Böylece lojistik süreçlerinde maliyetler azalırken operasyonel verimlilik artar.',
  },
  {
    title: 'Yapay Zekâ Destekli İş Asistanı ile Daha Verimli Çalışın',
    body: 'BachMain Yapay Zekâ Asistanı, işletmenizin günlük operasyonlarını hızlandırmak için tasarlanmıştır. Teklif hazırlayabilir, rapor oluşturabilir, finansal analizler yapabilir, üretim verilerini değerlendirebilir, satış tahminleri oluşturabilir ve kullanıcıların iş süreçlerinde akıllı öneriler sunabilir. Yapay zekâ destekli otomasyon sayesinde çalışanlar daha az zaman harcayarak daha fazla iş üretebilir.',
  },
  {
    title: 'Sosyal Medya Yönetimini Tek Panelden Gerçekleştirin',
    body: "Instagram, Facebook, LinkedIn, TikTok ve X hesaplarınızı BachMain'e bağlayarak tüm sosyal medya süreçlerinizi tek panel üzerinden yönetebilirsiniz. Yapay zekâ destekli içerikler oluşturabilir, Reels ve Story hazırlayabilir, gönderilerinizi belirli tarih ve saatlerde otomatik olarak paylaşabilir ve performans analizlerini detaylı şekilde inceleyebilirsiniz.",
  },
  {
    title: 'Bulut Tabanlı Güvenli Altyapı',
    body: 'BachMain, modern bulut teknolojileri üzerine geliştirilmiştir. Her şirket yalnızca kendi verilerine erişebilir. Rol bazlı yetkilendirme sistemi sayesinde kullanıcılar sadece izin verilen ekranları görüntüleyebilir. Güvenli kimlik doğrulama, veri şifreleme, düzenli yedekleme ve gelişmiş güvenlik önlemleriyle işletme verileriniz korunur.',
  },
  {
    title: 'Her Ölçekten İşletme İçin Tasarlandı',
    body: 'BachMain; küçük işletmelerden büyük ölçekli üretim firmalarına kadar farklı sektörlerde faaliyet gösteren işletmeler için uygundur. Üretim tesisleri, toptancılar, distribütörler, lojistik firmaları, perakende işletmeleri, e-ticaret şirketleri ve çok şubeli organizasyonlar tüm süreçlerini BachMain ile merkezi olarak yönetebilir.',
  },
  {
    title: 'Neden BachMain?',
    body: 'BachMain, işletmelerin ihtiyaç duyduğu tüm yönetim araçlarını tek platformda bir araya getirir. Modern kullanıcı deneyimi, güçlü raporlama altyapısı, yapay zekâ desteği, bulut tabanlı çalışma yapısı, mobil uyumluluğu, yüksek performansı ve sürekli geliştirilen teknolojik altyapısıyla işletmelerin dijital dönüşüm süreçlerine katkı sağlar. Farklı yazılımlar kullanmak yerine tüm süreçlerinizi tek platform üzerinden yönetebilir, zamandan tasarruf ederken operasyonel verimliliğinizi artırabilirsiniz.',
  },
]

const faqs = [
  {
    q: 'BachMain nedir?',
    a: 'BachMain; CRM, ERP, muhasebe, üretim, depo, finans, lojistik ve yapay zekâ destekli işletme yönetim süreçlerini tek platformda birleştiren bulut tabanlı bir iş yönetim yazılımıdır.',
  },
  {
    q: 'Kimler BachMain kullanabilir?',
    a: "Üretim yapan işletmeler, KOBİ'ler, dağıtım firmaları, lojistik şirketleri, toptancılar, perakende mağazaları, e-ticaret firmaları ve çok şubeli işletmeler BachMain'i kullanabilir.",
  },
  {
    q: 'Bulut tabanlı mı?',
    a: 'Evet. İnternet bağlantısı olan her yerden güvenli şekilde erişilebilir ve herhangi bir kurulum gerektirmez.',
  },
  {
    q: 'Yapay zekâ desteği bulunuyor mu?',
    a: 'Evet. BachMain AI Asistanı teklif hazırlama, raporlama, analiz, içerik üretimi ve iş süreçlerinde akıllı destek sunar.',
  },
  {
    q: 'Mobil cihazlardan kullanılabilir mi?',
    a: 'Evet. BachMain; masaüstü, tablet ve mobil cihazlarla tam uyumlu olarak geliştirilmiştir.',
  },
]

export default function HomeSeoContent() {
  return (
    <section
      id="seo-aciklama"
      className="home-seo section-pad pt-4"
      aria-labelledby="home-seo-heading"
    >
      <div className="mx-auto max-w-5xl px-4 lg:px-8">
        <ScrollReveal>
          <article className="home-seo-card">
            <p className="home-seo-kicker">
              BachMain CRM ERP Yazılımı | Muhasebe, Üretim, Depo, Finans ve Yapay Zekâ Destekli
              İşletme Yönetim Platformu
            </p>
            <h2 id="home-seo-heading" className="home-seo-title">
              Tüm Süreçler Tek Platformda
            </h2>
            <p className="home-seo-lead">
              BachMain, işletmelerin satıştan üretime, depodan muhasebeye, finanstan insan
              kaynaklarına kadar tüm operasyonlarını tek platform üzerinden yönetebilmeleri için
              geliştirilen yeni nesil bulut tabanlı CRM ve ERP yazılımıdır. Modern teknolojiler ve
              yapay zekâ desteğiyle geliştirilen BachMain; CRM, ERP, Ön Muhasebe, E-Fatura, Teklif
              Yönetimi, Sipariş Yönetimi, Üretim Takibi, Depo Yönetimi, Stok Takibi, Cari Hesap,
              Finans, Lojistik, Sevkiyat, İnsan Kaynakları, Saha Satış, Bayi Yönetimi ve Sosyal
              Medya Yönetimini tek bir sistemde birleştirerek işletmelerin verimliliğini artırmayı
              hedefler.
            </p>

            <div className="home-seo-body">
              {sections.map((item) => (
                <section key={item.title} className="home-seo-block">
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </section>
              ))}
            </div>

            <div className="home-seo-faq">
              <h3>Sık Sorulan Sorular</h3>
              <div className="space-y-3">
                {faqs.map((item) => (
                  <details key={item.q} className="home-seo-faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>

            <div className="home-seo-close">
              <h3>İşletmenizi Geleceğe Taşıyın</h3>
              <p>
                BachMain ile CRM, ERP, Ön Muhasebe, E-Fatura, Üretim Takibi, Depo Yönetimi, Stok
                Kontrolü, Finans Yönetimi, Lojistik Planlama, İnsan Kaynakları, Sosyal Medya
                Yönetimi ve Yapay Zekâ Destekli İş Süreçlerini tek platform üzerinden yönetin.
                Dijital dönüşümünüzü hızlandırın, operasyonel verimliliğinizi artırın ve işletmenizi
                geleceğin teknolojileriyle bugünden buluşturun.
              </p>
              <p className="home-seo-tagline">BachMain — Tüm Süreçler Tek Platformda.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/demo" className="home-seo-btn home-seo-btn-primary">
                  Demo Talep Et
                </Link>
                <Link to="/register" className="home-seo-btn home-seo-btn-ghost">
                  Ücretsiz Dene
                </Link>
              </div>
            </div>
          </article>
        </ScrollReveal>
      </div>
    </section>
  )
}
