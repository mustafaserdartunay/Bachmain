# Mapbox — Bachmain LIVE

Harita motoru: **Mapbox GL JS** (web LIVE). Tır Kontrol Google Maps ve saha satış Leaflet katmanları durur.

## Environment

Asla gerçek token commit etmeyin.

```
VITE_MAPBOX_ACCESS_TOKEN=
MAPBOX_SECRET_TOKEN=
```

- Public token: tarayıcı harita stili. URL restriction: `uygulama.bachmain.com`.
- Secret token: yalnızca `api/mapbox/*` ve `apps/api` sunucusu. Frontend bundle’a girmez.

Yerel: `.env` / `.env.local`. Production: Vercel Environment Variables.

## Kullanıcının tek Mapbox adımı

1. [Mapbox](https://account.mapbox.com/) hesabı (Google ile giriş olabilir).
2. Access tokens: **Bachmain Development** ve **Bachmain Production Web** public token.
3. Secret token yalnızca sunucu env. Şifre Cursor’a verilmez.

## Durum ekranı

`/ayarlar/harita` — bağlantı kartları, maskeli token, “Bağlantıyı test et”.

## Proxy

`/api/mapbox/status|test|geocode|reverse|directions|matrix|optimize|match`

Hata: `Harita servisine şu anda ulaşılamıyor.` Token loglanmaz.

## Troubleshooting

- Token yok: LIVE liste + İstanbul demo çalışır, harita tuvali mesaj gösterir.
- 429: proxy rate limit.
- Secret tarayıcıda: `secret-scan` + build grep `MAPBOX_SECRET`.
