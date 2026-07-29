# Meta for Developers — Manuel Kurulum Checklist

Kod tarafı production hazır. Aşağıdaki adımlar **sizin Meta hesabınızda** tamamlanmalı.

Companion: `docs/111_SOCIAL_MEDIA_CENTER_GAP_REPORT.md`, `docs/112_SOCIAL_MEDIA_CENTER_ARCHITECTURE_ROADMAP.md`

## 1. Meta App oluşturma

1. https://developers.facebook.com/apps/ → **Create App**
2. Use case: **Other** veya **Business**
3. App type: **Business**
4. App adını kaydedin (örn. BachMain Social)

## 2. Ürünleri ekleyin

App Dashboard → Add Product:

| Ürün           | Gerekli                            |
| -------------- | ---------------------------------- |
| Facebook Login | Evet (OAuth)                       |
| Instagram      | Evet (Graph / Content + Messaging) |
| Messenger      | Evet                               |
| WhatsApp       | Evet (Cloud API)                   |
| Webhooks       | Evet                               |

## 3. Facebook Login ayarları

**Facebook Login → Settings:**

- Client OAuth Login: **Yes**
- Web OAuth Login: **Yes**
- Enforce HTTPS: **Yes**
- Use Strict Mode for Redirect URIs: **Yes**
- **Valid OAuth Redirect URIs** (hepsini ekleyin):
  - `https://api.bachmain.com/v1/social/oauth/callback`
  - `https://api.bachmain.com/v1/social/instagram/oauth/callback`
  - (staging varsa staging URL’leri)

**Allowed Domains:**

- `bachmain.com`
- `uygulama.bachmain.com`
- `api.bachmain.com`

## 4. BachMain ortam değişkenleri (API)

```bash
META_APP_ID=...
META_APP_SECRET=...
META_REDIRECT_URI=https://api.bachmain.com/v1/social/oauth/callback
META_GRAPH_VERSION=v21.0
META_WEBHOOK_VERIFY_TOKEN=<uzun-rastgele-string>
META_WEBHOOK_APP_SECRET=<genelde META_APP_SECRET ile aynı>
JWT_ACCESS_SECRET=<token şifreleme anahtarı — zaten var>
```

Tenant bazlı App ID/Secret: CRM → `/sosyal-medya/meta-kurulum`

## 5. Webhook callback

**Webhooks → Configure:**

- Callback URL: `https://api.bachmain.com/v1/social/webhooks/meta`
- Verify Token: `META_WEBHOOK_VERIFY_TOKEN` ile **aynı** değer

Abone olunan object’ler:

| Object                      | Fields (önerilen)                                |
| --------------------------- | ------------------------------------------------ |
| `page`                      | messages, messaging_postbacks, feed, permissions |
| `instagram`                 | comments, messages, mentions, story_insights     |
| `whatsapp_business_account` | messages, message_template_status_update         |

Alternatif path’ler (aynı verify):

- `/v1/social/webhooks/instagram`
- `/v1/social/webhooks/facebook`
- `/v1/social/webhooks/messenger`
- `/v1/social/webhooks/whatsapp`

## 6. İzinler (Permissions) — Development vs Live

### Development (App rollerindeki test kullanıcıları)

Kodun istediği scope listesi:

**Instagram / içerik:**

- `instagram_basic`
- `instagram_content_publish`
- `pages_show_list`
- `pages_read_engagement`
- `business_management`

**Mesajlaşma (SC-1 / inbox):**

- `instagram_manage_messages`
- `instagram_manage_comments`
- `pages_messaging`
- `pages_manage_metadata`
- `pages_read_user_content`

**Facebook sayfa:**

- `pages_manage_posts` (opsiyonel yayın)

**WhatsApp:**

- `whatsapp_business_management`
- `whatsapp_business_messaging`

### Live (müşteri hesapları)

1. **App Review**’a yukarıdaki Advanced Access izinlerini gönderin
2. Use case + screencast hazırlayın (BachMain bağlan → izin ver → hesap seç)
3. **Business Verification** tamamlayın (Meta Business Manager)
4. Instagram Messaging / WhatsApp için ek politika onayı gerekebilir

Kod, OAuth sonrası `debug_token` ile **eksik scope** listesini UI’da gösterir.

## 7. Instagram Business / Creator önkoşulları (müşteri tarafı)

- Instagram hesabı **Professional** (Business veya Creator)
- Bir **Facebook Sayfası**na bağlı
- Bağlayan Facebook kullanıcısı sayfada admin/editor

## 8. WhatsApp Cloud API

İki yol desteklenir:

1. **OAuth** (`whatsapp` platform) — Business + WABA + phone listesi
2. **Kalıcı token** — CRM “Kalıcı token” formu (Phone Number ID + WABA ID + System User token)

Meta’da ayrıca:

- WhatsApp → API Setup → Phone number ekleyin
- Embedded Signup (opsiyonel, App Review sonrası) — config_id ileride eklenebilir

## 9. Güvenlik (kodda hazır — Meta’da doğrulayın)

- [x] Authorization Code + PKCE (S256)
- [x] Signed OAuth `state` + DB nonce (CSRF, tek kullanımlık)
- [x] Tokenlar AES-GCM (`encryptSecret`) — frontend’de tutulmaz
- [x] Multi-tenant: `company_id` zorunlu filtre
- [x] Webhook HMAC `X-Hub-Signature-256`
- [x] Rate limit (OAuth start/select sıkı)

## 10. Doğrulama testi (siz)

1. API’de migration `0018_smc_social_connections.sql` uygulandı mı?
2. CRM → Sosyal Bağlantılar → Instagram Bağlan → Meta izin → dönüş
3. Birden fazla sayfa varsa hesap seçici açılmalı
4. Yönetim → Sosyal Bağlantılar’da müşteri satırı görünmeli
5. Webhook Verify (Meta “Verify and Save”) 200 dönmeli
6. Token yenile / kaldır butonları

## 11. Bilinen Meta tarafı engelleri (kod çözemez)

- App Review olmadan canlı müşteri OAuth’u Advanced permission’larda fail olur
- Personal IG (non-professional) Graph ile bağlanamaz
- WhatsApp Embedded Signup UI Meta config_id ister — manuel token yolu production’da kullanıma hazır
- Messenger 24s penceresi / WhatsApp template kuralları ürün inbox (SC-1) işi

---

**Özet:** Kod + şema + webhook + admin izleme tamam. Sizin işiniz Meta Console App Review, Business Verification, redirect URI / webhook verify token ve env secret’ları.
