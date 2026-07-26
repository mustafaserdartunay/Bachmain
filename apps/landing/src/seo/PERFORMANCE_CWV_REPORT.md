# BachMain — Teknik SEO, Performans & Core Web Vitals Raporu

Tarih: 2026-07-26 · Uygulama: `apps/landing` · Tasarım değişmedi.

## 1. Analiz özeti (önce → sonra)

| Alan               | Önce                         | Sonra                                              |
| ------------------ | ---------------------------- | -------------------------------------------------- |
| JSON-LD / Metadata | Güçlü                        | Korundu + alias canonical düzeltildi               |
| next/image         | 0 kullanım                   | `OptimizedImage` + blur LQIP                       |
| Font               | Poppins next/font (5 weight) | Aynı + `adjustFontFallback`, swap, preload         |
| Code splitting     | Yok                          | Home + module dashboard + Footer lazy              |
| Cache headers      | Sadece `/assets`             | `/_next/static`, `/bachy`, güvenlik + HSTS + CSP   |
| 404 / 500          | Default                      | Branded `not-found` / `error` / `global-error`     |
| Duplicate aliases  | Self-canonical + index       | Canonical → kısa URL + `noIndex` + robots disallow |
| Görseller          | Ağır PNG                     | Logo −44%; mascot/testimonial WebP (−80%+)         |
| OG image           | 1024×125 logo                | Gerçek `1200×630` `og-default.png`                 |

## 2. Düzenlenen / eklenen dosyalar

**Yeni**

- `src/components/seo/OptimizedImage.tsx`
- `src/seo/imageBlur.ts`
- `src/app/not-found.tsx`
- `src/app/error.tsx`
- `src/app/global-error.tsx`
- `public/assets/og-default.png`
- `public/bachy/bachy-pro.webp`, `bachy-register.webp`
- `public/assets/testimonials/*.webp`
- `src/seo/PERFORMANCE_CWV_REPORT.md` (bu dosya)

**Güncellenen**

- `next.config.ts` — image formats, compress, optimizePackageImports
- `vercel.json` (+ `apps/web/vercel.json`) — cache, HSTS, CSP, ecommerce redirect
- `src/app/layout.tsx` — font fallback, dns-prefetch/preconnect
- `src/app/robots.ts` — alias disallow + Bing/AI bots
- `src/app/manifest.ts` — doğru icon boyutları
- `src/seo/site.ts`, `buildMetadata.ts`, `pages.ts` — OG + `canonicalPath`
- `src/components/Logo.jsx`, `pricing/PricingMascot.tsx`, `marketing/BachyMascot.tsx`
- `src/components/auth/AuthHero.tsx`, `landing/LiveCrmDashboard.jsx`, `MarketingMockups.jsx`
- `src/views/HomePage.jsx` — dynamic imports + OptimizedImage
- `src/components/seo/SiteShell.tsx`, `SeoModuleView.tsx`
- `src/data/premiumLanding.js`, `pricing/pricingTokens.ts`
- `public/assets/bachmain-logo.png` (sıkıştırıldı)

## 3. Performans kazanımları

| Varlık              | Önce            | Sonra                                         |
| ------------------- | --------------- | --------------------------------------------- |
| `bachmain-logo.png` | ~89 KB          | ~50 KB                                        |
| Bachy pro           | 414 KB PNG      | **56 KB WebP**                                |
| Bachy register      | 220 KB PNG      | **35 KB WebP**                                |
| Testimonials        | ~87 KB JPG      | ~34 KB WebP                                   |
| OG                  | Yanlış boyut    | 1200×630 (~43 KB)                             |
| Home JS             | Tek büyük chunk | Dashboard / Modules / Process / DemoForm ayrı |

CDN: Gzip/Brotli Vercel’de aktif (`compress: true` + edge).  
Static assets: `max-age=31536000, immutable` (`/_next/static`, `/assets`, `/bachy`).

## 4. SEO puanı (tahmini)

| Kategori       | Önce (tahmini) | Hedef / sonra                                       |
| -------------- | -------------- | --------------------------------------------------- |
| Lighthouse SEO | ~95–100        | **100** (canonical/robots/404 iyileşti)             |
| Best Practices | ~85–92         | **~95+** (HSTS, CSP, nosniff)                       |
| Accessibility  | ~90            | **~92–95** (skip link, main, alt, 404)              |
| Performance    | ~55–75 (mobil) | **~75–90** (görsel + splitting; lab ölçümü gerekir) |

## 5. Core Web Vitals (tahmini — lab)

| Metrik  | Beklenti                               | Not                                              |
| ------- | -------------------------------------- | ------------------------------------------------ |
| **LCP** | İyileşme (logo/WebP/OG + preload font) | Hero dashboard hâlâ ağır DOM — ölç               |
| **INP** | Orta iyileşme                          | Framer Motion lazy bölümlerde gecikmeli yüklenir |
| **CLS** | İyileşme                               | width/height + blur placeholder                  |

Gerçek skor için: PageSpeed Insights / Search Console CrUX (field).

## 6. Static vs dynamic

Tüm marketing sayfaları **`output: 'export'` → SSG**. Auth formları client hydrate; sunucu runtime yok. Uygun ayrım korunuyor.

## 7. Eksik kalan teknik SEO

1. Kullanılmayan Bachy PNG’ler hâlâ `public/bachy/` altında (~3 MB deploy şişkinliği) — güvenli silme onayı bekleniyor.
2. Static export’ta Next Image Optimization API kapalı (`unoptimized: true`) — AVIF/WebP runtime dönüşümü yok; kaynak WebP ile telafi edildi.
3. Gerçek müşteri **Review/AggregateRating** yok.
4. Production CSP hâlâ `'unsafe-inline'` / `'unsafe-eval'` (Next hydration) — sıkı nonce CSP sonraki adım.
5. Field CWV / PSI skorları henüz ölçülmedi.
6. GSC / Bing verification env (`NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_BING_SITE_VERIFICATION`) production’da set edilmeli.

## 8. Öncelikli sonraki adımlar

1. **Yüksek:** PSI + CrUX ölçümü; LCP elementini (dashboard vs logo) doğrula.
2. **Yüksek:** Kullanılmayan `/bachy/*.png` ve `register-scene*` dosyalarını sil.
3. **Orta:** Framer Motion’ı yalnızca etkileşimli bileşenlerde tut; `prefers-reduced-motion` genişlet.
4. **Orta:** Critical CSS / CSS atomizasyonu (`index.css` ~2k satır elle yazılmış).
5. **Düşük:** `@next/bundle-analyzer` CI’ya ekle.
6. **Düşük:** Sıkı CSP (nonce) + Report-Only denemesi.

## Not: Sora font

Üretim UI **Poppins** kullanıyor (mevcut tasarım). Sora yalnızca dokümantasyonda geçiyor; tasarımı bozmamak için Poppins `next/font` ile optimize edildi (swap, preload, subset, fallback).
