# BachMain GEO (Generative Engine Optimization) Raporu

Tarih: 2026-07-26 · Tasarım değiştirilmedi.

## 1. Yeni sayfalar

| URL                   | Açıklama                                |
| --------------------- | --------------------------------------- |
| `/knowledge`          | Knowledge Base index                    |
| `/knowledge/[slug]`   | 22 kategori rehberi (1000+ kelime)      |
| `/sss`                | 115 soruluk SSS merkezi (+ FAQ schema)  |
| `/help-center`        | Modül yardım merkezi                    |
| `/help-center/[slug]` | 10 kullanım rehberi                     |
| `/akademi`            | BachMain Akademi                        |
| `/akademi/videolar`   | Video eğitim sayfası                    |
| `/docs`               | Docs hub                                |
| `/docs/api`           | API dokümantasyonu                      |
| `/docs/developers`    | Geliştirici dokümantasyonu              |
| `/sozluk`             | Mini sözlük                             |
| `/blog/konular`       | 115 blog konu planı (editorial backlog) |

Mevcut `/help`, `/faq`, `/egitim`, `/blog` korundu; GEO hub’lara bağlandı.

## 2. Knowledge Base kategorileri (22)

CRM, ERP, Muhasebe, E-Fatura, Teklif, Sipariş, Üretim, Üretim Takibi, Depo, Stok, Cari Hesap, Finans, Lojistik, İnsan Kaynakları, WhatsApp, Instagram, Facebook, LinkedIn, Yapay Zeka, OpenAI, Raporlama, Dashboard.

Her rehber bölümleri: Nedir? · Ne işe yarar? · Kimler kullanır? · Avantajlar · Dezavantajlar · Nasıl çalışır? · En iyi uygulamalar · Sık hatalar · BachMain çözümü · SSS · Mini sözlük · İlgili konular.

Kaynak: `src/geo/guides/catalog.ts`

## 3. Blog konu planı

**115** konu — her biri: Title, Slug, Description, Focus Keyword, Meta Description, Outline, relatedModules.

Liste: `/blog/konular` · veri: `src/geo/blogTopics.ts`

## 4. Help Center

10 kullanım rehberi: CRM, ERP, Muhasebe, Üretim, Depo, Finans, Lojistik, WhatsApp, Instagram, AI Asistan.

## 5. İç linkleme

- Knowledge ↔ ürün modülleri (`/crm`, `/erp`, …)
- Knowledge ↔ Help Center ↔ SSS ↔ Akademi ↔ Docs
- Modül SEO sayfalarına «İlgili konular» (SeoModuleView)
- Blog → Knowledge / Help / SSS
- Nav + footer support menüsü GEO hub’lara güncellendi
- Sitemap: hub’lar + 22 knowledge + 10 help-center URL

## 6. Schema

- Knowledge guide: WebPage + Article + FAQPage + Breadcrumb
- `/sss`: FAQPage + Breadcrumb
- Hub’lar: WebPage/CollectionPage + Breadcrumb
- Metadata: Title, Description, OG, Twitter, Canonical (`buildMetadata` / `geoHubSeo` / `guideToPageSeo`)

## 7. Eksik kalan (öncelik)

1. **Yüksek:** Video eğitimlerinin gerçek video URL / VideoObject schema ile doldurulması
2. **Yüksek:** Blog konu planından seçilen 10–20 yazının tam gövde yayını
3. **Orta:** API Docs’a OpenAPI/Swagger örnekleri
4. **Orta:** Knowledge rehberlerine sektör vaka çalışmaları
5. **Düşük:** `/faq` → `/sss` 301 (isteğe bağlı birleştirme)

## 8. AI Overview / ChatGPT hedef sorular

Rehber ve SSS içinde doğal yanıtlar: CRM nedir?, ERP nedir?, CRM–ERP farkı, Bulut ERP, Üretim takibi, Depo önemi, E-Fatura zorunluluğu, WhatsApp CRM, Yapay zekâ işletmelere yardımı.
