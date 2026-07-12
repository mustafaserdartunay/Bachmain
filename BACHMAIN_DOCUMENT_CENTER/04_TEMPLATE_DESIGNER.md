# 04 — Template Designer

## Amaç
Sayfa tabanlı belge şablonları (teklif, sipariş, fatura taslağı, üretim fişi).

## Canvas modeli
```json
{
  "id": "tpl_…",
  "name": "Standart Teklif",
  "docType": "quote",
  "page": { "size": "A4", "orientation": "portrait", "marginMm": [12,12,12,12] },
  "layers": [
    { "type": "text", "x": 12, "y": 20, "w": 80, "binding": "{{sirket.unvan}}", "style": {} },
    { "type": "table", "binding": "{{kalemler}}", "columns": [] },
    { "type": "image", "binding": "{{sirket.logo}}" },
    { "type": "barcode", "binding": "{{belge.no}}", "symbology": "code128" },
    { "type": "qr", "binding": "{{portal.url}}" }
  ],
  "version": 1,
  "updatedAt": "ISO"
}
```

## Özellikler
- Sürükle-bırak, resize, hizalama kılavuzları.
- Sayfa üst/alt bilgi (header/footer tekrar).
- Tablo: kalem satırları, otomatik sayfa kırılımı.
- Koşullu blok: `{{#if belge.iskonto}}…{{/if}}` (Variable Engine).

## Entegrasyon
- QuotesPage / OrdersPage “PDF / Yazdır” → seçili şablon.
- Varsayılan şablon: `docType` başına bir adet (kullanıcı seçer).

## Persist
`erlenbox-doc-templates` + soft-delete `deletedRecordsStore` collection `docTemplates`.
