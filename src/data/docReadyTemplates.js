import { createBlock } from '../utils/docCanvasEngine'

function invoiceLikeBlocks(title = 'FATURA') {
  return [
    createBlock('logo', { x: 40, y: 36, w: 120, h: 48, zIndex: 2 }),
    createBlock('companyBlock', {
      x: 40,
      y: 96,
      w: 260,
      h: 90,
      zIndex: 2,
      props: { fields: ['unvan', 'adres', 'telefon', 'vergiNo'], fontSize: 11, color: '#111827' },
    }),
    createBlock('title', {
      x: 320,
      y: 36,
      w: 200,
      h: 36,
      zIndex: 2,
      props: { text: title, fontSize: 22, fontWeight: 800, align: 'center', color: '#0f172a' },
    }),
    createBlock('qr', { x: 640, y: 36, w: 88, h: 88, zIndex: 2 }),
    createBlock('customerBlock', {
      x: 40,
      y: 210,
      w: 280,
      h: 100,
      zIndex: 2,
      props: { title: 'Müşteri Bilgileri', fields: ['unvan', 'adres', 'telefon'], fontSize: 11 },
    }),
    createBlock('paragraph', {
      x: 360,
      y: 210,
      w: 200,
      h: 80,
      zIndex: 2,
      props: {
        text: 'Belge No: {{fatura_no}}\nTarih: {{belge.tarih}}\nSipariş: {{siparis_no}}',
        fontSize: 11,
        lineHeight: 1.45,
      },
    }),
    createBlock('table', {
      x: 40,
      y: 340,
      w: 700,
      h: 220,
      zIndex: 2,
    }),
    createBlock('paragraph', {
      x: 40,
      y: 580,
      w: 280,
      h: 80,
      zIndex: 2,
      props: { text: 'Senaryo / Not:\n{{belge.not}}', fontSize: 11, color: '#4b5563' },
    }),
    createBlock('totalsBlock', { x: 520, y: 580, w: 220, h: 120, zIndex: 2 }),
    createBlock('signature', { x: 40, y: 720, w: 160, h: 70, zIndex: 2 }),
    createBlock('pageNumber', { x: 340, y: 1040, w: 120, h: 24, zIndex: 2 }),
  ]
}

function simpleFormBlocks(title) {
  return [
    createBlock('title', {
      x: 40,
      y: 40,
      w: 400,
      h: 36,
      zIndex: 2,
      props: { text: title, fontSize: 20, fontWeight: 800 },
    }),
    createBlock('companyBlock', { x: 40, y: 100, w: 280, h: 90, zIndex: 2 }),
    createBlock('variable', {
      x: 40,
      y: 210,
      w: 280,
      h: 28,
      zIndex: 2,
      props: { text: 'Belge: {{belge.no}} · {{belge.tarih}}', fontSize: 12 },
    }),
    createBlock('table', { x: 40, y: 260, w: 700, h: 240, zIndex: 2 }),
    createBlock('totalsBlock', { x: 520, y: 520, w: 220, h: 110, zIndex: 2 }),
    createBlock('signature', { x: 40, y: 660, w: 180, h: 70, zIndex: 2 }),
  ]
}

function labelBlocks(kind) {
  const title =
    kind === 'cargo' ? 'KARGO' : kind === 'pallet' ? 'PALET' : kind === 'box' ? 'KOLİ' : 'QR'
  return [
    createBlock('title', {
      x: 12,
      y: 10,
      w: 160,
      h: 24,
      zIndex: 2,
      props: { text: title, fontSize: 14, fontWeight: 800, align: 'center' },
    }),
    createBlock('qr', { x: 40, y: 40, w: 90, h: 90, zIndex: 2 }),
    createBlock('barcode', { x: 12, y: 140, w: 160, h: 48, zIndex: 2 }),
    createBlock('variable', {
      x: 12,
      y: 196,
      w: 160,
      h: 40,
      zIndex: 2,
      props: { text: '{{urun_adi}}\n{{miktar}} {{birim}}', fontSize: 10, align: 'center' },
    }),
  ]
}

function thermalBlocks() {
  return [
    createBlock('title', {
      x: 8,
      y: 8,
      w: 200,
      h: 28,
      zIndex: 2,
      props: { text: '{{firma_unvani}}', fontSize: 14, fontWeight: 800, align: 'center' },
    }),
    createBlock('variable', {
      x: 8,
      y: 44,
      w: 200,
      h: 48,
      zIndex: 2,
      props: { text: '{{belge.no}}\n{{belge.tarih}} {{belge.saat}}', fontSize: 11, align: 'center' },
    }),
    createBlock('divider', { x: 8, y: 100, w: 200, h: 8, zIndex: 2 }),
    createBlock('paragraph', {
      x: 8,
      y: 112,
      w: 200,
      h: 120,
      zIndex: 2,
      props: { text: '{{kalemler_html}}', fontSize: 10 },
    }),
    createBlock('variable', {
      x: 8,
      y: 250,
      w: 200,
      h: 28,
      zIndex: 2,
      props: { text: 'TOPLAM: {{genel_toplam}}', fontWeight: 800, fontSize: 13, align: 'center' },
    }),
    createBlock('barcode', { x: 20, y: 290, w: 180, h: 50, zIndex: 2 }),
  ]
}

/** Ready-made templates for left rail */
export const DOC_READY_TEMPLATES = [
  { id: 'ready-invoice', name: 'Fatura', docType: 'invoice', pageSize: 'A4', orientation: 'portrait', blocks: () => invoiceLikeBlocks('FATURA') },
  { id: 'ready-earchive', name: 'e-Arşiv', docType: 'invoice', pageSize: 'A4', orientation: 'portrait', blocks: () => invoiceLikeBlocks('e-ARŞİV') },
  { id: 'ready-einvoice', name: 'e-Fatura', docType: 'invoice', pageSize: 'A4', orientation: 'portrait', blocks: () => invoiceLikeBlocks('e-FATURA') },
  { id: 'ready-quote', name: 'Teklif', docType: 'quote', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('TEKLİF') },
  { id: 'ready-order', name: 'Sipariş', docType: 'order', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('SİPARİŞ') },
  { id: 'ready-waybill', name: 'İrsaliye', docType: 'waybill', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('İRSALİYE') },
  { id: 'ready-receipt', name: 'Tahsilat Makbuzu', docType: 'receipt', pageSize: 'A5', orientation: 'portrait', blocks: () => simpleFormBlocks('TAHSİLAT') },
  { id: 'ready-production', name: 'Üretim Fişi', docType: 'production', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('ÜRETİM FİŞİ') },
  { id: 'ready-warehouse', name: 'Depo Fişi', docType: 'warehouse', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('DEPO FİŞİ') },
  { id: 'ready-stock', name: 'Stok Fişi', docType: 'stock', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('STOK FİŞİ') },
  { id: 'ready-transfer', name: 'Transfer Fişi', docType: 'transfer', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('TRANSFER') },
  { id: 'ready-count', name: 'Sayım Fişi', docType: 'count', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('SAYIM') },
  { id: 'ready-purchase', name: 'Satın Alma', docType: 'purchase', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('SATIN ALMA') },
  { id: 'ready-return', name: 'İade', docType: 'return', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('İADE') },
  { id: 'ready-service', name: 'Servis Formu', docType: 'service', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('SERVİS FORMU') },
  { id: 'ready-workorder', name: 'İş Emri', docType: 'workorder', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('İŞ EMRİ') },
  { id: 'ready-dispatch', name: 'Sevk Formu', docType: 'dispatch', pageSize: 'A4', orientation: 'portrait', blocks: () => simpleFormBlocks('SEVK FORMU') },
  { id: 'ready-pos', name: 'POS Fişi', docType: 'pos', pageSize: 'Thermal80', orientation: 'portrait', blocks: () => thermalBlocks() },
  { id: 'ready-thermal58', name: 'Termal 58 mm', docType: 'pos', pageSize: 'Thermal58', orientation: 'portrait', blocks: () => thermalBlocks() },
  { id: 'ready-label-qr', name: 'Barkod / QR Etiketi', docType: 'label', pageSize: 'LabelQR', orientation: 'portrait', blocks: () => labelBlocks('qr') },
  { id: 'ready-label-cargo', name: 'Kargo Etiketi', docType: 'label', pageSize: 'LabelCargo', orientation: 'portrait', blocks: () => labelBlocks('cargo') },
  { id: 'ready-label-pallet', name: 'Palet Etiketi', docType: 'label', pageSize: 'LabelPallet', orientation: 'portrait', blocks: () => labelBlocks('pallet') },
  { id: 'ready-label-box', name: 'Koli Etiketi', docType: 'label', pageSize: 'LabelBox', orientation: 'portrait', blocks: () => labelBlocks('box') },
]

export const DOC_TYPE_FILTERS = [
  { id: 'all', label: 'Tümü' },
  { id: 'quote', label: 'Teklif' },
  { id: 'order', label: 'Sipariş' },
  { id: 'invoice', label: 'Fatura' },
  { id: 'waybill', label: 'İrsaliye' },
  { id: 'production', label: 'Üretim' },
  { id: 'label', label: 'Etiket' },
  { id: 'pos', label: 'POS / Termal' },
  { id: 'generic', label: 'Genel' },
]

export function materializeReadyTemplate(ready) {
  if (!ready) return null
  return {
    name: ready.name,
    docType: ready.docType,
    pageSize: ready.pageSize,
    orientation: ready.orientation || 'portrait',
    designMode: 'visual',
    blocks: typeof ready.blocks === 'function' ? ready.blocks() : structuredClone(ready.blocks || []),
    margins: { top: 15, right: 15, bottom: 15, left: 15 },
  }
}
