# 16 — Tests

## Birim
- Variable Engine: binding resolve, unknown field, each/if.
- Template JSON schema validate.
- Soft-delete / restore round-trip.
- Barcode checksum (EAN-13).

## Entegrasyon
- Kaydet → localStorage → workspace pull başka oturumda görünür.
- Quote “PDF” seçili şablonla boş hata vermeden üretir.
- Silinen şablon listede yok; Silinenler’de var; restore sonrası listede.

## E2E (Playwright — ileride)
1. Login → Belge Merkezi → Yeni şablon → Kaydet.
2. Tekliften Yazdır önizleme.
3. Etiket 50×30 QR + barkod.

## Regresyon
Mevcut Quotes/Orders DocumentEditor bozulmamalı.
