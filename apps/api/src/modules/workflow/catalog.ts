/** Shared node catalog for Workflow Engine (WF-0). Keep in sync with CRM `src/workflow/catalog.js`. */

export type NodeCategoryId =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'ai'
  | 'approval'
  | 'notification'
  | 'document'
  | 'wait'
  | 'loop'
  | 'calculation'
  | 'integration'
  | 'system'

export const NODE_CATEGORIES: {
  id: NodeCategoryId
  label: string
  color: string
}[] = [
  { id: 'trigger', label: 'TRIGGER', color: '#0ea5e9' },
  { id: 'action', label: 'ACTION', color: '#10b981' },
  { id: 'condition', label: 'CONDITION', color: '#f59e0b' },
  { id: 'ai', label: 'AI', color: '#8b5cf6' },
  { id: 'approval', label: 'APPROVAL', color: '#f43f5e' },
  { id: 'notification', label: 'NOTIFICATION', color: '#06b6d4' },
  { id: 'document', label: 'DOCUMENT', color: '#64748b' },
  { id: 'wait', label: 'WAIT', color: '#f97316' },
  { id: 'loop', label: 'LOOP', color: '#6366f1' },
  { id: 'calculation', label: 'CALCULATION', color: '#84cc16' },
  { id: 'integration', label: 'INTEGRATION', color: '#14b8a6' },
  { id: 'system', label: 'SYSTEM', color: '#71717a' },
]

export type CatalogNode = {
  id: string
  category: NodeCategoryId
  label: string
  description?: string
}

export const NODE_CATALOG: CatalogNode[] = [
  // Triggers
  { id: 'trigger.customer.created', category: 'trigger', label: 'Yeni Müşteri' },
  { id: 'trigger.customer.updated', category: 'trigger', label: 'Müşteri Güncellendi' },
  { id: 'trigger.customer.archived', category: 'trigger', label: 'Müşteri Arşivlendi' },
  { id: 'trigger.cxc.opportunity.created', category: 'trigger', label: 'CXC Fırsat Oluştu' },
  {
    id: 'trigger.cxc.opportunity.stage_changed',
    category: 'trigger',
    label: 'CXC Pipeline Değişti',
  },
  { id: 'trigger.cxc.ticket.created', category: 'trigger', label: 'CXC Destek Talebi' },
  { id: 'trigger.quote.created', category: 'trigger', label: 'Yeni Teklif' },
  { id: 'trigger.quote.approved', category: 'trigger', label: 'Teklif Onaylandı' },
  { id: 'trigger.order.created', category: 'trigger', label: 'Sipariş Oluştu' },
  { id: 'trigger.order.approved', category: 'trigger', label: 'Sipariş Onaylandı' },
  { id: 'trigger.production.started', category: 'trigger', label: 'Üretim Başladı' },
  { id: 'trigger.production.completed', category: 'trigger', label: 'Üretim Tamamlandı' },
  { id: 'trigger.quality.completed', category: 'trigger', label: 'Kalite Tamamlandı' },
  { id: 'trigger.warehouse.inbound', category: 'trigger', label: 'Depoya Giriş' },
  { id: 'trigger.stock.low', category: 'trigger', label: 'Stok Azaldı' },
  { id: 'trigger.pallet.created', category: 'trigger', label: 'Palet Oluşturuldu' },
  { id: 'trigger.load.planned', category: 'trigger', label: 'Yük Planlandı' },
  { id: 'trigger.vehicle.departed', category: 'trigger', label: 'Araç Çıktı' },
  { id: 'trigger.delivery.completed', category: 'trigger', label: 'Teslim Edildi' },
  { id: 'trigger.invoice.issued', category: 'trigger', label: 'Fatura Kesildi' },
  { id: 'trigger.payment.received', category: 'trigger', label: 'Tahsilat Yapıldı' },
  { id: 'trigger.task.completed', category: 'trigger', label: 'Görev Tamamlandı' },
  { id: 'trigger.appointment.created', category: 'trigger', label: 'Randevu Oluştu' },
  { id: 'trigger.document.signed', category: 'trigger', label: 'Belge İmzalandı' },
  { id: 'trigger.document.template.created', category: 'trigger', label: 'Belge Şablonu Oluştu' },
  { id: 'trigger.document.rendered', category: 'trigger', label: 'Belge Render Edildi' },
  { id: 'trigger.document.printed', category: 'trigger', label: 'Belge Yazdırıldı' },
  { id: 'trigger.document.pdf.downloaded', category: 'trigger', label: 'PDF İndirildi' },
  { id: 'trigger.document.print.queued', category: 'trigger', label: 'Yazdırma Kuyruğa Alındı' },
  { id: 'trigger.document.ai.designed', category: 'trigger', label: 'AI Belge Tasarladı' },
  {
    id: 'trigger.analytics.dashboard.created',
    category: 'trigger',
    label: 'Analytics Dashboard Oluştu',
  },
  {
    id: 'trigger.analytics.dashboard.layout_saved',
    category: 'trigger',
    label: 'Analytics Layout Kaydedildi',
  },
  { id: 'trigger.analytics.alert.created', category: 'trigger', label: 'Analytics Uyarı Oluştu' },
  {
    id: 'trigger.analytics.export.queued',
    category: 'trigger',
    label: 'Analytics Export Kuyrukta',
  },
  { id: 'trigger.platform.job.queued', category: 'trigger', label: 'Platform Job Kuyrukta' },
  { id: 'trigger.package.purchased', category: 'trigger', label: 'Paket Satın Alındı' },
  { id: 'trigger.package.expiring', category: 'trigger', label: 'Paket Süresi Doluyor' },
  { id: 'trigger.user.created', category: 'trigger', label: 'Yeni Kullanıcı' },
  { id: 'trigger.company.created', category: 'trigger', label: 'Şirket Oluşturuldu' },
  { id: 'trigger.branch.created', category: 'trigger', label: 'Şube Oluşturuldu' },
  { id: 'trigger.warehouse.created', category: 'trigger', label: 'Depo Oluşturuldu' },
  { id: 'trigger.webhook.received', category: 'trigger', label: 'API Webhook Geldi' },
  { id: 'trigger.cron.fired', category: 'trigger', label: 'Cron Çalıştı' },
  { id: 'trigger.ai.result', category: 'trigger', label: 'AI Sonuç Üretti' },
  { id: 'trigger.aios.chat.completed', category: 'trigger', label: 'AIOS Chat Tamamlandı' },
  { id: 'trigger.aios.org.dispatch', category: 'trigger', label: 'AI Org Orchestrator Dispatch' },
  {
    id: 'trigger.aios.autonomous.feedback',
    category: 'trigger',
    label: 'Autonomous Öneri Feedback',
  },
  {
    id: 'trigger.aios.autonomous.scenario',
    category: 'trigger',
    label: 'Autonomous Senaryo Çalıştı',
  },
  { id: 'trigger.commerce.order.received', category: 'trigger', label: 'Commerce Sipariş Geldi' },
  {
    id: 'trigger.commerce.order.promoted',
    category: 'trigger',
    label: 'Commerce Sipariş ERP’ye Aktı',
  },
  { id: 'trigger.commerce.stock.synced', category: 'trigger', label: 'Commerce Stok Senkron' },
  { id: 'trigger.commerce.product.ai', category: 'trigger', label: 'Commerce Product AI' },
  { id: 'trigger.commerce.product.i18n', category: 'trigger', label: 'Commerce Ürün Çok Dilli' },
  {
    id: 'trigger.commerce.order.analyzed',
    category: 'trigger',
    label: 'Commerce AI Sipariş Analizi',
  },
  { id: 'trigger.commerce.return.opened', category: 'trigger', label: 'Commerce İade Açıldı' },
  { id: 'trigger.commerce.subscription.created', category: 'trigger', label: 'Commerce Abonelik' },
  { id: 'trigger.commerce.shipment.created', category: 'trigger', label: 'Commerce Kargo' },
  { id: 'trigger.commerce.payment.created', category: 'trigger', label: 'Commerce Ödeme' },
  { id: 'trigger.mes.operator.action', category: 'trigger', label: 'MES Operatör Aksiyon' },
  { id: 'trigger.mes.scrap.reported', category: 'trigger', label: 'MES Fire' },
  { id: 'trigger.mes.quality.called', category: 'trigger', label: 'MES Kalite Çağrı' },
  { id: 'trigger.mes.bom.created', category: 'trigger', label: 'MES Reçete' },
  { id: 'trigger.mes.maintenance.opened', category: 'trigger', label: 'MES Bakım' },
  { id: 'trigger.finance.account.created', category: 'trigger', label: 'Finans Hesap' },
  { id: 'trigger.finance.journal.posted', category: 'trigger', label: 'Finans Yevmiye' },
  { id: 'trigger.finance.budget.created', category: 'trigger', label: 'Finans Bütçe' },
  { id: 'trigger.finance.cost.recorded', category: 'trigger', label: 'Finans Maliyet' },
  { id: 'trigger.finance.reconciliation.opened', category: 'trigger', label: 'Finans Mutabakat' },
  { id: 'trigger.growth.lead.created', category: 'trigger', label: 'Growth Lead Geldi' },
  { id: 'trigger.growth.lead.scored', category: 'trigger', label: 'Growth Lead Skorlandı' },
  { id: 'trigger.growth.campaign.created', category: 'trigger', label: 'Growth Kampanya' },
  { id: 'trigger.growth.content.i18n', category: 'trigger', label: 'Growth İçerik Çok Dilli' },
  { id: 'trigger.growth.seo.audited', category: 'trigger', label: 'Growth SEO Denetimi' },
  {
    id: 'trigger.growth.content.published',
    category: 'trigger',
    label: 'Growth İçerik Yayınlandı',
  },
  // Conditions
  { id: 'condition.if', category: 'condition', label: 'IF' },
  { id: 'condition.else', category: 'condition', label: 'ELSE' },
  { id: 'condition.and', category: 'condition', label: 'AND' },
  { id: 'condition.or', category: 'condition', label: 'OR' },
  { id: 'condition.not', category: 'condition', label: 'NOT' },
  { id: 'condition.greater', category: 'condition', label: 'Greater' },
  { id: 'condition.less', category: 'condition', label: 'Less' },
  { id: 'condition.equals', category: 'condition', label: 'Equals' },
  { id: 'condition.contains', category: 'condition', label: 'Contains' },
  { id: 'condition.starts_with', category: 'condition', label: 'Starts With' },
  { id: 'condition.ends_with', category: 'condition', label: 'Ends With' },
  { id: 'condition.date_compare', category: 'condition', label: 'Date Compare' },
  { id: 'condition.money_compare', category: 'condition', label: 'Money Compare' },
  { id: 'condition.status_compare', category: 'condition', label: 'Status Compare' },
  { id: 'condition.package_compare', category: 'condition', label: 'Package Compare' },
  { id: 'condition.company_compare', category: 'condition', label: 'Company Compare' },
  { id: 'condition.warehouse_compare', category: 'condition', label: 'Warehouse Compare' },
  { id: 'condition.branch_compare', category: 'condition', label: 'Branch Compare' },
  { id: 'condition.role_compare', category: 'condition', label: 'Role Compare' },
  { id: 'condition.ai_decision', category: 'condition', label: 'AI Decision' },
  // Actions
  { id: 'action.task.create', category: 'action', label: 'Görev oluştur' },
  { id: 'action.note.create', category: 'action', label: 'Not oluştur' },
  { id: 'action.appointment.create', category: 'action', label: 'Randevu oluştur' },
  { id: 'action.quote.create', category: 'action', label: 'Teklif oluştur' },
  { id: 'action.order.create', category: 'action', label: 'Sipariş oluştur' },
  { id: 'action.production.create', category: 'action', label: 'Üretim Emri oluştur' },
  { id: 'action.warehouse.transfer', category: 'action', label: 'Depoya aktar' },
  { id: 'action.invoice.create', category: 'action', label: 'Fatura oluştur' },
  { id: 'action.waybill.create', category: 'action', label: 'İrsaliye oluştur' },
  { id: 'action.pdf.generate', category: 'action', label: 'PDF üret' },
  { id: 'action.document.print', category: 'action', label: 'Belge yazdır' },
  { id: 'action.whatsapp.send', category: 'action', label: 'WhatsApp gönder' },
  { id: 'action.sms.send', category: 'action', label: 'SMS gönder' },
  { id: 'action.mail.send', category: 'action', label: 'Mail gönder' },
  { id: 'action.notification.send', category: 'notification', label: 'Bildirim gönder' },
  { id: 'action.push.send', category: 'notification', label: 'Push gönder' },
  { id: 'action.webhook.call', category: 'integration', label: 'Webhook çağır' },
  { id: 'action.openai.run', category: 'ai', label: 'OpenAI çalıştır' },
  { id: 'action.maps.route', category: 'integration', label: 'Google Maps rota oluştur' },
  { id: 'action.file.create', category: 'document', label: 'Dosya oluştur' },
  { id: 'action.comment.add', category: 'action', label: 'Yorum ekle' },
  { id: 'action.ai.summary', category: 'ai', label: 'AI özet oluştur' },
  { id: 'action.crm.update', category: 'action', label: 'CRM kaydı güncelle' },
  { id: 'action.customer.tag', category: 'action', label: 'Müşteri etiketle' },
  { id: 'action.stock.update', category: 'action', label: 'Stok güncelle' },
  { id: 'action.report.create', category: 'action', label: 'Rapor oluştur' },
  // Wait
  { id: 'wait.5m', category: 'wait', label: '5 dakika bekle' },
  { id: 'wait.30m', category: 'wait', label: '30 dakika bekle' },
  { id: 'wait.1h', category: 'wait', label: '1 saat bekle' },
  { id: 'wait.1d', category: 'wait', label: '1 gün bekle' },
  { id: 'wait.7d', category: 'wait', label: '7 gün bekle' },
  { id: 'wait.until_date', category: 'wait', label: 'Belirli tarihe kadar bekle' },
  { id: 'wait.until_time', category: 'wait', label: 'Belirli saate kadar bekle' },
  { id: 'wait.user_approval', category: 'wait', label: 'Kullanıcı onayı bekle' },
  // Approval
  { id: 'approval.single', category: 'approval', label: 'Tek Seviye' },
  { id: 'approval.dual', category: 'approval', label: 'Çift Seviye' },
  { id: 'approval.multi', category: 'approval', label: 'Çoklu Onay' },
  { id: 'approval.parallel', category: 'approval', label: 'Paralel Onay' },
  { id: 'approval.serial', category: 'approval', label: 'Seri Onay' },
  { id: 'approval.amount', category: 'approval', label: 'Tutar Bazlı' },
  { id: 'approval.role', category: 'approval', label: 'Rol Bazlı' },
  { id: 'approval.company', category: 'approval', label: 'Şirket Bazlı' },
  { id: 'approval.branch', category: 'approval', label: 'Şube Bazlı' },
  // AI
  { id: 'ai.openai', category: 'ai', label: 'OpenAI çağır' },
  { id: 'ai.doc_summary', category: 'ai', label: 'Belge özetle' },
  { id: 'ai.write_mail', category: 'ai', label: 'Mail yaz' },
  { id: 'ai.prepare_quote', category: 'ai', label: 'Teklif hazırla' },
  { id: 'ai.risk', category: 'ai', label: 'Risk analizi yap' },
  { id: 'ai.score_customer', category: 'ai', label: 'Müşteriyi puanla' },
  { id: 'ai.sales_forecast', category: 'ai', label: 'Satış tahmini yap' },
  { id: 'ai.categorize', category: 'ai', label: 'Kategori belirle' },
  { id: 'ai.ocr', category: 'ai', label: 'OCR' },
  { id: 'ai.translate', category: 'ai', label: 'Çeviri' },
  { id: 'ai.product_desc', category: 'ai', label: 'Ürün açıklaması üret' },
  { id: 'ai.seo', category: 'ai', label: 'SEO yazısı üret' },
  // Loop / calc / system
  { id: 'loop.foreach', category: 'loop', label: 'Foreach' },
  { id: 'loop.while', category: 'loop', label: 'While' },
  { id: 'calc.formula', category: 'calculation', label: 'Formül hesapla' },
  { id: 'system.log', category: 'system', label: 'Sistem log' },
  { id: 'system.noop', category: 'system', label: 'No-op' },
]

export type WorkflowTemplate = {
  id: string
  name: string
  domain: string
  description: string
  graph: { nodes: unknown[]; edges: unknown[] }
}

function tNode(id: string, catalogId: string, x: number, y: number, category: string) {
  return {
    id,
    type: 'bach',
    position: { x, y },
    data: { catalogId, category, label: catalogId },
  }
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'tpl.quote_approval',
    name: 'Teklif Onayı',
    domain: 'Satış',
    description: 'Teklif onaylandığında görev + bildirim.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.quote.approved', 80, 120, 'trigger'),
        tNode('n2', 'approval.single', 320, 120, 'approval'),
        tNode('n3', 'action.notification.send', 560, 120, 'notification'),
        tNode('n4', 'action.task.create', 800, 120, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
      ],
    },
  },
  {
    id: 'tpl.purchasing',
    name: 'Satın Alma',
    domain: 'Satın Alma',
    description: 'Stok azaldığında satın alma talebi ve mail.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.stock.low', 80, 120, 'trigger'),
        tNode('n2', 'condition.less', 320, 120, 'condition'),
        tNode('n3', 'action.task.create', 560, 80, 'action'),
        tNode('n4', 'action.mail.send', 560, 200, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3', label: 'true' },
        { id: 'e3', source: 'n2', target: 'n4', label: 'true' },
      ],
    },
  },
  {
    id: 'tpl.production',
    name: 'Üretim',
    domain: 'Üretim',
    description: 'Sipariş onay → üretim emri.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.order.approved', 80, 120, 'trigger'),
        tNode('n2', 'action.production.create', 360, 120, 'action'),
        tNode('n3', 'action.notification.send', 640, 120, 'notification'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
  {
    id: 'tpl.quality',
    name: 'Kalite',
    domain: 'Kalite',
    description: 'Üretim tamam → kalite + depo.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.production.completed', 80, 120, 'trigger'),
        tNode('n2', 'action.task.create', 360, 120, 'action'),
        tNode('n3', 'trigger.quality.completed', 640, 120, 'trigger'),
        tNode('n4', 'action.warehouse.transfer', 920, 120, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
      ],
    },
  },
  {
    id: 'tpl.warehouse',
    name: 'Depo',
    domain: 'Depo',
    description: 'Depo girişi sonrası stok güncelleme.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.warehouse.inbound', 80, 120, 'trigger'),
        tNode('n2', 'action.stock.update', 360, 120, 'action'),
        tNode('n3', 'action.notification.send', 640, 120, 'notification'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
  {
    id: 'tpl.logistics',
    name: 'Lojistik',
    domain: 'Lojistik',
    description: 'Yük planı → araç çıktı → teslim.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.load.planned', 80, 120, 'trigger'),
        tNode('n2', 'action.maps.route', 360, 120, 'integration'),
        tNode('n3', 'trigger.vehicle.departed', 640, 120, 'trigger'),
        tNode('n4', 'trigger.delivery.completed', 920, 120, 'trigger'),
        tNode('n5', 'action.notification.send', 1200, 120, 'notification'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
        { id: 'e4', source: 'n4', target: 'n5' },
      ],
    },
  },
  {
    id: 'tpl.collection',
    name: 'Tahsilat',
    domain: 'Muhasebe',
    description: 'Fatura sonrası tahsilat hatırlatma.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.invoice.issued', 80, 120, 'trigger'),
        tNode('n2', 'wait.7d', 360, 120, 'wait'),
        tNode('n3', 'condition.status_compare', 640, 120, 'condition'),
        tNode('n4', 'action.mail.send', 920, 80, 'action'),
        tNode('n5', 'action.whatsapp.send', 920, 200, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
        { id: 'e4', source: 'n3', target: 'n5' },
      ],
    },
  },
  {
    id: 'tpl.crm',
    name: 'CRM',
    domain: 'CRM',
    description: 'Yeni müşteri → etiket + görev.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.customer.created', 80, 120, 'trigger'),
        tNode('n2', 'action.customer.tag', 360, 120, 'action'),
        tNode('n3', 'action.task.create', 640, 120, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
  {
    id: 'tpl.hr',
    name: 'İnsan Kaynakları',
    domain: 'İK',
    description: 'Yeni kullanıcı onboarding görevleri.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.user.created', 80, 120, 'trigger'),
        tNode('n2', 'action.mail.send', 360, 120, 'action'),
        tNode('n3', 'action.task.create', 640, 120, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
  {
    id: 'tpl.accounting',
    name: 'Muhasebe',
    domain: 'Muhasebe',
    description: 'Sipariş → fatura taslağı.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.order.created', 80, 120, 'trigger'),
        tNode('n2', 'approval.amount', 360, 120, 'approval'),
        tNode('n3', 'action.invoice.create', 640, 120, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
  {
    id: 'tpl.ai_marketing',
    name: 'AI Marketing',
    domain: 'AI',
    description: 'AI sonuç → SEO + mail.',
    graph: {
      nodes: [
        tNode('n1', 'trigger.ai.result', 80, 120, 'trigger'),
        tNode('n2', 'ai.seo', 360, 120, 'ai'),
        tNode('n3', 'action.mail.send', 640, 120, 'action'),
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    },
  },
]
