# 14 — API

## Platform (yonetim / tenant)
Mevcut: `GET/PUT /api/tenant/:collection`  
Yeni collection (opsiyonel, blob yerine): `docTemplates`, `docLabels`, `docPrintJobs`.

## Document Center endpoints (öneri)
| Method | Path | Açıklama |
|--------|------|----------|
| GET | `/api/doc/templates` | Liste |
| POST | `/api/doc/templates` | Oluştur |
| PUT | `/api/doc/templates/:id` | Güncelle |
| DELETE | `/api/doc/templates/:id` | Soft-delete |
| POST | `/api/doc/templates/:id/restore` | Geri al |
| POST | `/api/doc/render` | HTML/PDF render |
| POST | `/api/doc/pdf` | PDF binary |
| POST | `/api/doc/ai-design` | AI şablon |
| GET | `/api/doc/marketplace` | Katalog |

## Auth
Bearer `bachmain_auth_token`; tenantCode JWT’den.

## MVP notu
İlk fazda client-only + workspace sync yeterli; API faz 2.
