export const BOX_COST_STORAGE_KEY = 'bach-box-cost-calculator-v2'

export const BOX_COST_VARIANTS = {
  baklava: {
    storageKey: 'bach-box-cost-baklava-v1',
    title: 'Baklava, Pasta, Turta, Donut, Kruvasan Kutuları Maaliyet Hesaplama',
    subtitle: 'Baklava, pasta, turta, donut ve kruvasan kutularının karton, baskı ve işlem maliyetlerini hesaplayın.',
    badge: 'Ambalaj Kutusu',
    defaultUrunAdi: 'Baklava Kutusu',
  },
}

export function getBoxCostStorageKey(variant = 'baklava') {
  return BOX_COST_VARIANTS[variant]?.storageKey || BOX_COST_STORAGE_KEY
}

export const SHEET_MARGIN_EN = 2
export const SHEET_MARGIN_BOY = 1
export const BLEED_PER_SIDE = 0.5
export const STANDARD_STOCK_EN = 70
export const STANDARD_STOCK_BOY = 100

export const DEFAULT_PRICE_FIELDS = [
  { id: 'boya', label: 'Boya fiyatı', unit: '₺/tabaka', defaultValue: 0 },
  { id: 'icSelefon', label: 'İç selefon fiyatı', unit: '₺/tabaka', defaultValue: 0 },
  { id: 'disSelefon', label: 'Dış selefon fiyatı', unit: '₺/tabaka', defaultValue: 0 },
  { id: 'yaldiz', label: 'Yaldız baskı fiyatı', unit: '₺/tabaka', defaultValue: 0 },
  { id: 'gofre', label: 'Gofre baskı fiyatı', unit: '₺/tabaka', defaultValue: 0 },
  { id: 'kesim', label: 'Kesim fiyatı', unit: '₺/tabaka', defaultValue: 0 },
  { id: 'paketleme', label: 'Paketleme fiyatı', unit: '₺/kutu', defaultValue: 0 },
  { id: 'nakliye', label: 'Nakliye fiyatı', unit: '₺/toplam', defaultValue: 0 },
  { id: 'siralama', label: 'Sıralama fiyatı', unit: '₺/tabaka', defaultValue: 0 },
]

export const DEFAULT_KARTON_TYPES = [
  { label: 'Bristol Karton', color: 'bg-amber-500' },
  { label: 'Kuşe Karton', color: 'bg-blue-500' },
  { label: 'Kraft Karton', color: 'bg-orange-500' },
  { label: 'Amerikan Bristol', color: 'bg-purple-500' },
  { label: 'Duplex Karton', color: 'bg-emerald-500' },
  { label: 'Oluklu Mukavva (E Dalga)', color: 'bg-cyan-500' },
  { label: 'Oluklu Mukavva (B Dalga)', color: 'bg-pink-500' },
]

export const DEFAULT_GRAMAJ_OPTIONS = [
  { label: '250 gr', color: 'bg-gray-500', value: 250 },
  { label: '280 gr', color: 'bg-gray-500', value: 280 },
  { label: '300 gr', color: 'bg-gray-500', value: 300 },
  { label: '350 gr', color: 'bg-gray-500', value: 350 },
  { label: '400 gr', color: 'bg-blue-500', value: 400 },
  { label: '450 gr', color: 'bg-gray-500', value: 450 },
  { label: '500 gr', color: 'bg-gray-500', value: 500 },
]

export const DEFAULT_BASKI_TYPES = [
  { label: 'Ofset Baskı', color: 'bg-blue-500' },
  { label: 'Flexo Baskı', color: 'bg-emerald-500' },
  { label: 'Dijital Baskı', color: 'bg-purple-500' },
]

export const DEFAULT_RENK_OPTIONS = [
  { label: '1 Renk', color: 'bg-gray-500', value: 1 },
  { label: '2 Renk', color: 'bg-gray-500', value: 2 },
  { label: '4 Renk (CMYK)', color: 'bg-blue-500', value: 4 },
  { label: '5 Renk + Lak', color: 'bg-purple-500', value: 5 },
]

export const DEFAULT_FORM = {
  urunAdi: 'Baklava Kutusu',
  urunEn: '170',
  urunBoy: '250',
  urunYukseklik: '50',
  kartonEn: '70',
  kartonBoy: '100',
  acikEbatBoy: '33',
  acikEbatEn: '48',
  siparisAdeti: '1000',
  kartonTon: '35000',
  tekRenkGecis: '95',
  kartonCinsi: 'Bristol Karton',
  gramaj: '400 gr',
  baskiTuru: 'Ofset Baskı',
  renkSecenegi: '4 Renk (CMYK)',
  boya: '0',
  icSelefon: '0',
  disSelefon: '0',
  yaldiz: '0',
  gofre: '0',
  kesim: '0',
  paketleme: '0',
  nakliye: '0',
  siralama: '0',
}

export function parseNumber(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed) return 0

  const hasComma = trimmed.includes(',')
  const hasDot = trimmed.includes('.')

  if (hasComma && hasDot) {
    const lastComma = trimmed.lastIndexOf(',')
    const lastDot = trimmed.lastIndexOf('.')
    if (lastComma > lastDot) return Number(trimmed.replace(/\./g, '').replace(',', '.')) || 0
    return Number(trimmed.replace(/,/g, '')) || 0
  }

  if (hasComma) return Number(trimmed.replace(',', '.')) || 0

  if (hasDot) {
    const parts = trimmed.split('.')
    if (parts.length === 2 && parts[1].length <= 2) return Number(trimmed) || 0
    return Number(trimmed.replace(/\./g, '')) || 0
  }

  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : 0
}

export function formatNumber(value, digits = 2) {
  return Number(value || 0).toLocaleString('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatMoney(value) {
  return `${formatNumber(value)}₺`
}

export function formatCm(value) {
  return `${Number(value.toFixed(1)).toString().replace('.', ',')} cm`
}

export function roundCm(value) {
  return Math.ceil(value * 10) / 10
}

export function parseGramajValue(label, options = DEFAULT_GRAMAJ_OPTIONS) {
  const match = options.find((item) => item.label === label)
  if (match?.value) return match.value
  const numeric = Number(String(label).replace(/[^\d.,]/g, '').replace(',', '.'))
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 0
}

export function parseRenkValue(label, options = DEFAULT_RENK_OPTIONS) {
  const match = options.find((item) => item.label === label)
  if (match?.value) return match.value
  const numeric = Number(String(label).match(/(\d+)/)?.[1])
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0
}

export function optimizeSheetFromBox(boxEn, boxBoy) {
  const bleedW = boxEn + BLEED_PER_SIDE * 2
  const bleedH = boxBoy + BLEED_PER_SIDE * 2
  let best = null

  for (let cols = 1; cols <= 20; cols += 1) {
    for (let rows = 1; rows <= 20; rows += 1) {
      for (const rotated of [false, true]) {
        const pieceW = rotated ? bleedH : bleedW
        const pieceH = rotated ? bleedW : bleedH
        const sheetEn = roundCm(cols * pieceW + SHEET_MARGIN_EN)
        const sheetBoy = roundCm(rows * pieceH + SHEET_MARGIN_BOY)

        if (sheetEn > STANDARD_STOCK_EN || sheetBoy > STANDARD_STOCK_BOY) continue

        const count = cols * rows
        const sheetArea = sheetEn * sheetBoy
        const candidate = { count, cols, rows, rotated, pieceW, pieceH, sheetEn, sheetBoy, sheetArea }

        if (!best || candidate.count > best.count || (candidate.count === best.count && candidate.sheetArea < best.sheetArea)) {
          best = candidate
        }
      }
    }
  }

  if (!best) {
    best = {
      count: 1,
      cols: 1,
      rows: 1,
      rotated: false,
      pieceW: bleedW,
      pieceH: bleedH,
      sheetEn: roundCm(bleedW + SHEET_MARGIN_EN),
      sheetBoy: roundCm(bleedH + SHEET_MARGIN_BOY),
      sheetArea: 0,
    }
  }

  return best
}

export function sheetCardboardCost(boy, en, gramaj, tonFiyat) {
  return (boy * en * gramaj) / 10000 * (tonFiyat / 1000000)
}

export function computeBestNesting(usableW, usableH, boxW, boxH) {
  if (usableW <= 0 || usableH <= 0 || boxW <= 0 || boxH <= 0) {
    return { count: 0, cols: 0, rows: 0, boxW: 0, boxH: 0, rotated: false }
  }

  const options = [
    { cols: Math.floor(usableW / boxW), rows: Math.floor(usableH / boxH), boxW, boxH, rotated: false },
    { cols: Math.floor(usableW / boxH), rows: Math.floor(usableH / boxW), boxW: boxH, boxH: boxW, rotated: true },
  ]

  const best = options.reduce((winner, current) => (
    current.cols * current.rows >= winner.cols * winner.rows ? current : winner
  ))

  return {
    count: best.cols * best.rows,
    cols: best.cols,
    rows: best.rows,
    boxW: best.boxW,
    boxH: best.boxH,
    rotated: best.rotated,
  }
}

export function purchaseSheetDimension(value) {
  if (value <= 0) return 0
  return Math.ceil(value / 5) * 5
}

export function resolvePurchaseSheetSize(recommendedEn, recommendedBoy) {
  let en = purchaseSheetDimension(recommendedEn)
  let boy = purchaseSheetDimension(recommendedBoy)

  if (recommendedEn >= STANDARD_STOCK_EN - SHEET_MARGIN_EN && recommendedEn <= STANDARD_STOCK_EN) {
    en = STANDARD_STOCK_EN
  }

  if (recommendedBoy >= STANDARD_STOCK_BOY - 5 && recommendedBoy <= STANDARD_STOCK_BOY) {
    boy = STANDARD_STOCK_BOY
  }

  if (en === STANDARD_STOCK_EN && boy >= STANDARD_STOCK_BOY - 5 && boy < STANDARD_STOCK_BOY) {
    boy = STANDARD_STOCK_BOY
  }

  return {
    en,
    boy,
    snappedToStock: en === STANDARD_STOCK_EN && boy === STANDARD_STOCK_BOY,
  }
}

export function formatPurchaseSheet(en, boy) {
  return `${en} cm × ${boy} cm`
}

export function buildNestingLayout(sheetW, sheetH, inputBoxW, inputBoxH) {
  const marginEnEach = SHEET_MARGIN_EN / 2
  const marginBoyEach = SHEET_MARGIN_BOY / 2
  const usableW = Math.max(sheetW - SHEET_MARGIN_EN, 0)
  const usableH = Math.max(sheetH - SHEET_MARGIN_BOY, 0)
  const bleedBoxW = inputBoxW + BLEED_PER_SIDE * 2
  const bleedBoxH = inputBoxH + BLEED_PER_SIDE * 2
  const placement = computeBestNesting(usableW, usableH, bleedBoxW, bleedBoxH)

  return {
    ...placement,
    sheetW,
    sheetH,
    usableW,
    usableH,
    marginEnEach,
    marginBoyEach,
    inputBoxW,
    inputBoxH,
    bleedBoxW,
    bleedBoxH,
  }
}

export function calculateBaskiPricing(tekRenkGecis, renkSayisi, siparisAdeti) {
  const toplamGecis = tekRenkGecis * renkSayisi
  const toplamBaski = toplamGecis * siparisAdeti
  const birimBaski = siparisAdeti > 0 ? toplamBaski / siparisAdeti : 0
  return { tekRenkGecis, renkSayisi, toplamGecis, toplamBaski, birimBaski }
}

export function calculateBoxCost(form, lists = {}) {
  const gramajOptions = lists.gramajOptions || DEFAULT_GRAMAJ_OPTIONS
  const renkOptions = lists.renkOptions || DEFAULT_RENK_OPTIONS

  const prices = {
    boya: parseNumber(form.boya),
    icSelefon: parseNumber(form.icSelefon),
    disSelefon: parseNumber(form.disSelefon),
    yaldiz: parseNumber(form.yaldiz),
    gofre: parseNumber(form.gofre),
    kesim: parseNumber(form.kesim),
    paketleme: parseNumber(form.paketleme),
    nakliye: parseNumber(form.nakliye),
    siralama: parseNumber(form.siralama),
    kartonTon: parseNumber(form.kartonTon),
  }

  const urunAdi = String(form.urunAdi || '').trim() || 'Ürün'
  const urunEn = parseNumber(form.urunEn)
  const urunBoy = parseNumber(form.urunBoy)
  const urunYukseklik = parseNumber(form.urunYukseklik)
  const kartonEn = parseNumber(form.kartonEn)
  const kartonBoy = parseNumber(form.kartonBoy)
  const acikEbatBoy = parseNumber(form.acikEbatBoy)
  const acikEbatEn = parseNumber(form.acikEbatEn)
  const gramaj = parseGramajValue(form.gramaj, gramajOptions)
  const siparisAdeti = Math.max(parseNumber(form.siparisAdeti), 0)
  const tekRenkGecis = parseNumber(form.tekRenkGecis)
  const renkSayisi = parseRenkValue(form.renkSecenegi, renkOptions)

  const optimization = optimizeSheetFromBox(acikEbatBoy, acikEbatEn)
  const nesting = buildNestingLayout(kartonEn, kartonBoy, acikEbatBoy, acikEbatEn)
  const kutuPerTabaka = nesting.count
  const tabakaAdedi = kutuPerTabaka > 0 && siparisAdeti > 0 ? Math.ceil(siparisAdeti / kutuPerTabaka) : 0
  const purchaseSheet = resolvePurchaseSheetSize(kartonEn, kartonBoy)
  const purchaseLabel = formatPurchaseSheet(purchaseSheet.en, purchaseSheet.boy)
  const tabakaKarton = sheetCardboardCost(purchaseSheet.boy, purchaseSheet.en, gramaj, prices.kartonTon)
  const birimKarton = kutuPerTabaka > 0 ? tabakaKarton / kutuPerTabaka : 0
  const baskiPricing = calculateBaskiPricing(tekRenkGecis, renkSayisi, siparisAdeti)

  const rows = [
    {
      name: 'Karton',
      total: tabakaKarton * tabakaAdedi,
      unit: birimKarton,
      note: `Satın alma ebatı ${purchaseLabel} tabaka maliyeti ÷ tabakadan çıkan kutu`,
    },
    {
      name: 'Baskı',
      total: baskiPricing.toplamBaski,
      unit: baskiPricing.birimBaski,
      note: `${form.baskiTuru} · ${form.renkSecenegi}`,
    },
    {
      name: 'Boya',
      total: prices.boya * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.boya / kutuPerTabaka : 0,
      note: 'Tabaka boya fiyatı ÷ tabakadan çıkan kutu',
    },
    {
      name: 'İç selefon',
      total: prices.icSelefon * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.icSelefon / kutuPerTabaka : 0,
      note: 'Tabaka iç selefon ÷ tabakadan çıkan kutu',
    },
    {
      name: 'Dış selefon',
      total: prices.disSelefon * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.disSelefon / kutuPerTabaka : 0,
      note: 'Tabaka dış selefon ÷ tabakadan çıkan kutu',
    },
    {
      name: 'Yaldız baskı',
      total: prices.yaldiz * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.yaldiz / kutuPerTabaka : 0,
      note: 'Tabaka yaldız ÷ tabakadan çıkan kutu',
    },
    {
      name: 'Gofre baskı',
      total: prices.gofre * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.gofre / kutuPerTabaka : 0,
      note: 'Tabaka gofre ÷ tabakadan çıkan kutu',
    },
    {
      name: 'Kesim',
      total: prices.kesim * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.kesim / kutuPerTabaka : 0,
      note: 'Tabaka kesim ÷ tabakadan çıkan kutu',
    },
    {
      name: 'Sıralama',
      total: prices.siralama * tabakaAdedi,
      unit: kutuPerTabaka > 0 ? prices.siralama / kutuPerTabaka : 0,
      note: 'Tabaka sıralama ÷ tabakadan çıkan kutu',
    },
    {
      name: 'Paketleme',
      total: prices.paketleme * siparisAdeti,
      unit: prices.paketleme,
      note: 'Kutu başına sabit paketleme',
    },
    {
      name: 'Nakliye',
      total: prices.nakliye,
      unit: siparisAdeti > 0 ? prices.nakliye / siparisAdeti : 0,
      note: 'Toplam nakliye ÷ sipariş adedi',
    },
  ]

  const unitTotal = rows.reduce((sum, row) => sum + row.unit, 0)
  const productionTotal = rows.reduce((sum, row) => sum + row.total, 0)

  return {
    urunAdi,
    urunEn,
    urunBoy,
    urunYukseklik,
    kartonEn,
    kartonBoy,
    acikEbatBoy,
    acikEbatEn,
    gramaj,
    siparisAdeti,
    kutuPerTabaka,
    tabakaAdedi,
    tabakaKarton,
    birimKarton,
    baskiPricing,
    nesting,
    optimization,
    purchaseSheet,
    purchaseLabel,
    rows,
    unitTotal,
    productionTotal,
  }
}

export function loadBoxCostState(variant = 'baklava') {
  const variantMeta = BOX_COST_VARIANTS[variant] || BOX_COST_VARIANTS.baklava
  const storageKey = getBoxCostStorageKey(variant)
  const fallbackKey = storageKey !== BOX_COST_STORAGE_KEY ? BOX_COST_STORAGE_KEY : null
  try {
    let saved = JSON.parse(localStorage.getItem(storageKey) || '{}')
    if (!saved.form && fallbackKey) {
      saved = JSON.parse(localStorage.getItem(fallbackKey) || '{}')
    }
    const baseForm = {
      ...DEFAULT_FORM,
      urunAdi: variantMeta.defaultUrunAdi,
    }
    return {
      form: { ...baseForm, ...(saved.form || {}) },
      lists: {
        kartonTypes: saved.lists?.kartonTypes?.length ? saved.lists.kartonTypes : DEFAULT_KARTON_TYPES,
        gramajOptions: saved.lists?.gramajOptions?.length ? saved.lists.gramajOptions : DEFAULT_GRAMAJ_OPTIONS,
        baskiTypes: saved.lists?.baskiTypes?.length ? saved.lists.baskiTypes : DEFAULT_BASKI_TYPES,
        renkOptions: saved.lists?.renkOptions?.length ? saved.lists.renkOptions : DEFAULT_RENK_OPTIONS,
      },
    }
  } catch {
    return {
      form: {
        ...DEFAULT_FORM,
        urunAdi: variantMeta.defaultUrunAdi,
      },
      lists: {
        kartonTypes: DEFAULT_KARTON_TYPES,
        gramajOptions: DEFAULT_GRAMAJ_OPTIONS,
        baskiTypes: DEFAULT_BASKI_TYPES,
        renkOptions: DEFAULT_RENK_OPTIONS,
      },
    }
  }
}
