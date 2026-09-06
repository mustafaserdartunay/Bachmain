# Maps in Bachmain

| Yüzey                               | Motor        | Dosya                                        |
| ----------------------------------- | ------------ | -------------------------------------------- |
| LIVE operasyon                      | Mapbox GL JS | `/live`                                      |
| Tır Kontrol canlı rota              | Google Maps  | `TruckLiveMap.jsx`                           |
| Sevkiyat / kurye / saha / İK harita | Leaflet      | `SevkiyatMap`, `CourierMap`, `FieldSalesMap` |

Google Tır haritasına sahte GPS basılmaz (`isRealGpsFix`).

LIVE katmanları: personel, sürücü, araç, teslimat, müşteri, geofence, rota.

Ayarlar: `/ayarlar/harita`. Ayrıntı: [mapbox.md](./mapbox.md).
