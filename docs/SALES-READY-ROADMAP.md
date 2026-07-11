# BACHMAIN — Satışa Hazırlık Yol Haritası

Bu belge, sistemin güvenli şekilde satılabilmesi için gereken işleri öncelik sırasıyla listeler.

## Durum özeti (2026-07-11)

| Alan | Durum |
|------|--------|
| Domainler (web / CRM / yönetim) | Çalışıyor |
| Üyelik kayıt/giriş API | Var |
| Üyelik verisi kalıcılığı | **Postgres gerekir** (`DATABASE_URL`) |
| CRM iş verisi | Hâlâ ağırlıklı localStorage → tenant sync eklendi |
| Yönetim paneli auth | Staff login eklendi (`/giris`) |
| Admin API koruması | Staff JWT zorunlu |
| Ödeme | Webhook iskeleti var; provider anahtarı yok |
| İzleme / yedek | Managed DB PITR + Sentry bekliyor |

---

## Sıra (uygulanan / yapılacak)

### P0 — Satış öncesi zorunlu

1. **Neon/Vercel Postgres bağla** → `DATABASE_URL` (admin + gerekirse CRM)
2. **JWT_SECRET** production’da zorunlu (kod güncellendi)
3. **ADMIN_EMAIL / ADMIN_PASSWORD** → yonetim personel girişi
4. **Admin API + UI staff kilidi** (uygulandı)
5. **Auth rate limit** (uygulandı)
6. **Ödeme sağlayıcı** (iyzico / PayTR / Stripe) + checkout + webhook
7. **Lisans bitişinde CRM kilidi** (uygulandı → `/hesap/lisans`)

### P1 — Güvenilir SaaS

8. CRM kritik koleksiyonları `tenant_data` ile senkron (API hazır; store bağları genişletilecek)
9. JWT’yi mümkün olduğunca HttpOnly cookie’de tut; localStorage’ı azalt
10. Sentry (CRM + admin) hata takibi
11. Uptime izleme (üç domain)
12. KVKK: aydınlatma metni, veri silme talebi, işlem kayıtları

### P2 — Operasyon / büyüme

13. Fatura / e-fatura gerçek entegrasyon
14. Çok kullanıcılı tenant RBAC (owner/admin/staff)
15. Otomatik yedek export (günlük JSON/SQL)
16. Soft delete + audit log
17. WAF / bot koruması (Vercel firewall)

---

## Ödeme

1. Stripe hesabı açın → API key alın
2. Vercel **bachmain-admin** env:
   - `STRIPE_SECRET_KEY=sk_live_...` (veya test)
   - Opsiyonel: `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PRO`
3. Stripe webhook → `https://yonetim.bachmain.com/api/payments/webhook`
   Event: `checkout.session.completed`
4. Redeploy admin

Sağlayıcı yokken `/api/payments/checkout` manuel talep oluşturur (yonetim bildirimlerine düşer).

## Git otomatik deploy

| Proje | Domain | Root |
|-------|--------|------|
| bachmain-web | bachmain.com | `apps/web` |
| bachmain-admin | yonetim.bachmain.com | `apps/admin` |
| bachmain | uygulama.bachmain.com | repo kökü |

`main` branch push → otomatik production deploy.

---

## Kodda eklenenler

- `apps/admin/server/db.mjs` — Postgres şema + rate limit + tenant/payment/staff
- `apps/admin/server/store.mjs` — `DATABASE_URL` varsa kalıcı JSONB state
- `apps/admin/server/staffAuth.mjs` + `/api/staff/*` + UI `/giris`
- `apps/admin/server/payments.mjs` — checkout/webhook iskeleti
- `apps/admin/server/tenantApi.mjs` — `/api/tenant/:collection`
- `src/utils/tenantSync.js` — CRM → platform sync yardımcısı
- `src/pages/auth/LicensePage.jsx` — süresi dolmuş hesap ekranı

---

## Güvenlik kontrol listesi

- [x] Production’da JWT_SECRET zorunlu
- [x] Admin müşteri API’si herkese açık değil
- [x] Staff login
- [x] Login/register rate limit
- [x] CORS: bilinmeyen origin’e default yansıtma kaldırıldı
- [ ] Ödeme webhook imza doğrulama (provider bağlanınca)
- [ ] CRM token’ı localStorage’dan kaldırma
- [ ] Periyodik secret rotasyonu
- [ ] KVKK süreçleri
