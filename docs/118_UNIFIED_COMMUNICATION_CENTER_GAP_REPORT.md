# 118 — Unified Communication Center (Birleşik İletişim Merkezi) Gap Report

**Tarih:** 2026-08-23  
**Durum:** Analiz tamam — kod yok, FAZ 1 onayı bekleniyor  
**Kural:** Mevcut WhatsApp Cloud API, omnichannel `/mesajlar`, auth, tenant ve CRM’i yeniden yazma.

Bu rapor mevcut Bachmain kodunu taradı. Hedef: sağdaki **Ekip Merkezi** panelini, Bachmain’den çıkmadan sohbet / görüntülü / telefon / WhatsApp yöneten production-grade bir iletişim merkezine evrilmek.

---

## 1. Mevcut sohbet sistemi

### 1.1 Sağ panel — `TeamHubPanel` (asıl hedef yüzey)

| Özellik    | Gerçeklik                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------ |
| Konum      | `src/components/Layout/TeamHubPanel.jsx` — `lg+` sağ rail, zaten daraltılabilir (`ChevronLeft` / `ChevronRight`)   |
| Sekmeler   | Sohbet · Teklif & Sipariş · Yarış · Görev Ata                                                                      |
| Sohbet SoT | `localStorage` anahtarı `bach-team-hub-state` (`src/utils/teamHubStore.js`)                                        |
| Kapsam     | **Tek şirket içi ortak oda** (broadcast). 1:1 DM, grup, dosya, emoji picker, reply/pin/star, teslim/okundu **yok** |
| Realtime   | Aynı tarayıcıda `CustomEvent`. Diğer cihaz / kullanıcıya gitmez                                                    |
| Tam ekran  | Yok                                                                                                                |

Bu, kullanıcının bahsettiği “sağ taraftaki kullanıcı sohbet alanı”. Header’daki `HeaderMessageCenter` ayrı: omnichannel `/mesajlar` kısayolu.

### 1.2 Müşteri mesaj merkezi — `/mesajlar`

Tam sayfa omnichannel (`OmnichannelPage`): konuşma listesi + thread + CRM kartı. WhatsApp production path; Instagram / Facebook / e-posta / TikTok UI etiketi, admin webhook dosyası yok.

### 1.3 Destek canlı sohbet (API iskeleti)

`apps/api` Postgres: `live_conversations`, `chat_messages`. Socket.IO event `chat:message`. **CRM UI bu socket’e bağlı değil.** İç ekip sohbeti değil; tenant kullanıcı ↔ platform ajan modeli.

### 1.4 Bachy

AI asistan (`BachyFloating`). İnsan mesajlaşması değil.

**Eksik:** tenant-içi 1:1 / grup sohbet, presence, typing, dosya, read receipt, sağ panel unified inbox.

---

## 2. WebSocket sistemi

| Katman           | Durum                                                                                |
| ---------------- | ------------------------------------------------------------------------------------ |
| Socket.IO sunucu | `apps/api/src/realtime/socket.ts` — JWT zorunlu                                      |
| Odalar           | `user:{id}`, `company:{cid}`, `admin:support`, `conversation:*`, `ticket:*`          |
| Eventler         | `chat:message`, `ticket:*`, `notification:new`, AI sync                              |
| CRM client       | **Yok** (`socket.io-client` `src/` altında kullanılmıyor)                            |
| Omni güncelleme  | `bach:omni-updated` CustomEvent + localStorage                                       |
| SSE              | Yok                                                                                  |
| Redis            | `docker-compose.yml` içinde var; Socket.IO adapter henüz iletişim için kullanılmıyor |

**Karar:** Yeni WS yazma. Mevcut Socket.IO gateway’i genişlet: `ucc:join`, `ucc:message`, `ucc:receipt`, `ucc:presence`, `ucc:call-signal` (1:1 signaling FAZ 2). Media SFU’dan ayrı kalır.

---

## 3. Authentication

**Canlı CRM (Plane B — Admin):** JWT `apps/admin/server/auth.mjs`. Claim: `tenantCode`, `accessLevel` (`owner` / `editor` / `viewer`). Token `localStorage` + cookie. Şirket değiştirince scoped token yenilenir.

**Hedef API (Plane A — `apps/api`):** JWT `sub`, `cid` (= `company_id`), `kind`, `role`, `perms[]`. MFA / refresh cookie iskeleti var.

UCC tüm REST + WS + LiveKit token mint + telefon originate işlemlerinde **mevcut JWT’yi** kullanmalı. Ayrı login yok.

---

## 4. Multi-tenant

- Tenant = şirket. Admin: `tenantCode` + `tenant_data (tenant_code, collection, payload)` (Neon).
- API: her satır `company_id`; repository `requireTenant(req)`.
- `src/utils/orgScope.js` UI filtresi — **güvenlik sınırı değil** (docs/54).
- WhatsApp sırları tenant secret store’da (`whatsappApi.mjs`); frontend’e token gitmez (maskelenmiş).

UCC tabloları `company_id` zorunlu. Meeting ID tahmini ile başka tenant’a katılım imkânsız olmalı (membership + token).

---

## 5. CRM müşteri yapısı

Canlı SoT büyük ölçüde **localStorage** profilleri (`customerProfiles.js`): `company`, `contact`, `email`, `phone`, `contacts[]` (`phone` / `gsm`). **Ayrı `whatsapp` kolonu yok** — eşleme E.164 telefon.

İnce SQL `customers` (`apps/api` CRM routes) iskelet.

Müşteri kartı iletişim 360 / click-to-call **yok** (`tel:` linkleri kurye/portal’da var).

---

## 6. WhatsApp entegrasyonu

**Resmi Meta Cloud API — canlı.** Unofficial / QR / Baileys yok.

| Parça                          | Path                                                                 |
| ------------------------------ | -------------------------------------------------------------------- |
| Graph v19.0 send/inbox/webhook | `apps/admin/server/whatsappApi.mjs`                                  |
| HMAC `x-hub-signature-256`     | webhook GET challenge + POST                                         |
| CRM client                     | `src/utils/whatsappChannelApi.js` → `yonetim…/api/channels/whatsapp` |
| Omni merge                     | `src/omnichannel/services/hub.js`                                    |
| Paket                          | `whatsapp` PROFESSIONAL_EXTRA (`billingCatalog.mjs`)                 |

**Yok:** template (HSM) API, media upload pipeline (Graph media), Calling API, capability detection, kuyruk worker (senkron send).

Webhook zinciri bugün: Meta → Admin → tenant inbox JSON → CRM **pull**. Hedef: aynı webhook + persist + Socket.IO push (yeniden yazmadan).

---

## 7. Bildirim sistemi

- CRM header: `NotificationDropdown` — hesap bildirimleri (`GET /api/auth/notifications`).
- API: `notifications` tablosu + `notifyUser()` + `notification:new` emit. CRM dinlemiyor.
- **Browser Notification API / Web Push / VAPID yok.**
- Rahatsız etmeyin / presence (müsait / meşgul / DND) yok.

---

## 8. E-posta

Resend, Admin mail merkezi (`docs/MAIL-INFRASTRUCTURE.md`). Auth + fatura + destek şablonları. CRM omni `emailService.js` ayrı / zayıf. UCC e-postayı FAZ 1–5’te taşımaz; müşteri 360’ta “son e-posta” köprüsü FAZ 6.

---

## 9. Telefon

**Yok.** Twilio / Telnyx / SIP / WebRTC PSTN client yok. `tel:` link ve pazarlama numarası var. OpenAI Realtime WebRTC yalnızca Bach AI sesi.

Sahte “arıyor” UI’sı yasak.

---

## 10. Database

Üç düzlem:

| Düzlem | Motor                           | Rol                                            |
| ------ | ------------------------------- | ---------------------------------------------- |
| A      | Postgres + Drizzle (`apps/api`) | Normalized SaaS iskeleti                       |
| B      | Neon JSONB (`apps/admin`)       | Auth, billing, WhatsApp secrets, tenant_data   |
| C      | localStorage                    | Çoğu CRM entity + Team Hub sohbet + omni inbox |

Redis + MinIO compose’da hazır (kuyruk / medya için).

**Yeni tablolar gerekir** (mevcut `chat_messages` destek 1:1 ajan modeli; ekip/UCC’ye yetmez). Önerilen şema docs/119.

---

## 11. Deployment

Vercel: `bachmain` (CRM), `bachmain-admin`, `bachmain-web`. Script: `scripts/deploy-all.sh`.

`apps/api` Fastify + Docker — **deploy-all.sh’de yok**; `api.bachmain.com` hedef.

**Kritik:** WebRTC SFU Vercel serverless’da çalışmaz. Ayrı VM / LiveKit Cloud şart.

---

## 12. Sunucu yapısı

```
src/                 CRM Vite SPA
apps/admin           YÖNETİM — node:http + Vercel /api
apps/api             Fastify :8080 + Socket.IO + Drizzle
apps/landing         WEB
server/              CRM Express yardımcı (AI/omni proxy)
```

---

## 13. Domain

| Domain                  | Uygulama                                   |
| ----------------------- | ------------------------------------------ |
| `bachmain.com`          | WEB                                        |
| `uygulama.bachmain.com` | CRM (`docs/PRODUCTION.md`)                 |
| `yonetim.bachmain.com`  | Admin + WhatsApp webhook                   |
| `api.bachmain.com`      | Hedef Fastify (henüz prod script’te değil) |

Workspace etiketleri aynı üçlüyü kullanır. `whatsappChannelApi.js` default host `yonetim.bachmain.com` — isim sapması; UCC’de kanonik `yonetim.bachmain.com` kullanılmalı.

**Yeni subdomain önerisi (yalnızca gerektiğinde):**

| Host                                  | Ne zaman                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------- |
| LiveKit Cloud veya `livekit` internal | FAZ 3 media — Vercel’e koyma                                                             |
| `meet.bachmain.com`                   | Dış misafir toplantı (FAZ 3+). İlk sürüm `/meeting/:id` CRM rotası yeterli               |
| `turn.*` / `signal.*` / `voice.*`     | **Şimdilik açma** — LiveKit signaling+TURN birleştirir; telefon provider WebRTC kullanır |

---

## Mevcut vs hedef (özet)

| Yetenek          | Bugün                  | Hedef                              |
| ---------------- | ---------------------- | ---------------------------------- |
| Sağ panel sohbet | localStorage ortak oda | Tenant WS 1:1 + grup               |
| WhatsApp mesaj   | Cloud API gerçek       | Aynı path + push + template        |
| WhatsApp arama   | Yok                    | Capability-gated resmi Calling API |
| Video            | Yok                    | LiveKit SFU                        |
| PSTN telefon     | Yok                    | Provider abstraction + TR SIP      |
| Unified inbox    | `/mesajlar` (müşteri)  | Panel “Tüm İletişimler”            |
| Presence / DND   | Yok                    | Var                                |
| Browser push     | Yok                    | Var                                |
| Click-to-call    | Yok                    | CRM kart                           |
| Kayıt            | —                      | Varsayılan kapalı                  |
