# Location tracking

## Web saha

`/live/saha` — Field Sales `watchPosition` kalıbı, KVKK metni, IndexedDB offline kuyruk, idempotency key.

Hareketliyken sık, dururken seyrek ping. İzin reddinde CRM çalışır; takip pasif.

## CRM store

`src/live/store.js` — `bach-live-*` workspace anahtarları, `orgScope` tenant damgası, PDKS `appendGpsLog` ile birleşir.

## API

`POST /v1/live/locations` — JWT `cid` zorunlu. IDOR: history yalnızca `companyId + entityId`.

Public müşteri: mevcut `/sevkiyat-takip/:token` ve `/kurye-takip/:token`. API `GET /v1/live/track/:token` PII döndürmez (yaklaşık 3 ondalık).

## iOS

`bachmain.ios` `LocationService.livePingPayload` — `POST /v1/live/locations` gövdesi. Mapbox Maps SDK yok.

## Android

Aynı HTTP sözleşmesi: `apps/android/README.md`.

## Retention

Şirket ayarı 30 / 90 / 180 / 365 gün (`/ayarlar/harita`). Production DROP yok.
