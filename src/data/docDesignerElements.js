/**
 * Document Center visual designer — element library (BachMain).
 */

export const TABLE_COLUMN_CATALOG = [
  { key: 'kod', label: 'Ürün Kodu' },
  { key: 'urun', label: 'Ürün Adı' },
  { key: 'aciklama', label: 'Açıklama' },
  { key: 'miktar', label: 'Miktar' },
  { key: 'birim', label: 'Birim' },
  { key: 'birimFiyat', label: 'Birim Fiyat' },
  { key: 'indirim', label: 'İndirim' },
  { key: 'iskonto', label: 'İskonto' },
  { key: 'kdv', label: 'KDV' },
  { key: 'toplam', label: 'Toplam' },
  { key: 'seriNo', label: 'Seri No' },
  { key: 'lot', label: 'Lot' },
  { key: 'barkod', label: 'Barkod' },
]

const TEXT_BASE = {
  fontSize: 13,
  fontWeight: 400,
  color: '#111827',
  align: 'left',
  fontFamily: 'Inter, system-ui, sans-serif',
}

export const ELEMENT_LIBRARY = [
  {
    id: 'firma',
    label: 'Firma',
    items: [
      {
        type: 'logo',
        label: 'Firma Logosu',
        icon: 'BadgeCheck',
        defaultSize: { w: 140, h: 56 },
        defaultProps: { src: '', alt: 'Logo', objectFit: 'contain', variablePath: 'sirket.logo' },
      },
      {
        type: 'companyBlock',
        label: 'Firma Bilgileri',
        icon: 'Building2',
        defaultSize: { w: 260, h: 100 },
        defaultProps: {
          showLogo: false,
          fields: ['unvan', 'adres', 'telefon', 'vergiNo'],
          fontSize: 12,
          color: '#111827',
        },
      },
    ],
  },
  {
    id: 'cari',
    label: 'Cari / Müşteri',
    items: [
      {
        type: 'customerBlock',
        label: 'Müşteri Bilgileri',
        icon: 'User',
        defaultSize: { w: 260, h: 100 },
        defaultProps: {
          fields: ['unvan', 'adres', 'telefon', 'vergiNo'],
          fontSize: 12,
          color: '#111827',
          title: 'Müşteri Bilgileri',
        },
      },
      {
        type: 'variable',
        label: 'Cari Adı',
        icon: 'Users',
        defaultSize: { w: 200, h: 28 },
        defaultProps: { ...TEXT_BASE, text: '{{cari_adi}}', variablePath: 'cari_adi' },
      },
      {
        type: 'paragraph',
        label: 'Teslimat Adresi',
        icon: 'AlignLeft',
        defaultSize: { w: 260, h: 72 },
        defaultProps: {
          ...TEXT_BASE,
          text: 'Teslimat:\n{{teslimat.adres}}',
          fontSize: 12,
          lineHeight: 1.4,
        },
      },
    ],
  },
  {
    id: 'belge',
    label: 'Belge Bilgileri',
    items: [
      {
        type: 'title',
        label: 'Fatura Bilgileri',
        icon: 'Receipt',
        defaultSize: { w: 280, h: 32 },
        defaultProps: { ...TEXT_BASE, text: 'Fatura No: {{fatura_no}}', fontSize: 16, fontWeight: 700 },
      },
      {
        type: 'variable',
        label: 'Sipariş Bilgileri',
        icon: 'Hash',
        defaultSize: { w: 220, h: 28 },
        defaultProps: { ...TEXT_BASE, text: 'Sipariş: {{siparis_no}}', variablePath: 'siparis_no' },
      },
      {
        type: 'variable',
        label: 'İrsaliye Bilgileri',
        icon: 'Hash',
        defaultSize: { w: 220, h: 28 },
        defaultProps: { ...TEXT_BASE, text: 'İrsaliye: {{irsaliye_no}}', variablePath: 'irsaliye_no' },
      },
      {
        type: 'variable',
        label: 'Teklif Bilgileri',
        icon: 'Hash',
        defaultSize: { w: 220, h: 28 },
        defaultProps: { ...TEXT_BASE, text: 'Teklif: {{teklif_no}}', variablePath: 'teklif_no' },
      },
      {
        type: 'date',
        label: 'Tarih',
        icon: 'Calendar',
        defaultSize: { w: 140, h: 28 },
        defaultProps: {
          ...TEXT_BASE,
          text: '{{belge.tarih}}',
          variablePath: 'belge.tarih',
          fontSize: 12,
          format: 'dd.MM.yyyy',
        },
      },
      {
        type: 'variable',
        label: 'Saat',
        icon: 'Calendar',
        defaultSize: { w: 100, h: 24 },
        defaultProps: { ...TEXT_BASE, text: '{{belge.saat}}', variablePath: 'belge.saat', fontSize: 11 },
      },
    ],
  },
  {
    id: 'urun',
    label: 'Ürün / Toplam',
    items: [
      {
        type: 'table',
        label: 'Ürün Tablosu',
        icon: 'Table',
        defaultSize: { w: 520, h: 180 },
        defaultProps: {
          columns: [
            { key: 'kod', label: 'Kod', width: '12%' },
            { key: 'urun', label: 'Hizmet / Ürün Adı', width: '28%' },
            { key: 'aciklama', label: 'Açıklama', width: '18%' },
            { key: 'miktar', label: 'Miktar', width: '10%' },
            { key: 'birimFiyat', label: 'Birim Fiyat', width: '14%' },
            { key: 'kdv', label: 'KDV', width: '8%' },
            { key: 'toplam', label: 'Toplam', width: '10%' },
          ],
          headerBg: '#f3f4f6',
          borderColor: '#e5e7eb',
          fontSize: 11,
          showHeader: true,
        },
      },
      {
        type: 'totalsBlock',
        label: 'Toplam Alanı',
        icon: 'Calculator',
        defaultSize: { w: 220, h: 110 },
        defaultProps: {
          fields: ['araToplam', 'indirim', 'kdv', 'toplam'],
          fontSize: 12,
          color: '#111827',
          align: 'right',
        },
      },
      {
        type: 'variable',
        label: 'KDV',
        icon: 'Calculator',
        defaultSize: { w: 160, h: 24 },
        defaultProps: { ...TEXT_BASE, text: 'KDV: {{kdv}}', variablePath: 'kdv', align: 'right' },
      },
      {
        type: 'variable',
        label: 'İndirim',
        icon: 'Calculator',
        defaultSize: { w: 160, h: 24 },
        defaultProps: { ...TEXT_BASE, text: 'İndirim: {{indirim}}', variablePath: 'indirim', align: 'right' },
      },
      {
        type: 'variable',
        label: 'Ara Toplam',
        icon: 'Calculator',
        defaultSize: { w: 180, h: 24 },
        defaultProps: { ...TEXT_BASE, text: 'Ara Toplam: {{ara_toplam}}', variablePath: 'ara_toplam', align: 'right' },
      },
      {
        type: 'variable',
        label: 'Genel Toplam',
        icon: 'Receipt',
        defaultSize: { w: 200, h: 28 },
        defaultProps: {
          ...TEXT_BASE,
          text: 'Genel Toplam: {{genel_toplam}}',
          variablePath: 'genel_toplam',
          fontWeight: 700,
          align: 'right',
        },
      },
    ],
  },
  {
    id: 'metin',
    label: 'Metin & Not',
    items: [
      {
        type: 'text',
        label: 'Dinamik Metin',
        icon: 'Type',
        defaultSize: { w: 200, h: 28 },
        defaultProps: { ...TEXT_BASE, text: 'Metin' },
      },
      {
        type: 'title',
        label: 'Başlık',
        icon: 'Heading',
        defaultSize: { w: 320, h: 36 },
        defaultProps: { ...TEXT_BASE, text: 'Başlık', fontSize: 22, fontWeight: 700 },
      },
      {
        type: 'paragraph',
        label: 'Açıklama',
        icon: 'AlignLeft',
        defaultSize: { w: 360, h: 72 },
        defaultProps: {
          ...TEXT_BASE,
          text: 'Açıklama alanı',
          fontSize: 12,
          lineHeight: 1.45,
        },
      },
      {
        type: 'paragraph',
        label: 'Not',
        icon: 'AlignLeft',
        defaultSize: { w: 320, h: 64 },
        defaultProps: {
          ...TEXT_BASE,
          text: 'Not: {{belge.not}}',
          fontSize: 11,
          color: '#4b5563',
          lineHeight: 1.4,
        },
      },
      {
        type: 'variable',
        label: 'Özel Alan',
        icon: 'Braces',
        defaultSize: { w: 180, h: 28 },
        defaultProps: { ...TEXT_BASE, text: '{{ozel.alan}}', variablePath: 'ozel.alan' },
      },
      {
        type: 'variable',
        label: 'Koşullu Alan',
        icon: 'Braces',
        defaultSize: { w: 180, h: 28 },
        defaultProps: {
          ...TEXT_BASE,
          text: '{{kosul.deger}}',
          variablePath: 'kosul.deger',
          conditional: true,
          conditionPath: 'kosul.gorunur',
        },
      },
      {
        type: 'pageNumber',
        label: 'Sayfa Numarası',
        icon: 'Hash',
        defaultSize: { w: 100, h: 24 },
        defaultProps: { ...TEXT_BASE, text: 'Sayfa {{page}} / {{pages}}', fontSize: 11, color: '#6b7280', align: 'center' },
      },
      {
        type: 'spacer',
        label: 'Boşluk',
        icon: 'SeparatorHorizontal',
        defaultSize: { w: 200, h: 24 },
        defaultProps: { fill: 'transparent' },
      },
    ],
  },
  {
    id: 'medya',
    label: 'Medya & Kod',
    items: [
      {
        type: 'image',
        label: 'Resim',
        icon: 'Image',
        defaultSize: { w: 160, h: 120 },
        defaultProps: { src: '', alt: 'Görsel', objectFit: 'contain', borderRadius: 0 },
      },
      {
        type: 'signature',
        label: 'İmza Alanı',
        icon: 'PenLine',
        defaultSize: { w: 180, h: 70 },
        defaultProps: { label: 'İmza', line: true, fontSize: 11, color: '#6b7280' },
      },
      {
        type: 'stamp',
        label: 'Kaşe',
        icon: 'Stamp',
        defaultSize: { w: 100, h: 100 },
        defaultProps: { text: 'KAŞE', borderColor: '#9ca3af', color: '#9ca3af', fontSize: 12 },
      },
      {
        type: 'qr',
        label: 'QR Kod',
        icon: 'QrCode',
        defaultSize: { w: 90, h: 90 },
        defaultProps: { value: '{{belge.no}}', variablePath: 'belge.no', ecc: 'M' },
      },
      {
        type: 'barcode',
        label: 'Barkod',
        icon: 'Barcode',
        defaultSize: { w: 200, h: 60 },
        defaultProps: {
          value: '{{belge.no}}',
          variablePath: 'belge.no',
          format: 'CODE128',
          showValue: true,
          fontSize: 10,
        },
      },
    ],
  },
  {
    id: 'sekiller',
    label: 'Şekiller',
    items: [
      {
        type: 'rect',
        label: 'Kutu / Dikdörtgen',
        icon: 'Square',
        defaultSize: { w: 160, h: 80 },
        defaultProps: { fill: '#e5e7eb', stroke: '#9ca3af', strokeWidth: 1, borderRadius: 0 },
      },
      {
        type: 'circle',
        label: 'Çember',
        icon: 'Circle',
        defaultSize: { w: 80, h: 80 },
        defaultProps: { fill: '#e5e7eb', stroke: '#9ca3af', strokeWidth: 1 },
      },
      {
        type: 'line',
        label: 'Çizgi',
        icon: 'Minus',
        defaultSize: { w: 240, h: 2 },
        defaultProps: { stroke: '#111827', strokeWidth: 2 },
      },
      {
        type: 'divider',
        label: 'Ayırıcı',
        icon: 'SeparatorHorizontal',
        defaultSize: { w: 400, h: 12 },
        defaultProps: { stroke: '#d1d5db', strokeWidth: 1, style: 'solid' },
      },
    ],
  },
]

export function getElementDef(type) {
  for (const group of ELEMENT_LIBRARY) {
    const found = group.items.find((item) => item.type === type)
    if (found) return found
  }
  return null
}

export function listAllElementTypes() {
  const types = []
  for (const group of ELEMENT_LIBRARY) {
    for (const item of group.items) {
      if (!types.includes(item.type)) types.push(item.type)
    }
  }
  return types
}
