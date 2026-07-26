# BachMain — SaaS Satış / Dönüşüm Raporu

Tarih: 2026-07-26 · Tasarım dili korundu (renkler, btn-*, saas-card, Bachy).

## 1. Analiz — dönüşümü düşüren noktalar (önce)

- Modül SEO sayfaları öğreticiydi ama satış hunisi (sorun→çözüm→CTA→paket) zayıftı
- Demo formu fazla alanlıydı
- Sticky CTA yoktu
- Analytics / pixel yoktu
- Sektör / case study / referans sayfaları yoktu
- Nav eski EN path’lere gidiyordu
- Tek fiyat kartı vardı; Starter/Pro/Enterprise + Bachy anlatımı eksikti

## 2. Modül satış landing’leri (13)

`/crm` `/erp` `/muhasebe` `/e-fatura` `/uretim` `/depo` `/finans` `/lojistik` `/insan-kaynaklari` `/whatsapp` `/instagram` `/sosyal-medya` `/openai`

Yapı: Hero · Sorun · Çözüm · Özellikler · Avantajlar · Video · Ekranlar · Yorumlar · SSS · Paketler · Demo CTA · İlgili konular

## 3. Sektör sayfaları (15)

`/sektorler` + `/sektorler/{mobilya,makine,tekstil,gida,otomotiv,insaat,e-ticaret,toptan-satis,perakende,medikal,lojistik-sektor,uretim-sektor,kimya,ambalaj,elektronik}`

## 4. Referans & başarı

- `/referanslar` — kurumsal kartlar
- `/basari-hikayeleri` + 3 case study (ROI / zaman / verimlilik metrikleri)

## 5. Dönüşüm geliştirmeleri

- Sticky CTA (Demo / Ücretsiz Dene / Uzmanla Görüş)
- Demo form sadeleştirildi (4 alan + güven satırı) + `demo_submit` event
- Hero güven rozetleri (Bulut / AI / Güvenli / 7-24)
- AuthHero: Bachy karşılama + KVKK/SSL/Veri/Bulut
- Header: Demo + Ücretsiz Dene + kısa TR ürün/sektör linkleri
- Fiyat: Starter (işaret) · Pro (sarıl) · Enterprise (uzan) Bachy katmanı + Full paket kartı
- CTA tracking: `trackCta` → dataLayer / gtag / fbq / lintrk / clarity / hj
- AnalyticsScripts: GTM, GA4, Meta Pixel, LinkedIn, Clarity, Hotjar (env ile)

## 6. Env

`.env.example` — `NEXT_PUBLIC_GTM_ID`, `GA4`, `META_PIXEL`, `LINKEDIN_PARTNER`, `CLARITY`, `HOTJAR`

## 7. Eksik / sonraki öncelik

1. Gerçek müşteri logoları + video referanslar
2. VideoObject + gerçek ürün ekran görüntüleri
3. A/B test altyapısı (GTM)
4. Canlı CRM lead pipeline entegrasyon metrik paneli
5. Starter/Pro ücretli checkout (şimdi marketing hunisi; satın alma Full)
