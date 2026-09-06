# BachMain Android — androidapp.bachmain

Native Android uygulaması (Kotlin / Jetpack Compose). WebView yok; CRM ile aynı tenant API ve workspace senkronu hedeflenir.

## Domain

| Ortam        | URL                                |
| ------------ | ---------------------------------- |
| Production   | `https://androidapp.bachmain.com`  |
| Platform API | `https://yonetim.bachmain.com/api` |
| App API      | `https://uygulama.bachmain.com`    |

## Durum

Proje iskeleti — Gradle modülü ve CI henüz bağlanmadı. iOS (`~/Documents/Bachmain/bachmain.ios`) ile aynı auth ve workspace sözleşmesi kullanılacak.

## Yerel geliştirme (plan)

```bash
# Android Studio ile apps/android açılacak
# ./gradlew assembleDebug
```

## LIVE GPS ingest (HTTP)

Saha konumu `POST /v1/live/locations` (Bearer JWT, `cid` tenant) ile gönderilir.

```json
{
  "externalId": "employee-id",
  "entityKind": "personnel",
  "latitude": 41.01,
  "longitude": 29.05,
  "accuracy": 12,
  "speed": 4.2,
  "heading": 90,
  "timestamp": "2026-09-06T08:00:00.000Z",
  "platform": "android",
  "idempotencyKey": "employee-id:2026-09-06T08:00:00.000Z"
}
```

Web eşdeğeri: `https://uygulama.bachmain.com/live/saha`. Ayrıntı: `docs/location-tracking.md`.

- iOS referans: `~/Documents/Bachmain/bachmain.ios/README.md`
- Platform: `docs/PRODUCTION.md`
- Workspace: `workspace/README.md`
