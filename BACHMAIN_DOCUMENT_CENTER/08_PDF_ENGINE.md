# 08 — PDF Engine

## Amaç
Yüksek kaliteli, yazdırılabilir PDF.

## Strateji
**MVP (client):** HTML şablon → `html2canvas` + `jspdf` (projede zaten bağımlılık var) veya browser print-to-PDF.
**V2 (server):** Vercel/API’de headless (Playwright/Puppeteer) veya PDFKit — büyük tablolar için.

## API (V2)
`POST /api/doc/pdf` — `{ templateId, documentType, documentId }` → PDF binary / signed URL.

## Saklama
- Opsiyonel: üretilen PDF’i IndexedDB veya object storage.
- MVP: sadece indirme; metadata `erlenbox-doc-pdf-log`.

## Kalite
- Embed font (Inter / şirket fontu).
- Vektör barkod/QR tercih (raster değil).
