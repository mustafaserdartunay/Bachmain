# 13 — Database

## Kiracı modeli
Document Center verisi **tenant_code** altında.

### Seçenek A (MVP — mevcut)
Tek blob koleksiyonları `tenant_data`:
- `workspace` içinde localStorage anahtarları:
  - `erlenbox-doc-templates`
  - `erlenbox-doc-labels`
  - `erlenbox-doc-barcode-presets`
  - `erlenbox-doc-qr-presets`
  - `erlenbox-doc-print-jobs`
  - `erlenbox-doc-pdf-log`
- Silinenler: `erlenbox-deleted-records` → collection `docTemplates`, `docLabels`, …

### Seçenek B (V2 — normalize)
```sql
doc_templates (
  tenant_code, id, name, doc_type, payload jsonb, archived_at, deleted_at, updated_at
)
doc_print_jobs (...)
doc_assets (logo/font binary refs)
```

## İndeksler (V2)
`(tenant_code, doc_type, updated_at desc)`

## Yedek / müdahale
Yönetim paneli tenant_data JSON görüntüleme + restore (admin).
