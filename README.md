# ERLENBOX ERP - CRM & Muhasebe Programı

Görseldeki tasarıma uygun, web tabanlı ERP/CRM dashboard uygulaması.

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

## Kurulum

```bash
npm install
cp .env.example .env
npm run dev
```

`.env` dosyasına gerçek anahtarınızı ekleyin:

```
OPENAI_API_KEY=sk-proj-...
```

Alternatif: **Yönetici Ayarları → Sesli AI Asistan** bölümünden anahtarı girebilirsiniz (sunucuda .env yoksa).

Tarayıcıda `http://localhost:5173` adresini açın. Geliştirme modunda sesli asistan API'si Vite üzerinden çalışır.

## Sesli Asistan

Header'daki mikrofon simgesine tıklayın. Konuşun veya yazın; asistan müşteri oluşturma, ürün ekleme, teklif hazırlama ve sayfa gezintisi gibi işlemleri otomatik yapar.

**Desteklenen komut örnekleri:**
- "ABC Ambalaj için yeni müşteri oluştur"
- "5000 adet kraft kutu teklifi hazırla"
- "Teklifler sayfasına git"

**Gereksinimler:**
- Chrome, Edge veya Firefox (mikrofon kaydı)
- Sunucuda `OPENAI_API_KEY` tanımlı olmalı (Whisper + GPT aynı anahtar)

## Online Yayın (Production)

### Vercel + bachmain.com (önerilen)

1. Projeyi GitHub’a push edin.
2. [Vercel](https://vercel.com) → Import Project → GitHub repo.
3. Environment Variables ekleyin:
   - `OPENAI_API_KEY` = `sk-...`
   - `OPENAI_MODEL` = `gpt-4o-mini` (opsiyonel)
4. Deploy sonrası Domains → `bachmain.com` ve `www.bachmain.com` ekleyin.
5. Google Workspace / domain DNS’te Vercel’in verdiği kayıtları ekleyin:
   - `A` → `76.76.21.21` (apex)
   - veya Vercel’in gösterdiği `CNAME` → `cname.vercel-dns.com`

CLI ile:

```bash
npx vercel login
npx vercel --prod
npx vercel domains add bachmain.com
```

SPA rotaları (`/musteriler` vb.) `vercel.json` rewrite ile çalışır. AI API uçları `/api/voice/*` ve `/api/omni/*` serverless fonksiyonlardır.

### Node sunucusu (VPS / Railway / Render)

```bash
npm run build
npm start
```

Varsayılan port: `4173`. Ortam değişkenleri:

| Değişken | Açıklama |
|----------|----------|
| `OPENAI_API_KEY` | OpenAI API anahtarı (zorunlu) |
| `OPENAI_MODEL` | Model adı (varsayılan: gpt-4o-mini) |
| `PORT` | Sunucu portu (varsayılan: 4173) |

## Teknolojiler

- React 19 + Vite
- Tailwind CSS
- Recharts (grafikler)
- Lucide React (ikonlar)
