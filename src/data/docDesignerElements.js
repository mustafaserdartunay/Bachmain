/**
 * Document Center visual designer — element library.
 * Icons are lucide-react component names (resolved in the UI).
 */

export const ELEMENT_LIBRARY = [
  {
    id: 'metin',
    label: 'Metin',
    items: [
      {
        type: 'text',
        label: 'Metin',
        icon: 'Type',
        defaultSize: { w: 200, h: 28 },
        defaultProps: {
          text: 'Metin',
          fontSize: 14,
          fontWeight: 400,
          color: '#111827',
          align: 'left',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      },
      {
        type: 'title',
        label: 'Başlık',
        icon: 'Heading',
        defaultSize: { w: 320, h: 36 },
        defaultProps: {
          text: 'Başlık',
          fontSize: 22,
          fontWeight: 700,
          color: '#111827',
          align: 'left',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
      },
      {
        type: 'paragraph',
        label: 'Paragraf',
        icon: 'AlignLeft',
        defaultSize: { w: 360, h: 72 },
        defaultProps: {
          text: 'Paragraf metni buraya gelir.',
          fontSize: 12,
          fontWeight: 400,
          color: '#374151',
          align: 'left',
          fontFamily: 'Inter, system-ui, sans-serif',
          lineHeight: 1.45,
        },
      },
      {
        type: 'variable',
        label: 'Değişken',
        icon: 'Braces',
        defaultSize: { w: 180, h: 28 },
        defaultProps: {
          text: '{{sirket.unvan}}',
          variablePath: 'sirket.unvan',
          fontSize: 13,
          fontWeight: 500,
          color: '#111827',
          align: 'left',
        },
      },
      {
        type: 'date',
        label: 'Tarih',
        icon: 'Calendar',
        defaultSize: { w: 140, h: 28 },
        defaultProps: {
          text: '{{belge.tarih}}',
          variablePath: 'belge.tarih',
          fontSize: 12,
          color: '#111827',
          align: 'left',
          format: 'dd.MM.yyyy',
        },
      },
      {
        type: 'pageNumber',
        label: 'Sayfa No',
        icon: 'Hash',
        defaultSize: { w: 100, h: 24 },
        defaultProps: {
          text: 'Sayfa {{page}} / {{pages}}',
          fontSize: 11,
          color: '#6b7280',
          align: 'center',
        },
      },
    ],
  },
  {
    id: 'medya',
    label: 'Medya',
    items: [
      {
        type: 'image',
        label: 'Görsel',
        icon: 'Image',
        defaultSize: { w: 160, h: 120 },
        defaultProps: {
          src: '',
          alt: 'Görsel',
          objectFit: 'contain',
          borderRadius: 0,
        },
      },
      {
        type: 'logo',
        label: 'Logo',
        icon: 'BadgeCheck',
        defaultSize: { w: 140, h: 60 },
        defaultProps: {
          src: '',
          alt: 'Logo',
          objectFit: 'contain',
          variablePath: 'sirket.logo',
        },
      },
      {
        type: 'signature',
        label: 'İmza',
        icon: 'PenLine',
        defaultSize: { w: 180, h: 70 },
        defaultProps: {
          label: 'İmza',
          line: true,
          fontSize: 11,
          color: '#6b7280',
        },
      },
      {
        type: 'stamp',
        label: 'Kaşe',
        icon: 'Stamp',
        defaultSize: { w: 100, h: 100 },
        defaultProps: {
          text: 'KAŞE',
          borderColor: '#9ca3af',
          color: '#9ca3af',
          fontSize: 12,
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
        label: 'Dikdörtgen',
        icon: 'Square',
        defaultSize: { w: 160, h: 80 },
        defaultProps: {
          fill: '#e5e7eb',
          stroke: '#9ca3af',
          strokeWidth: 1,
          borderRadius: 0,
        },
      },
      {
        type: 'circle',
        label: 'Daire',
        icon: 'Circle',
        defaultSize: { w: 80, h: 80 },
        defaultProps: {
          fill: '#e5e7eb',
          stroke: '#9ca3af',
          strokeWidth: 1,
        },
      },
      {
        type: 'line',
        label: 'Çizgi',
        icon: 'Minus',
        defaultSize: { w: 240, h: 2 },
        defaultProps: {
          stroke: '#111827',
          strokeWidth: 2,
        },
      },
      {
        type: 'divider',
        label: 'Ayırıcı',
        icon: 'SeparatorHorizontal',
        defaultSize: { w: 400, h: 12 },
        defaultProps: {
          stroke: '#d1d5db',
          strokeWidth: 1,
          style: 'solid',
        },
      },
    ],
  },
  {
    id: 'veri',
    label: 'Veri',
    items: [
      {
        type: 'table',
        label: 'Tablo',
        icon: 'Table',
        defaultSize: { w: 480, h: 160 },
        defaultProps: {
          columns: [
            { key: 'urun', label: 'Ürün', width: '40%' },
            { key: 'adet', label: 'Adet', width: '15%' },
            { key: 'birim', label: 'Birim', width: '20%' },
            { key: 'tutar', label: 'Tutar', width: '25%' },
          ],
          headerBg: '#f3f4f6',
          borderColor: '#e5e7eb',
          fontSize: 11,
          showHeader: true,
        },
      },
      {
        type: 'companyBlock',
        label: 'Şirket Bloğu',
        icon: 'Building2',
        defaultSize: { w: 260, h: 90 },
        defaultProps: {
          showLogo: false,
          fields: ['unvan', 'adres', 'telefon', 'vergiNo'],
          fontSize: 12,
          color: '#111827',
        },
      },
      {
        type: 'customerBlock',
        label: 'Müşteri Bloğu',
        icon: 'User',
        defaultSize: { w: 260, h: 90 },
        defaultProps: {
          fields: ['unvan', 'adres', 'telefon'],
          fontSize: 12,
          color: '#111827',
          title: 'Müşteri',
        },
      },
      {
        type: 'totalsBlock',
        label: 'Toplamlar',
        icon: 'Calculator',
        defaultSize: { w: 220, h: 100 },
        defaultProps: {
          fields: ['araToplam', 'kdv', 'toplam'],
          fontSize: 12,
          color: '#111827',
          align: 'right',
        },
      },
    ],
  },
  {
    id: 'kodlar',
    label: 'Kodlar',
    items: [
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
      {
        type: 'qr',
        label: 'QR Kod',
        icon: 'QrCode',
        defaultSize: { w: 90, h: 90 },
        defaultProps: {
          value: '{{belge.no}}',
          variablePath: 'belge.no',
          ecc: 'M',
        },
      },
    ],
  },
  {
    id: 'belge',
    label: 'Belge',
    items: [
      {
        type: 'companyBlock',
        label: 'Şirket Bilgisi',
        icon: 'Building2',
        defaultSize: { w: 280, h: 100 },
        defaultProps: {
          showLogo: true,
          fields: ['unvan', 'adres', 'telefon', 'email'],
          fontSize: 12,
          color: '#111827',
        },
      },
      {
        type: 'customerBlock',
        label: 'Alıcı / Müşteri',
        icon: 'Users',
        defaultSize: { w: 280, h: 100 },
        defaultProps: {
          fields: ['unvan', 'adres', 'telefon', 'vergiNo'],
          fontSize: 12,
          color: '#111827',
          title: 'Sayın',
        },
      },
      {
        type: 'totalsBlock',
        label: 'Belge Toplamı',
        icon: 'Receipt',
        defaultSize: { w: 240, h: 110 },
        defaultProps: {
          fields: ['araToplam', 'iskonto', 'kdv', 'toplam'],
          fontSize: 12,
          color: '#111827',
          align: 'right',
        },
      },
    ],
  },
]

/** Flat lookup: type → first matching element definition */
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
