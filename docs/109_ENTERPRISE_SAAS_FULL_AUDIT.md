# BachMain Enterprise SaaS Denetim Raporu

**Tarih:** 2026-07-26  
**Kapsam:** Monorepo tamamı (CRM `src/`, `apps/api`, `apps/admin`, `apps/landing`, `server/`, `api/`)  
**Perspektif:** CTO · Yazılım Mimarı · DevOps · QA · Siber Güvenlik · SaaS Danışmanı  
**Hedef soru:** 10.000+ şirket ölçeğinde production-ready mi?

---

## Yönetici özeti (tek cümle)

BachMain; zengin bir **istemci-ağırlıklı CRM ürün yüzeyi** + **güçlenen platform iskeleti** (Fastify/Drizzle/Neon, admin, marketing) sunar; ancak **sunucu-otoriteli multi-tenant SoT, RLS, CSRF, test, DR kanıtı ve üretim entegrasyonları** olmadan “10.000 şirketlik Enterprise SaaS” olarak **güvenle satılamaz**.

**Nihai karar:** **Hayır**

---

## Mimari gerçeklik haritası

| Katman       | Konum                       | Gerçek rol                                    |
| ------------ | --------------------------- | --------------------------------------------- |
| CRM ürün     | Kök `src/` (Vite)           | Operasyon UI — veri çoğunlukla `localStorage` |
| Platform API | `apps/api`                  | Fastify + Drizzle + Postgres — hedef omurga   |
| Yönetim      | `apps/admin`                | Üyelik, faturalama, WhatsApp, mail, audit UI  |
| Marketing    | `apps/landing` → `apps/web` | SEO/GEO/satış sitesi (güçlü)                  |
| AI proxy     | `server/` + `api/`          | OpenAI proxy’leri                             |
| iOS          | `bach-crm-ios/`             | Companion                                     |

**Kritik mimari gerçek:** CRM’nin Source of Truth’u hâlâ tarayıcı deposu; Neon/API dual-write varsayılan kapalı (`docs/54_CRM_TENANT_CUTOVER.md`, `src/utils/crmApiDualWrite.js`).

---

## Puanlama (100)

| Başlık               | Puan   | Gerekçe                                               |
| -------------------- | ------ | ----------------------------------------------------- |
| Kod Kalitesi         | 58     | Zengin UI; tekrar, stub center’lar, test yok          |
| Mimari               | 45     | Split brain (localStorage vs API); iki JWT dünyası    |
| Performans           | 55     | Landing optimize; CRM bundle/localStorage ölçeklenmez |
| SEO                  | 88     | Landing Metadata, schema, GEO, sitemap olgun          |
| Güvenlik             | 38     | Token localStorage, CSRF yok, RLS yok, upload riski   |
| Kullanıcı Deneyimi   | 72     | Derin ekranlar + onboarding; ErrorBoundary yok        |
| Mobil Uyumluluk      | 60     | Responsive UI; native/offline zayıf                   |
| Yapay Zeka Altyapısı | 50     | Proxy gerçek; ürün AI center’ları çoğunlukla stub     |
| Veritabanı           | 48     | Drizzle migrasyonları iyi; CRM SoT DB değil; RLS yok  |
| API Yapısı           | 62     | Fastify modüler; CRM hâlâ client SoT                  |
| Entegrasyonlar       | 42     | WhatsApp/Meta kısmen; e-fatura/Paraşüt/Hub stub       |
| Bakım Kolaylığı      | 40     | Dokümantasyon var; test/CI placeholder                |
| Ölçeklenebilirlik    | 28     | 10k tenant için localStorage imkânsız                 |
| **Satışa Hazırlık**  | **32** | Pilot mümkün; güvenli ticari ölçek hayır              |

**Ortalama (ağırlıksız):** ~51 / 100

---

## ✅ Güçlü yönler

1. **Ürün yüzeyi geniş:** Teklif → sipariş → üretim → depo → kasa/stok akışı gerçekten derin UI (`QuotesPage`, `OrdersPage`, `ProductionPage`, `DepoWorkspace`, `CashPage`).
2. **Auth/onboarding iskeleti:** Giriş/kayıt, lisans/trial gate, `/kurulum` sihirbazı (`OnboardingWizard.jsx`, `RequireAuth`).
3. **Platform API scaffold:** Fastify, Helmet, rate-limit, JWT+refresh cookie, MFA şeması, `companyId` filtreleri, Drizzle migrasyonları.
4. **Yönetim paneli:** Abonelik, staff, mail (Resend), WhatsApp Cloud API, audit sayfası.
5. **Marketing/SEO/GEO:** Landing Next.js, JSON-LD, Knowledge Base, satış landing’leri, analytics scaffolding.
6. **Operasyon dokümanları:** Cutover, DR runbook, commercial gate audit (`docs/54`, `55`, `108`) — farkındalık yüksek.
7. **Soft delete (kısmi):** Client trash + API `deletedAt` pattern’i mevcut.

---

## ⚠️ İyileştirilmesi gerekenler

1. Fine-grained RBAC (şu an API’de geniş `*` + frontend’de yalnızca paket entitlements).
2. React ErrorBoundary + gerçek Sentry (`src/utils/sentry.js` stub).
3. Otomatik test (Jest/Vitest/Playwright) — CI `test-placeholder`.
4. Dosya yükleme → R2/MinIO + MIME/boyut/antivirus hattı (şu an data URL → localStorage).
5. Audit log kapsamını finans/sipariş/stok mutasyonlarına yaygınlaştırma.
6. SMS/Push bildirim kanalları; CRM bell çoğunlukla lokal.
7. e-Fatura GİB üretim yolu; Paraşüt `coming`; Integration Hub in-memory.
8. CSRF (özellikle admin `SameSite=None` cookie’leri).
9. Bundle splitting / N+1 — CRM büyük sayfalar; API query review.
10. Onboarding sonrası “ilk 10 dakika” başarı metrikleri ve empty-state rehberleri.

---

## 🚨 Kritik sorunlar

| #   | Sorun                          | Etki                                            | Kanıt                                           |
| --- | ------------------------------ | ----------------------------------------------- | ----------------------------------------------- |
| 1   | **CRM SoT = localStorage**     | Multi-user, multi-device, tenant izolasyonu yok | `workspaceStorage.js`, `crmStore.js`, docs/54   |
| 2   | **Postgres RLS yok**           | Tek unutulan `companyId` = veri sızıntısı riski | `apps/api` schema; docs/58                      |
| 3   | **Access token localStorage**  | XSS → hesap ele geçirme                         | `platformAuth.js`                               |
| 4   | **CSRF koruması yok**          | Cookie tabanlı oturumlarda risk                 | Admin auth cookies                              |
| 5   | **Upload güvenlik modeli yok** | Depolama şişmesi, XSS via SVG/HTML              | `ProductFilesUpload.jsx`                        |
| 6   | **Stub’lar ürün gibi duruyor** | Satış vaadi ≠ teslim                            | Integration Hub, finance localStore, AI centers |
| 7   | **DR/backup kanıtlanmamış**    | Felakette RTO/RPO bilinmiyor                    | docs/55; Security Center placeholder            |
| 8   | **Test yok**                   | Regresyon körlüğü                               | CI placeholder                                  |
| 9   | **AI proxy secret opsiyonel**  | Açık proxy maliyeti/abuse                       | `server/env.js`                                 |
| 10  | **İki auth dünyası**           | Admin HMAC JWT vs API jose                      | Misconfig / tutarsızlık                         |

---

## Modül denetim özeti

| Modül                           | Durum         | Not                                  |
| ------------------------------- | ------------- | ------------------------------------ |
| CRM (müşteri/görev/fırsat)      | Güçlü UI      | Client SoT                           |
| Teklif / Sipariş                | Güçlü UI      | Client SoT                           |
| Üretim / Üretim Takibi          | Güçlü UI      | Fotoğraflı süreç client              |
| Depo / Stok                     | Güçlü UI      | Placeholder kalıntıları var          |
| Finans / Cari / Kasa            | Karışık       | Kasa derin; finans center localStore |
| Muhasebe / E-Fatura             | Zayıf–orta    | E-fatura local; GİB yok              |
| İK / Saha / B2B / Lojistik      | Orta–güçlü UI | Persistence client                   |
| WhatsApp / Omnichannel          | Kısmen prod   | Admin Cloud API + CRM inbox          |
| Instagram/FB/LinkedIn/TikTok    | Kısmen        | Meta social modül + demo riski       |
| AI Asistan                      | Kısmen        | Proxy gerçek; center stub            |
| Dashboard / Raporlar            | Orta          | Client aggregations                  |
| Yönetim / Şirket / Paket / Demo | Orta–güçlü    | Admin gerçek; CRM paket entitlements |
| Roller (personel)               | Zayıf         | Enterprise RBAC yok                  |

---

## OWASP / güvenlik (özet)

| Kontrol       | Durum                                            |
| ------------- | ------------------------------------------------ |
| XSS           | Risk yüksek (token LS + HTML/data URL)           |
| CSRF          | **Yok**                                          |
| SQLi          | Drizzle ile düşük; raw SQL audit edilmeli        |
| IDOR / tenant | API’de cid filtreleri var; CRM LS’de anlamsız    |
| AuthN         | Var (login/MFA şema)                             |
| AuthZ         | Kaba; `*` permission                             |
| Rate limit    | API + admin auth var                             |
| CSP           | Landing vercel headers; CRM app tam CSP belirsiz |
| Secrets       | Server key’ler env; WA token JSON riski          |

---

## Ölçek darboğazları

| Ölçek      | Darboğaz                                                            |
| ---------- | ------------------------------------------------------------------- |
| 100 şirket | LS + destek yükü yönetilebilir (tek kullanıcı/cihaz varsayımı)      |
| 1.000      | Multi-user çöküş; sync çakışması; destek maliyeti                   |
| 10.000     | **API/DB cutover şart**; RLS; kuyruk; object storage                |
| 100.000    | Shard/read-replica; event bus; gözlemlenebilirlik; maliyet kontrolü |

---

## İlk 10 dakika (yeni kullanıcı) riskleri

1. Onboarding sonrası boş veri → “sistem boş” algısı
2. Modül bolluğu → yön kaybı
3. localStorage limit / başka cihazda veri yok
4. Entegrasyon vaatleri çalışmıyor gibi görünebilir
5. Yetki ayrımı yok → tüm personel her şeyi görür
6. Hata olursa beyaz ekran (ErrorBoundary yok)

**Öneri:** Rol bazlı “ilk başarı” turu (1 müşteri, 1 teklif, 1 stok) + örnek veri seti.

---

## 🎯 Satış öncesi yapılması gerekenler (öncelik)

1. **CRM SoT → Postgres cutover** (dual-write → read API → LS kapat)
2. **RLS + her sorguda company_id zorunluluğu**
3. **HttpOnly access stratejisi / CSRF**
4. **Object storage + güvenli upload**
5. **Stub’ları gizle veya “beta” etiketle** (satış vaadi = teslim)
6. **Backup restore drill** (kanıtlı)
7. **E2E smoke + kritik path testleri**
8. **Personel RBAC (en az: Admin / Satış / Depo / Muhasebe)**

---

## 📈 30 / 90 / 365 gün

### 30 gün

- Cutover pilot (1–3 tenant): API read/write CRM core
- CSRF + token storage düzeltmesi
- ErrorBoundary + Sentry gerçek
- Stub menüleri shelve/beta
- Backup restore tatbikatı #1
- Playwright: login → müşteri → teklif → sipariş

### 90 gün

- RLS + tenant isolation pentest
- Upload → R2
- RBAC matris UI + API enforce
- e-Fatura üretim yolu veya “yakında” netliği
- Audit coverage finans/stok
- Observability (APM, slow query)

### 1 yıl

- 10k tenant kapasite testi
- Integration Hub gerçek konektörler
- DR bölgesel failover
- SLA/uptime programı
- Mobil offline stratejisi

---

## “Bugün ücretli müşteriye güvenle satılır mı?”

# **Hayır**

### Gerekçe

“Güvenle satmak”, verinin **sunucuda izole**, **yedekli**, **yetkilendirilmiş** ve **sözleşmeyle uyumlu** teslimidir. Bugün BachMain:

- Veriyi müşteri tarayıcısına yazıyor (multi-tenant SaaS değil),
- Tenant izolasyonunu DB seviyesinde (RLS) garanti etmiyor,
- CSRF/upload/DR/test boşlukları taşıyor,
- Satışta görünen bazı entegrasyonlar stub.

**Kısmen** yalnızca şu şartla düşünülebilir: tek şube, az kullanıcı, yazılı limitasyonlar, “pilot / early access”, veri kaybı riskinin müşteriye açık beyanı. Bu, “Enterprise 10.000 şirket SaaS” tanımı değildir.

Marketing sitesi satılabilir; **ürün omurgası satılmadan önce cutover tamamlanmalıdır.**

---

_Bu rapor kod değişikliği önermez; mevcut tasarımı bozmadan kurumsal hazırlık için denetim çıktısıdır._
