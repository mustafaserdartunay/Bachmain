import { Link } from 'react-router-dom'
import ScrollReveal from '../components/ScrollReveal'
import { faqItems } from '../data/navigation'
import { useState } from 'react'

export function FaqSection() {
  const [open, setOpen] = useState(null)
  return (
    <section className="section-pad">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="section-title text-center">Sık Sorulan Sorular</h2>
        <div className="mt-10 space-y-3">
          {faqItems.map((item, i) => (
            <div key={i} className="saas-card overflow-hidden !p-0">
              <button
                type="button"
                className="flex w-full items-center justify-between px-6 py-4 text-left font-semibold text-slate-800"
                onClick={() => setOpen(open === i ? null : i)}
              >
                {item.q}
                <span className="text-blue-600">{open === i ? '−' : '+'}</span>
              </button>
              {open === i && (
                <div className="border-t border-slate-100 px-6 py-4 text-slate-500">{item.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FaqPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Sık Sorulan Sorular</h1>
      </section>
      <FaqSection />
    </div>
  )
}

export function HelpPage() {
  const topics = [
    { title: 'Başlangıç Rehberi', desc: 'İlk kurulum ve kullanıcı ekleme' },
    { title: 'Modül Eğitimleri', desc: 'CRM, ERP, Stok videoları', to: '/egitim' },
    { title: 'API Dokümantasyonu', desc: 'Entegrasyon geliştiricileri için' },
    { title: 'Destek Talebi', desc: 'Teknik destek formu' },
  ]
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <h1 className="text-4xl font-extrabold text-slate-900">Yardım Merkezi</h1>
        <p className="mt-3 text-slate-500">Rehberler, eğitimler ve destek</p>
      </section>
      <section className="section-pad">
        <div className="mx-auto grid max-w-4xl gap-4 px-4 sm:grid-cols-2">
          {topics.map((t) => (
            <Link key={t.title} to={t.to || '/faq'} className="saas-card block p-6">
              <h3 className="font-bold text-slate-900">{t.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{t.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

const educationTopics = [
  {
    category: 'Başlangıç',
    items: [
      { title: 'İlk Kurulum ve Hesap Açma', level: 'Başlangıç', duration: '8 dk' },
      { title: 'Kullanıcı ve Rol Tanımlama', level: 'Başlangıç', duration: '10 dk' },
      { title: 'Firma Ayarları ve Logo', level: 'Başlangıç', duration: '6 dk' },
      { title: 'Gündüz / Gece Modu', level: 'Başlangıç', duration: '3 dk' },
    ],
  },
  {
    category: 'CRM',
    items: [
      { title: 'Müşteri Kartı Oluşturma', level: 'Başlangıç', duration: '12 dk' },
      { title: 'Fırsat ve Pipeline Yönetimi', level: 'Orta', duration: '15 dk' },
      { title: 'Görev ve Randevu Takibi', level: 'Orta', duration: '10 dk' },
      { title: 'Aktivite Arşivi Kullanımı', level: 'Orta', duration: '9 dk' },
    ],
  },
  {
    category: 'Satış & Teklif',
    items: [
      { title: 'Hızlı Teklif Hazırlama', level: 'Başlangıç', duration: '14 dk' },
      { title: 'Siparişe Dönüştürme', level: 'Orta', duration: '11 dk' },
      { title: 'Kampanya ve Fiyat Listeleri', level: 'Orta', duration: '13 dk' },
    ],
  },
  {
    category: 'Stok & Depo',
    items: [
      { title: 'Ürün ve Stok Girişi', level: 'Başlangıç', duration: '12 dk' },
      { title: 'Depo Transferi', level: 'Orta', duration: '10 dk' },
      { title: 'Kritik Stok Uyarıları', level: 'Orta', duration: '7 dk' },
    ],
  },
  {
    category: 'Üretim',
    items: [
      { title: 'İş Emri Oluşturma', level: 'Orta', duration: '16 dk' },
      { title: 'Fotoğraflı Üretim Takibi', level: 'Orta', duration: '12 dk' },
      { title: 'MRP Temelleri', level: 'İleri', duration: '18 dk' },
    ],
  },
  {
    category: 'Saha Satış',
    items: [
      { title: 'Mobil Saha Uygulaması', level: 'Başlangıç', duration: '10 dk' },
      { title: 'GPS ve Rota Planlama', level: 'Orta', duration: '14 dk' },
      { title: 'Puantaj ve Prim', level: 'Orta', duration: '11 dk' },
    ],
  },
  {
    category: 'Finans & E-Fatura',
    items: [
      { title: 'Kasa ve Banka Hareketleri', level: 'Başlangıç', duration: '12 dk' },
      { title: 'Cari Hesap ve Ekstre', level: 'Orta', duration: '13 dk' },
      { title: 'E-Fatura Gönderimi', level: 'Orta', duration: '15 dk' },
    ],
  },
  {
    category: 'B2B Portal',
    items: [
      { title: 'Müşteri Portalı Tanıtımı', level: 'Başlangıç', duration: '9 dk' },
      { title: 'B2B Sipariş ve Onay', level: 'Orta', duration: '12 dk' },
      { title: 'Canlı Mesaj ve Ticket', level: 'Orta', duration: '8 dk' },
    ],
  },
]

export function EducationPage() {
  return (
    <div className="page-mesh">
      <section className="page-hero text-center">
        <div className="mx-auto max-w-3xl px-4">
          <span className="pill">Eğitim Merkezi</span>
          <h1 className="mt-4 text-4xl font-extrabold text-slate-900">BACHMAIN Eğitimleri</h1>
          <p className="mt-3 text-slate-500">
            Konu başlıklarıyla adım adım öğrenin. Örnek müfredat — videolar yakında.
          </p>
        </div>
      </section>

      <section className="section-pad">
        <div className="mx-auto max-w-7xl space-y-10 px-4 lg:px-8">
          {educationTopics.map((group, gi) => (
            <ScrollReveal key={group.category} delay={gi * 0.04}>
              <div>
                <div className="mb-4 flex items-end justify-between gap-4">
                  <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                    {group.category}
                  </h2>
                  <span className="text-sm text-slate-400">{group.items.length} konu</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((item) => (
                    <div key={item.title} className="saas-card flex flex-col p-5">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-blue-600">
                        <span>{item.level}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-400">{item.duration}</span>
                      </div>
                      <h3 className="mt-2 font-bold text-slate-900">{item.title}</h3>
                      <p className="mt-2 flex-1 text-sm text-slate-500">
                        Örnek eğitim başlığı — içerik yakında eklenecek.
                      </p>
                      <div className="mt-4 text-sm font-semibold text-blue-600">Yakında →</div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      <section className="section-pad pt-0">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <div className="saas-card p-8">
            <h2 className="text-xl font-extrabold text-slate-900">Canlı eğitim mi istiyorsunuz?</h2>
            <p className="mt-2 text-slate-500">Ekibiniz için özel onboarding planlayalım.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/demo" className="btn-primary">
                Demo Talep Et
              </Link>
              <Link to="/contact" className="btn-secondary">
                İletişime Geç
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
