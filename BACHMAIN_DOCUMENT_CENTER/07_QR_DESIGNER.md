# 07 — QR Designer

## İçerik tipleri
- URL (müşteri portal, takip linki)
- Metin
- vCard (iletişim)
- Wi‑Fi (opsiyonel)
- Belge doğrulama: `https://uygulama.bachmain.com/dogrula/{{belge.token}}`

## Stil
- Boyut mm, hata düzeltme L/M/Q/H, kenar boşluğu, logo ortası (opsiyonel, ECC yüksek).

## Teknik
- Client QR lib (ör. `qrcode`).
- Template layer `type: "qr"`.

## Persist
Preset’ler `erlenbox-doc-qr-presets`.
