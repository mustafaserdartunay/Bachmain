import { useEffect, useMemo, useState } from 'react'
import { Calculator, PackageCheck, Save } from 'lucide-react'
import EditableDropdownPill from '../../components/EditableDropdownPill'
import {
  BOX_COST_VARIANTS,
  DEFAULT_PRICE_FIELDS,
  SHEET_MARGIN_BOY,
  SHEET_MARGIN_EN,
  STANDARD_STOCK_BOY,
  STANDARD_STOCK_EN,
  BLEED_PER_SIDE,
  calculateBoxCost,
  formatCm,
  formatMoney,
  formatNumber,
  formatPurchaseSheet,
  getBoxCostStorageKey,
  loadBoxCostState,
  optimizeSheetFromBox,
} from '../../utils/boxCostCalculator'

const PILL_CLASS =
  'flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-dark-500/50 bg-dark-700 px-3 text-xs font-bold transition-colors hover:bg-dark-700/80'

function Field({ label, value, onChange, suffix = '', type = 'text', readOnly = false }) {
  return (
    <label className="block">
      <span className="form-label">{label}</span>
      <div className="relative">
        <input
          type={type}
          value={value}
          readOnly={readOnly}
          onChange={(event) => onChange(event.target.value)}
          className={`form-input h-10 text-sm ${suffix ? 'pr-12' : ''} ${readOnly ? 'bg-dark-900/50 text-gray-400' : ''}`}
        />
        {suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500">
            {suffix}
          </span>
        ) : null}
      </div>
    </label>
  )
}

function ComputedField({ label, value, unit }) {
  return (
    <div className="rounded-xl border border-dark-500/40 bg-dark-900/45 px-3 py-2">
      <p className="text-[12px] font-black uppercase tracking-wider text-gray-500">{label}</p>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <p className="text-sm font-black text-blue-300">{value}</p>
        <span className="text-[12px] font-semibold text-gray-500">{unit}</span>
      </div>
    </div>
  )
}

function NestingPreview({ layout, optimization }) {
  if (!layout || layout.count === 0) {
    return (
      <div className="rounded-2xl border border-dark-500/45 bg-dark-900/50 p-4 text-center text-xs font-semibold text-gray-500">
        Karton ve açık ebat girildiğinde yerleşim otomatik hesaplanır.
      </div>
    )
  }

  const dispSheetW = layout.sheetH
  const dispSheetH = layout.sheetW
  const marginX = layout.marginBoyEach
  const marginY = layout.marginEnEach
  const usableW = layout.usableH
  const usableH = layout.usableW
  const maxWidth = 520
  const scale = maxWidth / dispSheetW
  const svgW = dispSheetW * scale
  const svgH = dispSheetH * scale
  const mX = marginX * scale
  const mY = marginY * scale
  const uW = usableW * scale
  const uH = usableH * scale
  const boxW = layout.boxH * scale
  const boxH = layout.boxW * scale
  const bleedInset = BLEED_PER_SIDE * scale
  const cutW = (layout.rotated ? layout.inputBoxW : layout.inputBoxH) * scale
  const cutH = (layout.rotated ? layout.inputBoxH : layout.inputBoxW) * scale

  const boxes = []
  for (let col = 0; col < layout.cols; col += 1) {
    for (let row = 0; row < layout.rows; row += 1) {
      const x = mX + row * boxW
      const y = mY + col * boxH
      const index = col * layout.rows + row + 1
      boxes.push(
        <g key={`${col}-${row}`}>
          <rect x={x} y={y} width={boxW} height={boxH} rx="4" fill="rgba(59,130,246,0.12)" stroke="rgba(96,165,250,0.45)" />
          <rect x={x + bleedInset} y={y + bleedInset} width={Math.max(cutW, 0)} height={Math.max(cutH, 0)} rx="3" fill="rgba(16,185,129,0.18)" stroke="rgba(52,211,153,0.5)" />
          <text x={x + boxW / 2} y={y + boxH / 2} textAnchor="middle" dominantBaseline="middle" className="fill-gray-300 text-[12px] font-bold">{index}</text>
        </g>,
      )
    }
  }

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full rounded-2xl border border-dark-500/45 bg-dark-900/60">
        <rect x="1" y="1" width={svgW - 2} height={svgH - 2} rx="8" fill="rgba(15,23,42,0.35)" stroke="rgba(71,85,105,0.45)" />
        <rect x={mX} y={mY} width={uW} height={uH} fill="rgba(30,41,59,0.55)" stroke="rgba(100,116,139,0.35)" />
        {boxes}
      </svg>
      <div className="grid gap-2 text-[13px] text-gray-500 sm:grid-cols-2">
        <p>Stok üst limit: {formatCm(STANDARD_STOCK_EN)} × {formatCm(STANDARD_STOCK_BOY)}</p>
        <p>Önerilen karton: {formatCm(layout.sheetW)} × {formatCm(layout.sheetH)}</p>
        <p>Baskı payı: En -{formatCm(SHEET_MARGIN_EN)}, Boy -{formatCm(SHEET_MARGIN_BOY)}</p>
        <p>Baskı alanı: {formatCm(layout.usableW)} × {formatCm(layout.usableH)}</p>
        {optimization && (optimization.sheetEn < STANDARD_STOCK_EN || optimization.sheetBoy < STANDARD_STOCK_BOY) ? (
          <p className="sm:col-span-2 text-emerald-300/90">
            Fire tasarrufu: {formatCm(STANDARD_STOCK_EN)}×{formatCm(STANDARD_STOCK_BOY)} yerine {formatCm(optimization.sheetEn)}×{formatCm(optimization.sheetBoy)}
          </p>
        ) : null}
      </div>
    </div>
  )
}

export default function ProductCostCalculatorPage({ variant = 'baklava' }) {
  const variantMeta = BOX_COST_VARIANTS[variant] || BOX_COST_VARIANTS.baklava
  const [{ form, lists }, setState] = useState(() => loadBoxCostState(variant))
  const [activeMenu, setActiveMenu] = useState(null)

  useEffect(() => {
    localStorage.setItem(getBoxCostStorageKey(variant), JSON.stringify({ form, lists }))
  }, [form, lists, variant])

  useEffect(() => {
    if (!activeMenu) return undefined
    const close = () => setActiveMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [activeMenu])

  function updateForm(key, value) {
    setState((current) => ({
      ...current,
      form: { ...current.form, [key]: value },
    }))
  }

  function updateList(key, nextOptions) {
    setState((current) => ({
      ...current,
      lists: { ...current.lists, [key]: nextOptions },
    }))
  }

  useEffect(() => {
    const boxEn = Number(form.acikEbatBoy)
    const boxBoy = Number(form.acikEbatEn)
    if (!boxEn || !boxBoy) return
    const optimized = optimizeSheetFromBox(boxEn, boxBoy)
    setState((current) => ({
      ...current,
      form: {
        ...current.form,
        kartonEn: String(optimized.sheetEn),
        kartonBoy: String(optimized.sheetBoy),
      },
    }))
  }, [form.acikEbatBoy, form.acikEbatEn])

  const result = useMemo(() => calculateBoxCost(form, lists), [form, lists])

  const quickSummary = [
    { label: 'Ürün', value: result.urunAdi },
    { label: 'Ürün ölçüsü', value: `${formatNumber(result.urunEn, 0)} × ${formatNumber(result.urunBoy, 0)} × ${formatNumber(result.urunYukseklik, 0)} mm` },
    { label: 'Karton ebatı', value: `${formatNumber(result.kartonEn, 1)} × ${formatNumber(result.kartonBoy, 1)} cm` },
    { label: 'Açık ebat', value: `${result.acikEbatBoy} × ${result.acikEbatEn} cm` },
    { label: 'Karton cinsi', value: form.kartonCinsi },
    { label: 'Gramaj', value: `${formatNumber(result.gramaj, 0)} gr` },
    { label: 'Baskı', value: `${form.baskiTuru} · ${form.renkSecenegi}` },
    { label: 'Tabakadan çıkan', value: `${formatNumber(result.kutuPerTabaka, 0)} adet` },
    { label: 'Gerekli tabaka', value: `${formatNumber(result.tabakaAdedi, 0)} adet` },
    { label: 'Birim maliyet', value: formatMoney(result.unitTotal), accent: true },
  ]

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.25em] text-blue-300">Ambalaj Maliyet Aracı · {variantMeta.badge}</p>
            <h1 className="mt-2 text-2xl font-black uppercase tracking-wide text-white">{variantMeta.title}</h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold text-gray-500">
              {variantMeta.subtitle}
            </p>
          </div>
          <div className="rounded-2xl border border-blue-500/25 bg-blue-500/10 px-5 py-3 text-right">
            <p className="text-[12px] font-black uppercase tracking-wider text-blue-300">Birim maliyet</p>
            <p className="mt-1 text-2xl font-black text-white">{formatMoney(result.unitTotal)}</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">{result.urunAdi} · {formatNumber(result.siparisAdeti, 0)} kutu</p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-dark-500/45 bg-dark-800/65 p-4 shadow-card">
          <div className="flex items-center gap-2 text-blue-300"><PackageCheck className="h-4 w-4" /><span className="text-xs font-black uppercase text-gray-500">Tabaka karton</span></div>
          <p className="mt-3 text-2xl font-black text-white">{formatMoney(result.tabakaKarton)}</p>
        </div>
        <div className="rounded-2xl border border-dark-500/45 bg-dark-800/65 p-4 shadow-card">
          <div className="flex items-center gap-2 text-emerald-300"><Calculator className="h-4 w-4" /><span className="text-xs font-black uppercase text-gray-500">Toplam üretim</span></div>
          <p className="mt-3 text-2xl font-black text-white">{formatMoney(result.productionTotal)}</p>
        </div>
        <div className="rounded-2xl border border-dark-500/45 bg-dark-800/65 p-4 shadow-card">
          <div className="flex items-center gap-2 text-purple-300"><PackageCheck className="h-4 w-4" /><span className="text-xs font-black uppercase text-gray-500">Tabakadan çıkan</span></div>
          <p className="mt-3 text-2xl font-black text-white">{formatNumber(result.kutuPerTabaka, 0)} adet</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 shadow-card">
          <div className="flex items-center gap-2 text-emerald-300"><Save className="h-4 w-4" /><span className="text-xs font-black uppercase text-gray-500">Birim maliyet</span></div>
          <p className="mt-3 text-2xl font-black text-emerald-300">{formatMoney(result.unitTotal)}</p>
        </div>
      </div>

      <section className="rounded-3xl border border-dark-500/50 bg-dark-800/65 p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">Ürün / Karton Bilgileri</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Ürün ölçüsü bilgi amaçlıdır; hesaplamalar açık ebat üzerinden yapılır.</p>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Ürün Bilgisi</h3>
              <span className="rounded-lg bg-dark-700/70 px-2 py-1 text-[12px] font-black uppercase text-gray-500">Sadece bilgi</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Ürün adı" value={form.urunAdi} onChange={(value) => updateForm('urunAdi', value)} />
              <Field label="En" value={form.urunEn} onChange={(value) => updateForm('urunEn', value)} suffix="mm" />
              <Field label="Boy" value={form.urunBoy} onChange={(value) => updateForm('urunBoy', value)} suffix="mm" />
              <Field label="Yükseklik" value={form.urunYukseklik} onChange={(value) => updateForm('urunYukseklik', value)} suffix="mm" />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Karton ebat bilgisi</h3>
              <span className="rounded-lg bg-blue-500/10 px-2 py-1 text-[12px] font-black uppercase text-blue-300">Otomatik önerilir</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="En" value={form.kartonEn} onChange={(value) => updateForm('kartonEn', value)} suffix="cm" />
              <Field label="Boy" value={form.kartonBoy} onChange={(value) => updateForm('kartonBoy', value)} suffix="cm" />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wide text-gray-400">Açık Ebat</h3>
              <span className="rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-black uppercase text-emerald-300">Hesaplama için kullanılır</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Kutu açık ebat en" value={form.acikEbatBoy} onChange={(value) => updateForm('acikEbatBoy', value)} suffix="cm" />
              <Field label="Kutu açık ebat boy" value={form.acikEbatEn} onChange={(value) => updateForm('acikEbatEn', value)} suffix="cm" />
              <Field label="Tabakadan çıkan kutu" value={String(result.kutuPerTabaka)} readOnly suffix="adet" />
              <Field label="Sipariş adeti" value={form.siparisAdeti} onChange={(value) => updateForm('siparisAdeti', value)} suffix="adet" />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
              <div className="rounded-2xl border border-dark-500/45 bg-dark-700/25 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wide text-white">Tabaka Yerleşimi</h4>
                  <span className="text-[12px] font-black uppercase text-blue-300">Otomatik hesap</span>
                </div>
                <NestingPreview layout={result.nesting} optimization={result.optimization} />
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-[12px] font-black uppercase tracking-wider text-blue-300">Tabakadan çıkan kutu</p>
                  <p className="mt-2 text-2xl font-black text-white">{formatNumber(result.kutuPerTabaka, 0)} adet</p>
                  <p className="mt-2 text-xs font-semibold text-gray-500">
                    {result.nesting.rotated
                      ? `${result.nesting.cols} × ${result.nesting.rows} yerleşim · kutu döndürüldü`
                      : `${result.nesting.cols} × ${result.nesting.rows} yerleşim`}
                  </p>
                </div>
                <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4">
                  <p className="text-[12px] font-black uppercase tracking-wider text-purple-300">Almam gereken karton ebatı</p>
                  <p className="mt-2 text-lg font-black text-white">{formatPurchaseSheet(result.purchaseSheet.en, result.purchaseSheet.boy)}</p>
                  <p className="mt-2 text-xs font-semibold text-gray-500">Önerilen ölçü 5 cm adımına yukarı yuvarlanır.</p>
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-dark-500/45 bg-dark-700/25 p-4">
              <div className="mb-3">
                <h4 className="text-xs font-black uppercase tracking-wide text-white">Karton Seçimi</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="block">
                  <span className="form-label">Karton cinsi</span>
                  <EditableDropdownPill
                    value={form.kartonCinsi}
                    options={lists.kartonTypes}
                    onOptionsChange={(next) => updateList('kartonTypes', next)}
                    onChange={(value) => updateForm('kartonCinsi', value)}
                    openKey="box-karton"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    buttonClassName={PILL_CLASS}
                  />
                </label>
                <label className="block">
                  <span className="form-label">Gramaj</span>
                  <EditableDropdownPill
                    value={form.gramaj}
                    options={lists.gramajOptions}
                    onOptionsChange={(next) => updateList('gramajOptions', next)}
                    onChange={(value) => updateForm('gramaj', value)}
                    openKey="box-gramaj"
                    activeMenu={activeMenu}
                    setActiveMenu={setActiveMenu}
                    buttonClassName={PILL_CLASS}
                  />
                </label>
                <Field label="Ton fiyatı" value={form.kartonTon} onChange={(value) => updateForm('kartonTon', value)} suffix="₺/ton" />
                <ComputedField label="Tabaka karton" value={formatMoney(result.tabakaKarton)} unit={result.purchaseLabel} />
                <ComputedField label="Kutu karton" value={formatMoney(result.birimKarton)} unit={`/ kutu · ${formatNumber(result.kutuPerTabaka, 0)} adet / tabaka`} />
              </div>

              <div className="mt-5 border-t border-dark-500/30 pt-5">
                <h4 className="mb-3 text-xs font-black uppercase tracking-wide text-white">Baskı</h4>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block">
                    <span className="form-label">Baskı türü</span>
                    <EditableDropdownPill
                      value={form.baskiTuru}
                      options={lists.baskiTypes}
                      onOptionsChange={(next) => updateList('baskiTypes', next)}
                      onChange={(value) => updateForm('baskiTuru', value)}
                      openKey="box-baski"
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      buttonClassName={PILL_CLASS}
                    />
                  </label>
                  <label className="block">
                    <span className="form-label">Renk seçeneği</span>
                    <EditableDropdownPill
                      value={form.renkSecenegi}
                      options={lists.renkOptions}
                      onOptionsChange={(next) => updateList('renkOptions', next)}
                      onChange={(value) => updateForm('renkSecenegi', value)}
                      openKey="box-renk"
                      activeMenu={activeMenu}
                      setActiveMenu={setActiveMenu}
                      buttonClassName={PILL_CLASS}
                    />
                  </label>
                  <Field label="Tek renk geçiş" value={form.tekRenkGecis} onChange={(value) => updateForm('tekRenkGecis', value)} suffix="₺" />
                  <ComputedField label="Toplam geçiş" value={formatMoney(result.baskiPricing.toplamGecis)} unit={`${formatNumber(result.baskiPricing.renkSayisi, 0)} renk × ${formatMoney(result.baskiPricing.tekRenkGecis)}`} />
                  <ComputedField label="Toplam baskı" value={formatMoney(result.baskiPricing.toplamBaski)} unit={`${formatMoney(result.baskiPricing.toplamGecis)} × ${formatNumber(result.siparisAdeti, 0)} adet`} />
                  <ComputedField label="Birim baskı" value={formatMoney(result.baskiPricing.birimBaski)} unit="/ kutu" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-3xl border border-dark-500/50 bg-dark-800/65 p-5 shadow-card">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">Fiyat Ayarları</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Tüm işlem fiyatlarını girin.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEFAULT_PRICE_FIELDS.map((item) => (
              <Field
                key={item.id}
                label={item.label}
                value={form[item.id]}
                onChange={(value) => updateForm(item.id, value)}
                suffix={item.unit}
              />
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-dark-500/50 bg-dark-800/65 p-5 shadow-card">
          <div className="mb-4">
            <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">Hızlı Özet</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">Girilen değerlere göre anlık önizleme.</p>
          </div>
          <div className="space-y-2">
            {quickSummary.map((item) => (
              <div
                key={item.label}
                className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ${
                  item.accent ? 'border border-emerald-500/25 bg-emerald-500/10' : 'bg-dark-700/45'
                }`}
              >
                <span className="font-semibold text-gray-500">{item.label}</span>
                <strong className={`font-black ${item.accent ? 'text-emerald-300' : 'text-white'}`}>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-dark-500/50 bg-dark-800/65 p-5 shadow-card">
        <div className="mb-4">
          <h2 className="text-sm font-black uppercase tracking-wide text-blue-300">Hesaplama Sonuçları</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Tabaka ve birim kutu maliyetleri.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-dark-500/45">
          <table className="min-w-full text-sm">
            <thead className="bg-dark-900/60 text-[12px] font-black uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Kalem</th>
                <th className="px-4 py-3 text-right">Tabaka / Toplam</th>
                <th className="px-4 py-3 text-right">Birim Kutu</th>
                <th className="px-4 py-3 text-left">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.name} className="border-t border-dark-500/30">
                  <td className="px-4 py-3 font-semibold text-white">{row.name}</td>
                  <td className="px-4 py-3 text-right font-black text-gray-300">{formatMoney(row.total)}</td>
                  <td className="px-4 py-3 text-right font-black text-blue-300">{formatMoney(row.unit)}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-gray-500">{row.note}</td>
                </tr>
              ))}
              <tr className="border-t border-blue-500/25 bg-blue-500/10">
                <td className="px-4 py-3 font-black text-blue-200">Toplam</td>
                <td className="px-4 py-3 text-right font-black text-blue-200">{formatMoney(result.productionTotal)}</td>
                <td className="px-4 py-3 text-right font-black text-blue-200">{formatMoney(result.unitTotal)}</td>
                <td className="px-4 py-3 text-xs font-semibold text-blue-300/80">1 kutunun tüm işlemler dahil maliyeti</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-2xl border border-dark-500/40 bg-dark-900/45 p-4 text-xs font-semibold text-gray-500">
          <p>
            Karton formülü:
            <code className="ml-2 rounded bg-dark-800 px-2 py-1 text-gray-300">Boy × En × Gramaj ÷ 10.000 × (Ton fiyatı ÷ 1.000.000)</code>
          </p>
          <p className="mt-2">
            Örnek: 70 × 100 × 400 / 10000 × 0,035 = <strong className="text-white">9,80 ₺</strong> tabaka · 4 kutu → <strong className="text-white">2,45 ₺</strong> birim karton
          </p>
        </div>
      </section>
    </div>
  )
}
