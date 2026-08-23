# BACHMAIN

Kurumsal SaaS: CRM, ERP, muhasebe, stok, üretim, lojistik ve yönetim paneli. Çalışan üretim kodu korunur; temizlik ve yeni özellik mevcut yapının üzerine eklenir.

## Domainler

| Sistem                  | Domain                | Kod                      |
| ----------------------- | --------------------- | ------------------------ |
| **WEB - BACHMAIN**      | bachmain.com          | `apps/landing` (Next.js) |
| **UYGULAMA - BACHMAIN** | uygulama.bachmain.com | repo kökü (`src/`, Vite) |
| **YÖNETİM - BACHMAIN**  | yonetim.bachmain.com  | `apps/admin`             |

Ayrıntı: [`docs/PRODUCTION.md`](docs/PRODUCTION.md) · mimari: [`docs/ENTERPRISE-SAAS-ARCHITECTURE.md`](docs/ENTERPRISE-SAAS-ARCHITECTURE.md)

## Özellikler

- **Dashboard** - KPI kartları, sipariş durumu grafiği, aylık satış grafiği
- **Sipariş Yönetimi** - Sipariş listesi, durum filtreleme, yeni sipariş
- **Üretim Takibi** - İş emirleri, üretim aşamaları stepper
- **Stok Yönetimi** - Stok listesi, kritik stok uyarıları
- **Müşteri Takibi** - Müşteri listesi, ciro özeti
- **Teklifler** - Teklif yönetimi ve durum takibi
- **WhatsApp Entegrasyonu** - Gelen mesajlar
- **E-Fatura** - Fatura listesi ve durumları
- **Bayi Yönetimi** - Bayi performansı ve harita
- **Sesli AI Asistan** - Mikrofon ile konuşma, OpenAI ile otomatik işlem (müşteri, ürün, teklif)

## Proje yapısı

```text
Bachmain/
├── src/                 # UYGULAMA (CRM)
├── server/              # CRM yerel AI proxy (voice / omni)
├── apps/
│   ├── admin/           # YÖNETİM UI + canlı /api (Neon)
│   ├── landing/         # WEB (bachmain.com)
│   └── api/             # Hedef Fastify API (production kesimi ayrı iş)
├── packages/
│   ├── ui/              # Ortak UI primitives
│   └── platform-config/ # Domain URL sabitleri
├── docs/                # Şartnameler
├── scripts/             # deploy-all.sh (yalnızca onaylı push+deploy)
└── public/
```

CRM kök `src/` içinde kalır (`apps/application` göçü yok). `apps/web` eski static çıktıdır; canlı site `apps/landing`.

## Paket yöneticisi

**npm** (`package-lock.json`). pnpm/yarn’a geçilmez.

## Local geliştirme

```bash
npm install
cp .env.example .env
npm run dev                 # UYGULAMA  http://127.0.0.1:5173
npm run yonetim:open        # YÖNETİM   http://127.0.0.1:5200
npm run web:open            # WEB       http://127.0.0.1:5180
```

Yönetim için `apps/admin/.env` içinde `DATABASE_URL` gerekir (Vercel ile aynı Neon’u local’de kullanıyorsan yazma işlemine dikkat). Hedef API: `npm run api:dev` (port 8080) — canlı üye girişi varsayılan olarak yönetim `/api` üzerindedir.

## Environment

Örnek isimler (değer yok): `.env.example`, `.env.production.example`, `apps/admin/.env.example`, `apps/api/.env.example`.

Gerçek `.env` Git’e girmez. Secret’ı README’ye veya sohbete yazma. Production değişkenleri Vercel’de kalır.

## Database

Canlı üyelik/platform durumu: **Neon**, `apps/admin/server/db.mjs` (`DATABASE_URL`). CRM iş verisinin çoğu tarayıcı `localStorage` + tenant senkronu.

DROP / TRUNCATE / production migration yok. Ayrıntı: [`docs/56_DATABASE_CURRENT_STATE.md`](docs/56_DATABASE_CURRENT_STATE.md)

## GitHub

Kaynak: `github.com/mustafaserdartunay/Bachmain` · üretim branch: **`main`**. Force push / history rewrite yok. Commit ve `git push` yalnızca açık onayla.

## Vercel

Üç production proje (CRM kök, admin `apps/admin`, web `apps/landing`). Ayar, domain ve env **değerleri** bu repodan değiştirilmez. Production deploy ayrı onay ister. Script: `scripts/deploy-all.sh`.

DNS (Squarespace) özeti [`docs/PRODUCTION.md`](docs/PRODUCTION.md) içindedir.

### CRM (uygulama.bachmain.com)

SPA rotaları kök `vercel.json` rewrite ile çalışır. AI uçları `/api/voice/*` ve `/api/omni/*`.

### Node sunucusu (VPS / Railway / Render)

```bash
npm run build
npm start
```

Varsayılan port: `4173`. Ortam değişkenleri (değerler Vercel/sunucuda):

| Değişken                  | Açıklama                                   |
| ------------------------- | ------------------------------------------ |
| `OPENAI_API_KEY`          | OpenAI (sesli asistan)                     |
| `OPENAI_MODEL`            | Model (varsayılan gpt-5.5-pro)             |
| `OPENAI_REASONING_EFFORT` | GPT-5 reasoning                            |
| `OPENAI_WHISPER_MODEL`    | Ses yazıya                                 |
| `PORT`                    | Sunucu portu (4173)                        |
| `VITE_PLATFORM_API_URL`   | Canlıda `https://yonetim.bachmain.com/api` |
| `DATABASE_URL`            | Yönetim Neon (admin uygulaması)            |

## Sesli asistan

Header'daki mikrofon simgesine tıklayın. Konuşun veya yazın; asistan müşteri oluşturma, ürün ekleme, teklif hazırlama ve sayfa gezintisi gibi işlemleri otomatik yapar.

**Desteklenen komut örnekleri:**

- "ABC Ambalaj için yeni müşteri oluştur"
- "5000 adet kraft kutu teklifi hazırla"
- "Teklifler sayfasına git"

**Gereksinimler:** Chrome, Edge veya Firefox (mikrofon). Sunucuda `OPENAI_API_KEY` tanımlı olmalı. Alternatif: **Yönetici Ayarları → Sesli AI Asistan**.

## Cursor çalışma kuralları

- Mevcut bileşen / API / tablo varsa yenisini uydurma.
- Neon, auth, Vercel, env değeri, commit/push: önce onay.
- Bir modülde çalışırken diğer uygulamaları (web / yönetim / CRM) gereksiz yere değiştirme.
- Kural dosyası: `.cursor/rules/safe-saas-development.mdc`

## Teknolojiler

- React 19 + Vite (CRM), Next.js (web), Vite+TS (yönetim)
- Tailwind CSS
- Recharts, Lucide React
- Yönetim API: Node + Neon
- Hedef platform API: Fastify + Drizzle (`apps/api`)
