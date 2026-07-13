# Print Engine

Client MVP:

- `openPrintWindow(html)`
- `downloadPdfFromHtml(html, filename)` (jspdf + html2canvas)
- Jobs: `erlenbox-doc-print-jobs`

Visual templates render via `blocksToHtml` then variable resolve.

Server PDF API is planned (Faz 3).
