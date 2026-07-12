# 10 — Workflow Engine (Belge)

## Amaç
Belge yaşam döngüsü: Taslak → Onay → Yazdırıldı → Arşiv.

## Mevcut entegrasyon
CRM zaten `workflowStages` kullanıyor (teklif/sipariş/üretim panelleri). Document Center:
- Şablon seçimini aşamaya bağlayabilir (`stageId → templateId`).
- “Yazdırıldı” aşamasına geçince print job log yazar.

## Kurallar
- Onay yetkisi: `permissions` (satış müdürü vb.).
- Zorunlu alanlar eksikse aşama ilerlemez.
- Soft-delete / arşiv mevcut sistemle uyumlu.

## Olaylar
`bach:doc-workflow` — stage değişimi; diğer modüller dinleyebilir.
