# 05 — Barcode Designer

## Desteklenen sembolojiler (MVP)
- Code128
- EAN-13 / EAN-8
- Code39

## UI
- Önizleme: canlı barkod SVG/Canvas.
- Alanlar: veri kaynağı (binding veya sabit), yükseklik mm, insan-okunur metin on/off, sessiz bölge.
- Doğrulama: EAN checksum; hata kırmızı border.

## Kullanım
- Ürün etiketi, sevkiyat, depo lokasyonu.
- Template Designer içinde `barcode` layer tipi.

## Teknik öneri
- Client: `jsbarcode` veya benzeri (bundle boyutu kontrol).
- Export: SVG → PDF Engine / Print.

## Persist
Şablon parçası olarak template JSON içinde; tek başına preset’ler `erlenbox-doc-barcode-presets`.
