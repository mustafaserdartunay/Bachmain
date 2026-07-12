# 03 — Print Engine

## Amaç
Tarayıcıdan ve (ileride) yerel print agent’tan güvenilir yazdırma.

## Akış
1. Kullanıcı belge veya şablon seçer.
2. Variable Engine veriyi resolve eder.
3. Print Engine HTML/CSS sayfa(ları) üretir (`@media print`).
4. Önizleme modal → `window.print()` veya PDF Engine.
5. İşlem kaydı: `printedAt`, kullanıcı, yazıcı adı (varsa).

## Desteklenen çıktılar
- A4 / A5 / Letter
- Continuous / rulo etiket (genişlik × yükseklik mm)
- Çoklu kopya, sayfa aralığı

## Teknik
- Client: gizli iframe + print stylesheet.
- CSS: `size`, `@page { margin }`, `break-inside: avoid` satır blokları için.
- Yazıcı seçimi: tarayıcı UI (MVP); sonra `bach-print-agent` (websocket).

## Hata durumları
- Boş değişken → uyarı, yine de yazdırılabilir (placeholder `—`).
- Yazdırma iptal → kuyruk “cancelled”.

## Saklama
`erlenbox-doc-print-jobs` — tenant workspace içinde.
