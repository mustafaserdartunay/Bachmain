# 10 — Workflow Engine (Belge + Platform)

## Belge yaşam döngüsü
Belge: Taslak → Onay → Yazdırıldı → Arşiv.

## Mevcut entegrasyon
CRM zaten `workflowStages` kullanıyor (teklif/sipariş/üretim panelleri). Document Center:
- Şablon seçimini aşamaya bağlayabilir (`stageId → templateId`).
- “Yazdırıldı” aşamasına geçince print job log yazar.

## Platform Workflow Engine (yeni)
Merkezi otomasyon: [docs/66](../docs/66_WORKFLOW_ENGINE_GAP_REPORT.md) · [docs/67](../docs/67_WORKFLOW_ENGINE_ARCHITECTURE_ROADMAP.md)

- CRM: `/otomasyon` hub · `/otomasyon/designer` (React Flow)
- API: `/v1/workflows/*`
- Event bus: `publishDomainEvent` — modüller birbirini doğrudan çağırmaz

## Kurallar
- Onay yetkisi: `permissions` (satış müdürü vb.).
- Zorunlu alanlar eksikse aşama ilerlemez.
- Soft-delete / arşiv mevcut sistemle uyumlu.
- `workflowStages` UI paneli bozulmaz; engine ayrı katmandır.

## Olaylar
`bach:doc-workflow` — belge stage değişimi.
`bach:domain-event` — platform domain event bus.
