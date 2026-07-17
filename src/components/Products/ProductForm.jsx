import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Boxes,
  Download,
  DollarSign,
  ImagePlus,
  Info,
  Link as LinkIcon,
  Maximize2,
  Package,
  Plus,
  Store,
  Tag,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react'
import { unitOptions, vatRates } from '../../data/productsData'
import { OPTION_COLOR_PALETTE, readOptionLists, saveOptionList } from '../../utils/customerMeta'
import {
  calcExclFromIncl,
  calcInclPrice,
  calcMarginFromPrices,
  calcSalesFromMargin,
  formatTL,
  getProductPricing,
} from '../../utils/productPricing'
import { getCustomerDisplay } from '../../utils/customerDisplay'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import NumericInput from './NumericInput'
import PriceFieldWithFx, { FxHint } from './PriceFieldWithFx'
import PriceSummary from './PriceSummary'
import ProductFilesUpload from './ProductFilesUpload'
import ProcessPanelModule from '../DocumentEditor/ProcessPanelModule'
import StoreSalesVisibilityPanel from './StoreSalesVisibilityPanel'
import {
  isReservedPlaceholderLabel,
  mapProcessOptions,
  matchProcessOption,
  optionsToProcessRecord,
  processRecordToOptions,
} from '../DocumentEditor/processPanelUtils'
import { stageColors } from '../DocumentEditor/stageColors'

const DISCOUNT_RATES = [10, 15, 20, 25, 30, 35, 40]

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function normalizeOptionLabel(label) {
  return String(label || '').trim().toLocaleLowerCase('tr-TR')
}

function createOptionId(prefix = 'opt') {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function buildCopyLabel(label, options, fallback = 'Seçenek') {
  const base = `${String(label || fallback).trim()} Kopya`
  const used = new Set((options || []).map((option) => normalizeOptionLabel(option.label)))
  if (!used.has(normalizeOptionLabel(base))) return base
  let index = 2
  while (used.has(normalizeOptionLabel(`${base} ${index}`))) index += 1
  return `${base} ${index}`
}

function createUnitValue(label, units = []) {
  const base = normalizeOptionLabel(label)
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ]+/gi, '-')
    .replace(/^-+|-+$/g, '') || 'birim'
  const used = new Set((units || []).map((unit) => unit.value))
  if (!used.has(base)) return base
  let index = 2
  while (used.has(`${base}-${index}`)) index += 1
  return `${base}-${index}`
}

function normalizeUnitOption(unit, index = 0) {
  const value = unit.value || createUnitValue(unit.label, [])
  return {
    ...unit,
    id: unit.id || value,
    value,
    label: unit.label || value,
    color: unit.color || stageColors[index % stageColors.length],
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function confirmMediaDelete() {
  return window.confirm('Bu görseli/dosyayı silmek istediğinize emin misiniz?')
    && window.confirm('Son onay: Bu görsel/dosya kalıcı olarak silinecek. Devam edilsin mi?')
}

function Panel({ icon: Icon, title, description, children }) {
  return (
    <section className="card">
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-dark-500/50 pb-4">
        <div className="flex items-start gap-3">
          {Icon && (
            <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-dark-700">
              <Icon className="h-4 w-4 text-accent-blue" />
            </div>
          )}
          <div>
            <h3 className="text-base font-semibold tracking-tight text-white">{title}</h3>
            {description && <p className="mt-0.5 text-xs text-gray-500">{description}</p>}
          </div>
        </div>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white">{label}</label>
      {children}
    </div>
  )
}

function MiniButton({ children, onClick, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-[38px] rounded-lg border px-3 text-xs font-semibold transition-colors ${
        danger
          ? 'border-red-500/30 text-red-300 hover:bg-red-500/10'
          : 'border-dark-500/60 text-gray-300 hover:bg-dark-700'
      }`}
    >
      {children}
    </button>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-10 rounded-full transition-colors ${checked ? 'bg-accent-blue' : 'bg-dark-500'}`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
      <span className="text-sm font-medium text-gray-300">{label}</span>
    </label>
  )
}

function DynamicRows({ title, rows = [], columns, onChange, createRow }) {
  function updateRow(id, field, value) {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  function removeRow(id) {
    if (!window.confirm('Bu satırı silmek istediğinize emin misiniz?')) return
    onChange(rows.filter((row) => row.id !== id))
  }

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-700/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <MiniButton onClick={() => onChange([...rows, createRow()])}>Ekle</MiniButton>
      </div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="grid grid-cols-12 items-center gap-2">
            {columns.map((col) => (
              <div key={col.field} className={col.className || 'col-span-3'}>
                {col.type === 'number' ? (
                  <NumericInput
                    value={row[col.field]}
                    onChange={(value) => updateRow(row.id, col.field, value)}
                    prefix={col.prefix}
                    suffix={col.suffix}
                    formatMode={col.prefix === '₺' ? 'price' : 'plain'}
                  />
                ) : (
                  <input
                    value={row[col.field] || ''}
                    onChange={(e) => updateRow(row.id, col.field, e.target.value)}
                    className="form-input"
                  />
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              className="col-span-1 rounded-lg p-2 text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {rows.length === 0 && <p className="py-2 text-xs text-gray-600">Henüz kayıt yok.</p>}
      </div>
    </div>
  )
}

const DEFAULT_COST_COLUMNS = [
  { id: 'extra-1', label: 'Ek Çarpan', field: 'extraFactor1', multiplier: 1 },
]

function getCostColumns(columns = []) {
  return Array.isArray(columns) ? columns : DEFAULT_COST_COLUMNS
}

function createCostColumn() {
  const id = generateId('cost-col')
  return { id, label: 'Yeni Sütun', field: `costColumn_${id.replaceAll('-', '_')}`, multiplier: 1 }
}

function createProductCostRow() {
  return {
    id: generateId('cost'),
    text: '',
    section: '',
    sheetPrice: 0,
    sheetWidth: 0,
    sheetHeight: 0,
    openWidth: 0,
    openHeight: 0,
  }
}

function getProductCostGridTemplate(columns = []) {
  return [
    'minmax(180px, 1.4fr)',
    '140px',
    '120px',
    '110px',
    '110px',
    '110px',
    '110px',
    ...columns.map(() => '110px'),
    '110px',
    '130px',
    '42px',
    '42px',
  ].join(' ')
}

function calculateProductCostRow(row, columns = []) {
  const sheetPrice = Number(row.sheetPrice ?? row.price) || 0
  const sheetWidth = Number(row.sheetWidth) || 0
  const sheetHeight = Number(row.sheetHeight) || 0
  const openWidth = Number(row.openWidth) || 0
  const openHeight = Number(row.openHeight) || 0

  const directCount = sheetWidth && sheetHeight && openWidth && openHeight
    ? Math.floor(sheetWidth / openWidth) * Math.floor(sheetHeight / openHeight)
    : 0
  const rotatedCount = sheetWidth && sheetHeight && openWidth && openHeight
    ? Math.floor(sheetWidth / openHeight) * Math.floor(sheetHeight / openWidth)
    : 0
  const piecesPerSheet = Math.max(directCount, rotatedCount)

  const extraMultiplier = getCostColumns(columns).reduce((result, column) => {
    const rawValue = row[column.field]
    const rowValue = Number(rawValue)
    const columnMultiplier = Number(column.multiplier) || 1
    if (rawValue === '' || rawValue === null || rawValue === undefined || Number.isNaN(rowValue) || !rowValue) return result
    return result * rowValue * columnMultiplier
  }, 1)

  if (piecesPerSheet > 0) {
    const unitCost = (sheetPrice / piecesPerSheet) * extraMultiplier
    return { directCount, rotatedCount, piecesPerSheet, extraMultiplier, unitCost, total: unitCost }
  }

  const fallbackTotal = (Number(row.quantity) || 0) * (Number(row.price) || 0)
  return { directCount, rotatedCount, piecesPerSheet: 0, extraMultiplier, unitCost: fallbackTotal, total: fallbackTotal }
}

function getProductCostTotal(rows = [], columns = []) {
  return rows.reduce((sum, row) => sum + calculateProductCostRow(row, columns).total, 0)
}

function getLaborCostTotal(rows = []) {
  return rows.reduce((sum, row) => sum + (Number(row.total) || Number(row.price) || 0), 0)
}

function CostRowsPanel({ title, description, rows = [], columns = [], onColumnsChange, onChange, createRow, type }) {
  const [activeRowId, setActiveRowId] = useState(null)

  function updateRow(id, field, value) {
    onChange(rows.map((row) => (row.id === id ? { ...row, [field]: value } : row)))
  }

  function insertRowAfter(id) {
    const index = rows.findIndex((row) => row.id === id)
    const nextRow = isProductCost ? createProductCostRow() : createRow()
    if (index === -1) {
      onChange([...rows, nextRow])
      return
    }
    onChange([...rows.slice(0, index + 1), nextRow, ...rows.slice(index + 1)])
  }

  function addRowFromHeader() {
    if (isProductCost) {
      onChange([...rows, createProductCostRow()])
      return
    }
    if (!rows.length) {
      onChange([createRow()])
      return
    }
    insertRowAfter(activeRowId || rows[0].id)
  }


  function removeRow(id) {
    if (!window.confirm('Bu satırı silmek istediğinize emin misiniz?')) return
    onChange(rows.filter((row) => row.id !== id))
  }

  const isProductCost = type === 'product'
  const costColumns = getCostColumns(columns)
  const productCostGridTemplate = getProductCostGridTemplate(costColumns)
  const total = isProductCost ? getProductCostTotal(rows, costColumns) : getLaborCostTotal(rows)

  function updateCostColumn(id, field, value) {
    onColumnsChange?.(costColumns.map((column) => (column.id === id ? { ...column, [field]: value } : column)))
  }

  function removeCostColumn(id) {
    if (!window.confirm('Bu sütunu silmek istediğinize emin misiniz?')) return
    onColumnsChange?.(costColumns.filter((column) => column.id !== id))
  }

  function addCostColumn() {
    onColumnsChange?.([...costColumns, createCostColumn()])
  }

  if (isProductCost) {
    return (
      <div className="rounded-2xl border border-dark-500/50 bg-dark-700/30 p-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-semibold text-white">{title}</h4>
            {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
          </div>
          <div className="flex gap-2">
            <MiniButton onClick={addCostColumn}>Sütun Ekle</MiniButton>
            <MiniButton onClick={addRowFromHeader}>Satır Ekle</MiniButton>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
          <h5 className="text-lg font-bold text-blue-200">Mukavva Hesaplama Alanı</h5>
        </div>

        <div className="mb-4 rounded-xl border border-dark-500/50 bg-dark-800/50 p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-white">Dinamik sütun ve çarpan ayarları</p>
            <span className="text-[12px] text-gray-500">Boş değerler çarpana dahil edilmez.</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {costColumns.map((column) => (
              <div key={column.id} className="grid grid-cols-12 items-center gap-2 rounded-lg bg-dark-700/60 p-2">
                <input
                  value={column.label}
                  onChange={(e) => updateCostColumn(column.id, 'label', e.target.value)}
                  className="form-input col-span-6"
                />
                <div className="col-span-4">
                  <NumericInput
                    value={column.multiplier}
                    onChange={(value) => updateCostColumn(column.id, 'multiplier', value)}
                    suffix="x"
                    formatMode="plain"
                  />
                </div>
                <button type="button" onClick={() => removeCostColumn(column.id)} className="col-span-2 rounded-lg p-2 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-dark-500/40">
          <div className="min-w-[1180px]">
            <div
              className="grid gap-2 border-b border-dark-500/40 bg-dark-800/50 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500"
              style={{ gridTemplateColumns: productCostGridTemplate }}
            >
              <span>Mamül / Malzeme</span>
              <span>Bölüm</span>
              <span>Tabaka Fiyatı</span>
              <span>Tabaka En</span>
              <span>Tabaka Boy</span>
              <span>Açık En</span>
              <span>Açık Boy</span>
              {costColumns.map((column) => <span key={column.id}>{column.label}</span>)}
              <span>Çıkan Adet</span>
              <span className="text-right">Mamül Maliyeti</span>
              <span />
              <span />
            </div>

            {rows.map((row) => {
              const result = calculateProductCostRow(row, costColumns)
              return (
                <div
                  key={row.id}
                  className="grid items-center gap-2 border-b border-dark-500/30 px-3 py-2 last:border-b-0"
                  style={{ gridTemplateColumns: productCostGridTemplate }}
                  onClick={() => setActiveRowId(row.id)}
                  onFocus={() => setActiveRowId(row.id)}
                >
                  <input value={row.text || row.name || ''} onChange={(e) => updateRow(row.id, 'text', e.target.value)} className="form-input" />
                  <input value={row.section || ''} onChange={(e) => updateRow(row.id, 'section', e.target.value)} className="form-input" />
                  <NumericInput value={row.sheetPrice ?? row.price} onChange={(value) => updateRow(row.id, 'sheetPrice', value)} suffix="₺" formatMode="price" />
                  <NumericInput value={row.sheetWidth || 0} onChange={(value) => updateRow(row.id, 'sheetWidth', value)} suffix="mm" formatMode="plain" />
                  <NumericInput value={row.sheetHeight || 0} onChange={(value) => updateRow(row.id, 'sheetHeight', value)} suffix="mm" formatMode="plain" />
                  <NumericInput value={row.openWidth || 0} onChange={(value) => updateRow(row.id, 'openWidth', value)} suffix="mm" formatMode="plain" />
                  <NumericInput value={row.openHeight || 0} onChange={(value) => updateRow(row.id, 'openHeight', value)} suffix="mm" formatMode="plain" />
                  {costColumns.map((column) => (
                    <input
                      key={column.id}
                      value={row[column.field] ?? ''}
                      onChange={(e) => updateRow(row.id, column.field, e.target.value)}
                      className="form-input"
                    />
                  ))}
                  <div className="rounded-lg bg-dark-800/80 px-2 py-2 text-center text-sm font-semibold text-blue-300">
                    {result.piecesPerSheet || '-'}
                  </div>
                  <div className="rounded-lg bg-dark-800/80 px-2 py-2 text-right text-sm font-semibold text-emerald-300">
                    {formatTL(result.total)}
                  </div>
                  <button type="button" onClick={() => insertRowAfter(row.id)} className="rounded-lg p-2 text-emerald-300 hover:bg-emerald-500/10">
                    <Plus className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={() => removeRow(row.id)} className="rounded-lg p-2 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )
            })}

            {rows.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-600">
                Henüz maliyet satırı eklenmedi.
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-dark-500/50 bg-dark-800/70 p-3">
            <p className="text-xs text-gray-500">Formül</p>
            <p className="mt-1 text-sm font-semibold text-white">Tabaka fiyatı / çıkan adet x çarpanlar</p>
          </div>
          <div className="rounded-xl border border-dark-500/50 bg-dark-800/70 p-3">
            <p className="text-xs text-gray-500">Yerleşim hesabı</p>
            <p className="mt-1 text-sm font-semibold text-blue-300">Düz ve döndürülmüş ölçüden en yüksek adet seçilir.</p>
          </div>
          <div className="rounded-xl border border-dark-500/50 bg-dark-800/70 p-3 text-right">
            <p className="text-xs text-gray-500">{title} Toplamı</p>
            <p className="mt-1 text-lg font-semibold text-emerald-300">{formatTL(total)}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-700/30 p-4">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-semibold text-white">{title}</h4>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        <MiniButton onClick={addRowFromHeader}>Satır Ekle</MiniButton>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-2 px-1 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
          <span className={isProductCost ? 'col-span-3' : 'col-span-4'}>İsim</span>
          <span className={isProductCost ? 'col-span-2' : 'col-span-3'}>Durum</span>
          {isProductCost && <span className="col-span-2">Adet</span>}
          <span className="col-span-2">Fiyat</span>
          <span className="col-span-2 text-right">Toplam Tutar</span>
          <span className="col-span-1" />
        </div>

        {rows.map((row) => {
          const rowTotal = isProductCost
            ? (Number(row.quantity) || 0) * (Number(row.price) || 0)
            : Number(row.total) || Number(row.price) || 0

          return (
            <div
              key={row.id}
              className="grid grid-cols-12 items-center gap-2"
              onClick={() => setActiveRowId(row.id)}
              onFocus={() => setActiveRowId(row.id)}
            >
              <div className={isProductCost ? 'col-span-3' : 'col-span-4'}>
                <input
                  value={row.text || row.name || ''}
                  onChange={(e) => updateRow(row.id, 'text', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className={isProductCost ? 'col-span-2' : 'col-span-3'}>
                <input
                  value={row.status || row.measure || ''}
                  onChange={(e) => updateRow(row.id, isProductCost ? 'measure' : 'status', e.target.value)}
                  className="form-input"
                />
              </div>
              {isProductCost && (
                <div className="col-span-2">
                  <NumericInput value={row.quantity} onChange={(value) => updateRow(row.id, 'quantity', value)} formatMode="plain" />
                </div>
              )}
              <div className="col-span-2">
                <NumericInput value={row.price} onChange={(value) => updateRow(row.id, 'price', value)} suffix="₺" formatMode="price" />
              </div>
              <div className="col-span-2 rounded-lg bg-dark-800/80 px-2 py-2 text-right text-sm font-semibold text-emerald-300">
                {formatTL(rowTotal)}
              </div>
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="col-span-1 rounded-lg p-2 text-red-400 hover:bg-red-500/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )
        })}

        {rows.length === 0 && (
          <p className="rounded-xl border border-dashed border-dark-500/50 py-4 text-center text-xs text-gray-600">
            Henüz maliyet satırı eklenmedi.
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-dark-500/50 bg-dark-800/70 px-4 py-3">
        <span className="text-sm font-semibold text-white">{title} Toplamı</span>
        <span className="text-lg font-semibold text-emerald-300">{formatTL(total)}</span>
      </div>
    </div>
  )
}

function Product3DPreview({ product, cartonResult }) {
  const imageUrl = product.image
  const qty = Math.max(1, Number(product.unitQuantities?.koli) || 1)
  const visibleBoxes = Math.min(qty, 15)
  const displayRows = Math.min(cartonResult?.rows || 1, 2)
  const displayColumns = Math.min(cartonResult?.columns || visibleBoxes, Math.ceil(visibleBoxes / displayRows))
  const boxStyle = imageUrl
    ? {
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.18), rgba(15,23,42,0.22)), url(${imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {}

  return (
    <div className="overflow-hidden rounded-2xl border border-dark-500/50 bg-gradient-to-br from-dark-800 via-dark-700 to-dark-800 p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-semibold text-white">3D Koli Yerleşim Önizlemesi</h4>
          <p className="mt-1 text-xs text-gray-500">Ürün görselinden kutu yüzeyi oluşturulur ve koli dizilimi simüle edilir.</p>
        </div>
        <span className="rounded-full bg-accent-blue/10 px-3 py-1 text-[12px] font-semibold text-accent-blue">
          {product.boxDimensions?.orientation === 'dik' ? 'Dik dizilim' : 'Yatay dizilim'}
        </span>
      </div>

      <div
        className="relative min-h-[300px] overflow-hidden rounded-2xl border border-dashed border-dark-500/60 p-5"
        style={{
          background: 'radial-gradient(circle at 45% 25%, rgba(56,189,248,0.18), transparent 35%), linear-gradient(145deg, rgba(15,23,42,0.9), rgba(30,41,59,0.55))',
        }}
      >
        <div
          className="absolute inset-x-10 bottom-10 top-14 rounded-[32px] border border-cyan-300/25 bg-cyan-300/5"
          style={{ boxShadow: 'inset 0 0 55px rgba(56,189,248,0.12), 0 28px 60px rgba(0,0,0,0.35)' }}
        />
        <div className="absolute left-12 right-12 top-14 h-12 -skew-x-12 rounded-t-[28px] border border-white/10 bg-gradient-to-r from-white/10 to-cyan-200/5" />
        <div className="absolute bottom-8 left-14 right-14 h-10 rounded-[50%] bg-black/35 blur-xl" />
        <div className="relative z-10 flex h-full min-h-[245px] items-center justify-center" style={{ perspective: '1100px' }}>
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `repeat(${displayColumns}, minmax(0, 1fr))`,
              transform: 'rotateX(60deg) rotateZ(-38deg) translateY(8px)',
              transformStyle: 'preserve-3d',
            }}
          >
            {Array.from({ length: visibleBoxes }).map((_, index) => (
              <div key={index} className="relative h-12 w-16" style={{ transform: `translateZ(${(index % 3) * 1.5}px)`, transformStyle: 'preserve-3d' }}>
                <div
                  className="absolute inset-0 rounded-md border border-amber-200/40 bg-gradient-to-br from-amber-100 via-amber-300 to-amber-600"
                  style={{ transform: 'translateZ(18px)', boxShadow: '0 18px 22px rgba(0,0,0,0.28)', ...boxStyle }}
                />
                <div
                  className="absolute inset-0 rounded-md border border-amber-900/30 bg-gradient-to-r from-amber-700 to-amber-500"
                  style={{ transform: 'rotateX(90deg) translateZ(18px)', transformOrigin: 'top' }}
                />
                <div
                  className="absolute inset-0 rounded-md border border-amber-900/30 bg-gradient-to-b from-amber-800 to-amber-600"
                  style={{ transform: 'rotateY(90deg) translateZ(32px)', transformOrigin: 'right' }}
                />
                <div
                  className="absolute inset-x-3 top-1/2 h-px bg-amber-900/35"
                  style={{ transform: 'translateZ(19px)' }}
                />
              </div>
            ))}
          </div>
        </div>
        {qty > visibleBoxes && (
          <div className="absolute bottom-3 right-4 rounded-full bg-dark-800/90 px-3 py-1 text-xs font-semibold text-gray-300">
            +{qty - visibleBoxes} ürün daha
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ['Koli En', cartonResult?.width],
          ['Koli Boy', cartonResult?.depth],
          ['Koli Yükseklik', cartonResult?.height],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-dark-800/50 p-3 text-center">
            <p className="text-[12px] text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{value ? `${value} mm` : '-'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function ProductForm({ product, onChange, isNew }) {
  const imageInputRef = useRef(null)
  const instagramInputRef = useRef(null)
  const webInputRef = useRef(null)
  const videoInputRef = useRef(null)
  const dealerHistoryRef = useRef(null)

  const [tagInput, setTagInput] = useState('')
  const [producerSupplierInput, setProducerSupplierInput] = useState('')
  const [categoryInput, setCategoryInput] = useState('')
  const [categoryOpen, setCategoryOpen] = useState(false)
  const [unitInput, setUnitInput] = useState('')
  const [unitOpen, setUnitOpen] = useState(false)
  const [storeSalesOpen, setStoreSalesOpen] = useState(false)
  const [stockAdjustment, setStockAdjustment] = useState({ type: 'in', quantity: 0, note: '' })
  const [previewMedia, setPreviewMedia] = useState(null)
  const [pendingCategoryDeleteId, setPendingCategoryDeleteId] = useState(null)
  const [pendingUnitDeleteId, setPendingUnitDeleteId] = useState(null)
  const [categoryOptions, setCategoryOptions] = useState(() => readOptionLists().productCategory)
  const [units, setUnits] = useState(() => unitOptions.map(normalizeUnitOption))

  useEffect(() => {
    function syncLists() {
      const lists = readOptionLists()
      setCategoryOptions(lists.productCategory)
    }
    window.addEventListener('bach:option-lists-updated', syncLists)
    return () => window.removeEventListener('bach:option-lists-updated', syncLists)
  }, [])

  const { rates, loading: ratesLoading } = useExchangeRates()
  const pricing = getProductPricing(product)
  const currentStock = Number(product.initialStock) || 0
  const firstWarehouse = product.warehouses?.[0]
  const warehouseStock = Number(firstWarehouse?.stock) || currentStock
  const dealerSalesHistory = product.dealerSalesHistory?.length
    ? product.dealerSalesHistory
    : [
        { id: 'preview-1', company: 'Mavi Kutu Bayi', date: '2026-05-28', quantity: 240, unitPrice: pricing.dealerSalesPriceIncl },
        { id: 'preview-2', company: 'Anadolu Ambalaj', date: '2026-05-18', quantity: 500, unitPrice: pricing.dealerSalesPriceIncl * 0.98 },
        { id: 'preview-3', company: 'Ege E-Ticaret', date: '2026-04-30', quantity: 320, unitPrice: pricing.dealerSalesPriceIncl * 1.01 },
      ]

  const totalCalculatedCost = useMemo(() => {
    const materialCost = getProductCostTotal(product.costRows || [], product.costColumns || [])
    const laborCost = getLaborCostTotal(product.laborRows || [])
    return materialCost + laborCost
  }, [product.costRows, product.costColumns, product.laborRows])

  const categoryRecord = useMemo(
    () => optionsToProcessRecord(categoryOptions, product.category),
    [categoryOptions, product.category],
  )

  const unitRecord = useMemo(
    () => optionsToProcessRecord(units.map((unit, index) => normalizeUnitOption(unit, index)), product.salesUnit),
    [units, product.salesUnit],
  )

  const cartonResult = useMemo(() => {
    const qty = Number(product.unitQuantities?.koli) || 0
    const { width, height, depth, orientation, rowMode = 'single' } = product.boxDimensions || {}
    const w = Number(width) || 0
    const h = Number(height) || 0
    const d = Number(depth) || 0
    if (!qty || !w || !h || !d) return null
    const baseW = orientation === 'dik' ? h : w
    const baseH = orientation === 'dik' ? w : h
    const rows = rowMode === 'double' ? 2 : 1
    const columns = Math.ceil(qty / rows)
    const result = {
      width: Math.ceil(baseW * columns + 40),
      depth: Math.ceil(d * rows + 40),
      height: Math.ceil(baseH + 40),
    }
    return {
      ...result,
      rows,
      columns,
      note: `${qty} adet ürün ${orientation} yerleşimde ${rowMode === 'double' ? 'çift sıra' : 'tek sıra'} olarak yaklaşık ${result.width} x ${result.depth} x ${result.height} mm koli gerektirir. Dört tarafta 20 mm boşluk eklendi.`,
    }
  }, [product.unitQuantities, product.boxDimensions])

  const vehicleCapacity = useMemo(() => {
    if (!cartonResult) return 0
    const v = product.vehicleDimensions || {}
    const fitW = Math.floor((Number(v.width) || 0) / cartonResult.width)
    const fitD = Math.floor((Number(v.depth) || 0) / cartonResult.depth)
    const fitH = Math.floor((Number(v.height) || 0) / cartonResult.height)
    return Math.max(0, fitW * fitD * fitH)
  }, [cartonResult, product.vehicleDimensions])

  function update(field, value) {
    onChange({ ...product, [field]: value })
  }

  function patchProduct(patch) {
    onChange({ ...product, ...patch })
  }

  function updateNested(group, field, value) {
    update(group, { ...(product[group] || {}), [field]: value })
  }

  function updatePricing(field, value) {
    const num = Number(value) || 0
    const next = { ...product, [field]: num }
    if (field === 'salesPriceExcl') {
      next.useMarginPricing = false
      next.profitMargin = calcMarginFromPrices(next.costPrice, num)
    } else if (field === 'costPrice') {
      if (next.useMarginPricing) next.salesPriceExcl = calcSalesFromMargin(num, next.profitMargin)
      else next.profitMargin = calcMarginFromPrices(num, next.salesPriceExcl)
    } else if (field === 'profitMargin') {
      next.useMarginPricing = true
      next.salesPriceExcl = calcSalesFromMargin(next.costPrice, num)
    } else if (field === 'purchaseInclManual') {
      next.purchasePriceExcl = calcExclFromIncl(num, next.vatRate)
    } else if (field === 'salesInclManual') {
      next.useMarginPricing = false
      next.salesPriceExcl = calcExclFromIncl(num, next.vatRate)
      next.profitMargin = calcMarginFromPrices(next.costPrice, next.salesPriceExcl)
    }
    onChange(next)
  }

  function persistCategoryOptions(nextOptions) {
    setCategoryOptions(nextOptions)
    saveOptionList('productCategory', nextOptions)
  }

  function addCategory(chosenColor, inputLabel) {
    const value = (inputLabel || categoryInput).trim()
    if (!value || isReservedPlaceholderLabel(value)) return
    const lists = readOptionLists()
    const existing = lists.productCategory
    if (existing.some((item) => normalizeOptionLabel(item.label) === normalizeOptionLabel(value))) return
    const color = chosenColor || stageColors[existing.length % stageColors.length] || OPTION_COLOR_PALETTE[existing.length % OPTION_COLOR_PALETTE.length]
    const nextOptions = [...existing, { id: createOptionId('cat'), label: value, color }]
    persistCategoryOptions(nextOptions)
    update('category', value)
    setCategoryInput('')
  }

  function selectCategory(stage) {
    update('category', stage?.label || '')
  }

  function updateCategoryColor(stage, color) {
    persistCategoryOptions(mapProcessOptions(categoryOptions, stage, (option) => ({ ...option, color })))
  }

  function updateCategoryLabel(stage, label) {
    const clean = label.trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    if (categoryOptions.some((option) => !matchProcessOption(option, stage) && normalizeOptionLabel(option.label) === normalizeOptionLabel(clean))) return
    const nextOptions = mapProcessOptions(categoryOptions, stage, (option) => ({ ...option, label: clean }))
    persistCategoryOptions(nextOptions)
    if (product.category === stage.label) update('category', clean)
  }

  function copyCategory(stage) {
    const sourceIndex = categoryOptions.findIndex((option) => matchProcessOption(option, stage))
    if (sourceIndex < 0) return
    const copy = {
      ...categoryOptions[sourceIndex],
      id: createOptionId('cat'),
      label: buildCopyLabel(stage.label, categoryOptions, 'Kategori'),
      color: stageColors[(categoryOptions.length + 1) % stageColors.length],
    }
    const nextOptions = [...categoryOptions]
    nextOptions.splice(sourceIndex + 1, 0, copy)
    persistCategoryOptions(nextOptions)
    update('category', copy.label)
    setPendingCategoryDeleteId(null)
  }

  function reorderCategories(stages) {
    persistCategoryOptions(processRecordToOptions(stages))
  }

  function removeCategory(value) {
    const nextOptions = categoryOptions.filter((item) => item.label !== value && item.id !== value)
    persistCategoryOptions(nextOptions)
    if (product.category === value) update('category', '')
  }

  function addTag() {
    const tag = tagInput.trim().toLowerCase()
    if (!tag || product.tags.includes(tag)) return
    update('tags', [...product.tags, tag])
    setTagInput('')
  }

  function getProducerSuppliers() {
    const existing = product.producerSuppliers || []
    const legacy = [product.manufacturer, product.supplierAccount].filter(Boolean)
    return [...new Set([...existing, ...legacy])]
  }

  function addProducerSupplier() {
    const value = producerSupplierInput.trim()
    const list = getProducerSuppliers()
    if (!value || list.some((item) => item.toLowerCase() === value.toLowerCase())) return
    patchProduct({ producerSuppliers: [...list, value], manufacturer: '', supplierAccount: '' })
    setProducerSupplierInput('')
  }

  function removeProducerSupplier(value) {
    patchProduct({
      producerSuppliers: getProducerSuppliers().filter((item) => item !== value),
      manufacturer: '',
      supplierAccount: '',
    })
  }

  function addUnit(chosenColor, inputLabel) {
    const label = (inputLabel || unitInput).trim()
    if (!label || isReservedPlaceholderLabel(label) || units.some((unit) => normalizeOptionLabel(unit.label) === normalizeOptionLabel(label))) return
    const value = createUnitValue(label, units)
    const nextUnits = [...units, normalizeUnitOption({ value, label, color: chosenColor }, units.length)]
    setUnits(nextUnits)
    update('unitQuantities', { ...(product.unitQuantities || {}), [value]: 0 })
    setUnitInput('')
  }

  function selectUnit(stage) {
    const unit = stage ? units.find((item) => item.value === stage.id || item.label === stage.label) : null
    patchProduct({ salesUnit: unit?.value || '', purchaseUnit: unit?.value || '' })
  }

  function updateUnitColor(stage, color) {
    setUnits(units.map((unit) => (unit.value === stage.id ? { ...unit, color } : unit)))
  }

  function updateUnitLabel(stage, label) {
    const clean = label.trim()
    if (!clean || isReservedPlaceholderLabel(clean)) return
    if (units.some((unit) => unit.value !== stage.id && normalizeOptionLabel(unit.label) === normalizeOptionLabel(clean))) return
    setUnits(units.map((unit) => (unit.value === stage.id ? { ...unit, label: clean } : unit)))
  }

  function copyUnit(stage) {
    const sourceIndex = units.findIndex((unit) => unit.value === stage.id)
    if (sourceIndex < 0) return
    const source = units[sourceIndex]
    const label = buildCopyLabel(source.label, units, 'Birim')
    const value = createUnitValue(label, units)
    const nextUnit = normalizeUnitOption({ ...source, id: value, value, label, color: stageColors[(units.length + 1) % stageColors.length] }, units.length)
    const nextUnits = [...units]
    nextUnits.splice(sourceIndex + 1, 0, nextUnit)
    setUnits(nextUnits)
    patchProduct({
      salesUnit: value,
      purchaseUnit: value,
      unitQuantities: { ...(product.unitQuantities || {}), [value]: 0 },
    })
    setPendingUnitDeleteId(null)
  }

  function reorderUnits(stages) {
    const nextUnits = stages.map((stage) => {
      const current = units.find((unit) => unit.value === stage.id) || {}
      return normalizeUnitOption({ ...current, value: stage.id, label: stage.label, color: stage.color }, 0)
    })
    setUnits(nextUnits)
  }

  function removeUnit(value) {
    const nextUnits = units.filter((unit) => unit.value !== value)
    const nextQuantities = { ...(product.unitQuantities || {}) }
    delete nextQuantities[value]
    setUnits(nextUnits)
    patchProduct({ unitQuantities: nextQuantities })
  }

  async function handleMediaUpload(field, files) {
    const uploaded = await Promise.all(Array.from(files || []).map(async (file) => ({
      id: generateId(field),
      name: file.name,
      url: await fileToDataUrl(file),
      type: file.type,
      size: file.size,
      file,
    })))
    update(field, [...(product[field] || []), ...uploaded])
  }

  function removeMedia(field, id) {
    if (!confirmMediaDelete()) return
    update(field, (product[field] || []).filter((item) => item.id !== id))
  }

  function downloadMedia(item) {
    const link = document.createElement('a')
    link.href = item.url
    link.download = item.name || 'urun-medya'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function updateWarehouse(id, field, value) {
    update('warehouses', (product.warehouses || []).map((wh) => (wh.id === id ? { ...wh, [field]: value } : wh)))
  }

  function addWarehouse() {
    update('warehouses', [...(product.warehouses || []), { id: generateId('wh'), name: 'Yeni Depo', stock: 0, shelf: '' }])
  }

  function removeWarehouse(id) {
    if (!window.confirm('Bu depoyu silmek istediğinize emin misiniz?')) return
    update('warehouses', (product.warehouses || []).filter((wh) => wh.id !== id))
  }

  function applyStockAdjustment() {
    const quantity = Number(stockAdjustment.quantity) || 0
    if (quantity <= 0) {
      alert('Lütfen geçerli bir stok miktarı girin.')
      return
    }
    const direction = stockAdjustment.type === 'out' ? -1 : 1
    const nextInitialStock = Math.max(0, (Number(product.initialStock) || 0) + direction * quantity)
    const warehouses = product.warehouses?.length
      ? product.warehouses.map((warehouse, index) => (
          index === 0
            ? { ...warehouse, stock: Math.max(0, (Number(warehouse.stock) || 0) + direction * quantity) }
            : warehouse
        ))
      : [{ id: generateId('wh'), name: 'Merkez Depo', stock: nextInitialStock, shelf: product.shelfLocation || '' }]

    patchProduct({ initialStock: nextInitialStock, warehouses })
    setStockAdjustment({ type: 'in', quantity: 0, note: '' })
  }

  function copySocialLink(field) {
    const value = product[field] || ''
    if (!value) {
      alert('Kopyalanacak link yok.')
      return
    }
    navigator.clipboard?.writeText(value)
    alert('Link kopyalandı.')
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-dark-500/50 bg-gradient-to-r from-dark-800 to-dark-700 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent-blue">Stok Yönetimi</p>
            <h2 className="mt-1 text-2xl font-semibold text-white">Yeni Ürün Ekle</h2>
          </div>
          <div className="grid grid-cols-[700px_220px] items-start gap-5">
            <div className="grid grid-rows-[16px_28px_28px] text-right">
              <p className="text-xs font-medium text-gray-500">Ürün adı</p>
              <p className="truncate self-center text-lg font-semibold text-white">{product.name || 'Henüz girilmedi'}</p>
              <p className="self-center truncate text-lg font-semibold text-gray-500">
                Güncel Stok: <span className={currentStock <= (Number(product.criticalStock) || 0) ? 'text-red-400' : 'text-emerald-400'}>{currentStock.toLocaleString('tr-TR')}</span>
                {firstWarehouse?.name ? <span> · {firstWarehouse.name}: <span className="text-blue-300">{warehouseStock.toLocaleString('tr-TR')}</span></span> : null}
                <span> · Stok takibi <span className={product.stockTracking ? 'text-emerald-400' : 'text-red-400'}>{product.stockTracking ? 'açık' : 'kapalı'}</span></span>
              </p>
            </div>
            <div className="grid grid-rows-[16px_28px_28px] text-right">
              <p className="text-xs font-medium text-gray-500">Satış Fiyatı</p>
              <p className="self-center text-lg font-semibold text-gray-500">KDV Hariç: <span className="text-emerald-400">{formatTL(pricing.finalSalesPriceExcl)}</span></p>
              <p className="self-center text-lg font-semibold text-gray-500">KDV Dahil: <span className="text-green-400">{formatTL(pricing.finalSalesPriceIncl)}</span></p>
            </div>
          </div>
        </div>
      </div>

      <Panel icon={Package} title="1. Ürün Bilgileri" description="Ürünün kimlik bilgileri, ana görseli, kategori ve tedarikçi bilgileri">
        <div className="grid grid-cols-12 items-stretch gap-5">
          <div className="col-span-8 flex h-full flex-col gap-4">
            <Field label="Ürün Adı *">
              <input
                value={product.name}
                onChange={(e) => update('name', e.target.value)}
                className="form-input"
              />
            </Field>
            <Field label="Ürün Kodu *">
              <input value={product.stockCode} onChange={(e) => update('stockCode', e.target.value.toUpperCase())} className="form-input" />
            </Field>
            <Field label="Barkod Kodu">
              <input value={product.barcode} onChange={(e) => update('barcode', e.target.value)} className="form-input" />
            </Field>
            <Field label="GTIP Kodu">
              <input value={product.gtipCode} onChange={(e) => update('gtipCode', e.target.value)} className="form-input" />
            </Field>
            <Field label="Birim Seçenekleri">
              <ProcessPanelModule
                activeLabel="Aktif Birim"
                countSuffix="birim tanımlı"
                emptyMessage="Henüz birim eklenmedi."
                addPlaceholder="Yeni birim adı..."
                record={unitRecord}
                isOpen={unitOpen}
                onToggle={() => {
                  setUnitOpen((open) => !open)
                  setPendingUnitDeleteId(null)
                }}
                stageInput={unitInput}
                setStageInput={setUnitInput}
                onAddStage={addUnit}
                onSelectStage={selectUnit}
                onUpdateStageColor={updateUnitColor}
                onUpdateStageLabel={updateUnitLabel}
                onCopyStage={copyUnit}
                onReorderStages={reorderUnits}
                pendingStageDeleteId={pendingUnitDeleteId}
                setPendingStageDeleteId={setPendingUnitDeleteId}
                onRemoveStage={(stage) => removeUnit(stage.id)}
                activeDisplayLabel={units.find((unit) => unit.value === product.salesUnit)?.label || ''}
                emptySelectionLabel="Birim seçmeden devam et"
                compact
              />
            </Field>
            <Field label="Kategori">
              <ProcessPanelModule
                activeLabel="Aktif Kategori"
                countSuffix="kategori tanımlı"
                emptyMessage="Henüz kategori eklenmedi."
                addPlaceholder="Yeni kategori adı..."
                record={categoryRecord}
                isOpen={categoryOpen}
                onToggle={() => {
                  setCategoryOpen((open) => !open)
                  setPendingCategoryDeleteId(null)
                }}
                stageInput={categoryInput}
                setStageInput={setCategoryInput}
                onAddStage={addCategory}
                onSelectStage={selectCategory}
                onUpdateStageColor={updateCategoryColor}
                onUpdateStageLabel={updateCategoryLabel}
                onCopyStage={copyCategory}
                onReorderStages={reorderCategories}
                pendingStageDeleteId={pendingCategoryDeleteId}
                setPendingStageDeleteId={setPendingCategoryDeleteId}
                onRemoveStage={(stage) => removeCategory(stage.label)}
                activeDisplayLabel={product.category}
                emptySelectionLabel="Kategori seçmeden devam et"
                compact
              />
            </Field>
            <Field label="Mağaza Satışında Görünsün mü?">
              <StoreSalesVisibilityPanel
                visible={Boolean(product.storeSalesVisible)}
                onChange={(value) => update('storeSalesVisible', value)}
                isOpen={storeSalesOpen}
                onToggle={() => setStoreSalesOpen((open) => !open)}
              />
            </Field>
            <Field label="Etiketler">
              <div className="flex gap-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="form-input"
                />
                <MiniButton onClick={addTag}>Ekle</MiniButton>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(product.tags || []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 badge-blue">
                    <Tag className="h-3 w-3" /> {tag}
                    <button type="button" onClick={() => update('tags', product.tags.filter((item) => item !== tag))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </Field>
            <Field label="Üretici ve Tedarikçi">
              <div className="flex gap-2">
                <input
                  value={producerSupplierInput}
                  onChange={(e) => setProducerSupplierInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addProducerSupplier())}
                  className="form-input"
                />
                <MiniButton onClick={addProducerSupplier}>Ekle</MiniButton>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {getProducerSuppliers().map((item) => (
                  <span key={item} className="inline-flex items-center gap-1 badge-purple">
                    <Store className="h-3 w-3" /> {item}
                    <button type="button" onClick={() => removeProducerSupplier(item)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                {getProducerSuppliers().length === 0 && <p className="text-xs text-gray-500">Henüz kayıt yok.</p>}
              </div>
            </Field>
            <div className="flex flex-col">
              <label className="mb-2 block text-sm font-semibold text-white">Ürün Notları</label>
              <textarea
                value={product.notes}
                onChange={(e) => update('notes', e.target.value)}
                rows={5}
                className="form-input min-h-[150px] resize-none"
              />
            </div>
          </div>

          <div className="col-span-4 h-full">
            <div className="flex h-full flex-col rounded-2xl border border-dark-500/50 bg-dark-700/30 p-4">
              <h4 className="mb-3 text-sm font-semibold text-white">Ürün Fotoğrafı</h4>
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                onChange={async (e) => {
                  if (!e.target.files?.[0]) return
                  update('image', await fileToDataUrl(e.target.files[0]))
                }}
                className="hidden"
              />
              <div onClick={() => imageInputRef.current?.click()} className="relative h-[420px] cursor-pointer overflow-hidden rounded-xl border-2 border-dashed border-dark-500/50 bg-dark-700/50 hover:border-accent-blue/50 group">
                {product.image ? (
                  <>
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <span className="text-sm text-white">Fotoğrafı Değiştir</span>
                    </div>
                    <button type="button" onClick={(e) => { e.stopPropagation(); update('image', null) }} className="absolute right-2 top-2 rounded-full bg-dark-900/80 p-1 text-gray-400 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                    <ImagePlus className="mb-2 h-10 w-10 opacity-50" />
                    <span className="text-sm font-medium">Fotoğraf Yükle</span>
                    <span className="mt-1 text-xs opacity-60">PNG, JPG</span>
                  </div>
                )}
              </div>
              <div className="mt-auto border-t border-dark-500/50 pt-4">
                <h4 className="mb-3 text-sm font-semibold text-white">Medya Galerisi</h4>
                <div className="grid gap-2">
                  {[
                    ['instagramImages', instagramInputRef, 'Instagram', 'image/*'],
                    ['webImages', webInputRef, 'Web', 'image/*'],
                    ['videos', videoInputRef, 'Video', 'video/*'],
                  ].map(([field, ref, label, accept]) => (
                    <div key={field} className="grid min-h-[68px] place-items-center rounded-xl border border-dark-500/50 bg-dark-700/30 p-2.5 pt-4">
                      <input ref={ref} type="file" multiple accept={accept} onChange={(e) => handleMediaUpload(field, e.target.files)} className="hidden" />
                      <button type="button" onClick={() => ref.current?.click()} className="relative flex min-h-[38px] w-[190px] max-w-full items-center justify-center rounded-lg border border-dashed border-dark-500/60 px-9 py-2 text-center text-xs font-semibold text-gray-400 hover:border-accent-blue/50 hover:text-gray-300">
                        <span className="block w-full text-center">{label} Yükle</span>
                        <Upload className="absolute right-3 h-3.5 w-3.5 text-accent-blue" />
                      </button>
                      <div className="mt-2 grid w-full grid-cols-4 gap-2">
                        {(product[field] || []).map((item) => (
                          <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg bg-dark-700">
                            {field === 'videos' ? <video src={item.url} className="h-full w-full object-cover" /> : <img src={item.url} alt="" className="h-full w-full object-cover" />}
                            <div className="absolute inset-0 hidden items-center justify-center gap-1.5 bg-black/55 group-hover:flex">
                              <button
                                type="button"
                                onClick={() => setPreviewMedia(item)}
                                className="rounded-lg bg-dark-900/90 px-2 py-1 text-[12px] font-semibold text-white hover:bg-accent-blue/80"
                              >
                                <Maximize2 className="mr-1 inline h-3 w-3" /> Büyüt
                              </button>
                              <button
                                type="button"
                                onClick={() => downloadMedia(item)}
                                className="rounded-lg bg-dark-900/90 px-2 py-1 text-[12px] font-semibold text-white hover:bg-emerald-600"
                              >
                                <Download className="mr-1 inline h-3 w-3" /> İndir
                              </button>
                            </div>
                            <button type="button" onClick={() => removeMedia(field, item.id)} className="absolute right-1 top-1 hidden rounded bg-black/70 p-1 text-white group-hover:block">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </Panel>

      <Panel icon={DollarSign} title="2. Ürün Fiyat Bilgileri" description="Maliyet, alış, satış, KDV ve kar marjı">
        <div className="grid grid-cols-5 gap-3">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
            <PriceFieldWithFx label="Vergiler Hariç Ürün Maliyeti" tryValue={product.costPrice} onChange={(v) => updatePricing('costPrice', v)} rates={rates} />
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
            <PriceFieldWithFx label="Vergiler Hariç Alış Fiyatı" tryValue={product.purchasePriceExcl} onChange={(v) => updatePricing('purchasePriceExcl', v)} rates={rates} />
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
            <PriceFieldWithFx label="Vergiler Hariç Satış Fiyatı" tryValue={pricing.salesExcl} onChange={(v) => updatePricing('salesPriceExcl', v)} readOnly={product.useMarginPricing} rates={rates} />
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3">
            <PriceFieldWithFx label="Vergiler Dahil Alış Fiyatı" tryValue={calcInclPrice(product.purchasePriceExcl, product.vatRate)} onChange={(v) => updatePricing('purchaseInclManual', v)} rates={rates} />
          </div>
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
            <PriceFieldWithFx label="Vergiler Dahil Satış Fiyatı" tryValue={pricing.finalSalesPriceIncl} readOnly highlight rates={rates} />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-4 gap-4">
          <Field label="KDV Oranı">
            <select value={product.vatRate} onChange={(e) => update('vatRate', Number(e.target.value))} className="form-input">
              {vatRates.map((rate) => <option key={rate} value={rate}>%{rate}</option>)}
            </select>
          </Field>
          <Field label="Kar Marjı">
            <NumericInput value={product.profitMargin} onChange={(v) => updatePricing('profitMargin', v)} suffix="%" />
          </Field>
          <div className="flex h-full items-center justify-center pt-7"><Toggle checked={product.useMarginPricing} onChange={(v) => update('useMarginPricing', v)} label="Satışı kar marjından belirle" /></div>
          <div className="flex h-full items-center justify-center pt-7"><Toggle checked={product.roundUpFinalPrice} onChange={(v) => update('roundUpFinalPrice', v)} label="Üst taban rakama yuvarla" /></div>
        </div>
        <div className="mt-4 grid grid-cols-2 items-stretch gap-4">
          <PriceSummary product={product} pricing={pricing} rates={rates} loading={ratesLoading} />
          <div className="flex h-full flex-col rounded-2xl border border-dark-500/50 bg-dark-700/30 p-4">
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-white">Bayi Satış Fiyatlandırması</h4>
              <p className="mt-1 text-xs text-gray-500">Bayi indirimi ve kademeli iskonto hesapları</p>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="form-label">Bayiye Özel İndirim</label>
                <NumericInput value={product.dealerDiscount ?? 45} onChange={(v) => update('dealerDiscount', v)} suffix="%" />
              </div>
              <PriceFieldWithFx label="Bayi KDV Hariç" tryValue={pricing.dealerSalesPriceExcl} readOnly rates={rates} />
              <PriceFieldWithFx label="Bayi KDV Dahil" tryValue={pricing.dealerSalesPriceIncl} readOnly highlight rates={rates} />
            </div>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h5 className="text-sm font-semibold text-white">Diğer İndirim Yüzdeleri</h5>
                <span className="text-[12px] text-gray-500">İndirim oranlarına göre bayi fiyatı</span>
              </div>
              <div className="grid grid-cols-7 gap-2">
                {DISCOUNT_RATES.map((rate) => {
                  const excl = pricing.salesExcl * (1 - rate / 100)
                  const incl = calcInclPrice(excl, product.vatRate)
                  return (
                    <div key={rate} className="rounded-2xl border border-dark-500/50 bg-dark-800/40 p-2.5">
                      <div className="mb-2 flex items-center justify-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-accent-orange" />
                        <p className="text-xs font-bold text-accent-orange">%{rate}</p>
                      </div>
                      <div className="space-y-1.5">
                        <div className="rounded-lg bg-dark-700/40 px-2 py-1.5 text-center">
                          <p className="text-[11px] text-gray-500">Hariç</p>
                          <p className="text-[13px] font-semibold text-orange-200">{formatTL(excl)}</p>
                        </div>
                        <div className="rounded-lg bg-dark-700/40 px-2 py-1.5 text-center">
                          <p className="text-[11px] text-gray-500">Dahil</p>
                          <p className="text-[13px] font-semibold text-white">{formatTL(incl)}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="mt-4 flex flex-1 flex-col rounded-2xl border border-dark-500/50 bg-dark-800/40 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h5 className="text-sm font-semibold text-white">Bayi Satış Geçmişi</h5>
                <span className="text-[12px] text-gray-500">Ürün bazlı firma satış kayıtları</span>
              </div>
              <div className="grid flex-1 grid-cols-[1fr_auto] gap-2">
                <div className="flex min-w-0 flex-col">
                  <div className="grid grid-cols-12 gap-2 px-3 pb-2 text-[12px] font-semibold uppercase tracking-wide text-gray-500">
                    <span className="col-span-3">Firma</span>
                    <span className="col-span-2">Tarih</span>
                    <span className="col-span-1 text-right">Adet</span>
                    <span className="col-span-2 text-right">KDV Hariç</span>
                    <span className="col-span-2 text-right">KDV Dahil</span>
                    <span className="col-span-2 text-right">Toplam</span>
                  </div>
                  <div ref={dealerHistoryRef} className="min-h-[220px] flex-1 space-y-2 overflow-y-auto pr-1">
                    {dealerSalesHistory.map((sale) => {
                      const quantity = Number(sale.quantity) || 0
                      const inclPrice = Number(sale.unitPrice) || 0
                      const exclPrice = calcExclFromIncl(inclPrice, product.vatRate)
                      const display = getCustomerDisplay(sale.company)
                      return (
                        <div key={sale.id} className="grid grid-cols-12 items-center gap-2 rounded-xl bg-dark-700/40 px-3 py-2">
                          <p className="col-span-3 truncate text-xs font-semibold text-gray-200">{display.brandShortName}</p>
                          <p className="col-span-2 text-[12px] text-gray-500">{sale.date}</p>
                          <p className="col-span-1 text-right text-xs text-blue-300">{quantity.toLocaleString('tr-TR')}</p>
                          <p className="col-span-2 text-right text-xs text-emerald-300">{formatTL(exclPrice)}</p>
                          <p className="col-span-2 text-right text-xs text-green-400">{formatTL(inclPrice)}</p>
                          <p className="col-span-2 text-right text-xs font-semibold text-white">{formatTL(quantity * inclPrice)}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 self-stretch">
                  <button
                    type="button"
                    onClick={() => dealerHistoryRef.current?.scrollBy({ top: -96, behavior: 'smooth' })}
                    className="rounded-lg border border-dark-500/60 px-2 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    ↑
                  </button>
                  <div className="min-h-16 flex-1 w-1 rounded-full bg-dark-500/60" />
                  <button
                    type="button"
                    onClick={() => dealerHistoryRef.current?.scrollBy({ top: 96, behavior: 'smooth' })}
                    className="rounded-lg border border-dark-500/60 px-2 py-1 text-xs text-gray-400 hover:text-white"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel icon={Boxes} title="4. Stok Takibi" description="Depo, raf ve manuel stok giriş/çıkış işlemleri">
        <div className="mb-4 flex items-center gap-3">
          <Toggle checked={product.stockTracking} onChange={(v) => update('stockTracking', v)} label="Stok takibi yapılsın" />
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
            product.stockTracking
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-red-500/10 text-red-300'
          }`}
          >
            {product.stockTracking ? 'Açık - stok takibi yapılıyor' : 'Kapalı - stok takibi yapılmıyor'}
          </span>
        </div>
        <div className="mb-4 grid grid-cols-2 gap-3">
          <Field label="Stok Tipi">
            <select
              value={product.stockScope || 'general'}
              onChange={(e) => update('stockScope', e.target.value)}
              className="form-input"
            >
              <option value="general">Genel Stok</option>
              <option value="customer">Müşteri Stoğu</option>
            </select>
          </Field>
          <Field label="Müşteri Stoğu Notu">
            <input
              value={product.customerStockCustomerId || ''}
              onChange={(e) => update('customerStockCustomerId', e.target.value)}
              className="form-input"
              placeholder="Cari / müşteri referansı"
              disabled={(product.stockScope || 'general') !== 'customer'}
            />
          </Field>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <Field label="Ana Depo">
              <input value={product.warehouseLocation} onChange={(e) => update('warehouseLocation', e.target.value)} className="form-input" />
            </Field>
            <Field label="Depo Raf Yeri">
              <input value={product.shelfLocation} onChange={(e) => update('shelfLocation', e.target.value)} className="form-input" />
            </Field>
            <Field label="Mevcut / Başlangıç Stok">
              <NumericInput value={product.initialStock} onChange={(v) => update('initialStock', v)} />
            </Field>
            <Field label="Kritik Stok">
              <NumericInput value={product.criticalStock} onChange={(v) => update('criticalStock', v)} />
            </Field>
          </div>
          <div className="rounded-2xl border border-dark-500/50 bg-dark-700/30 p-4">
            <h4 className="mb-3 text-sm font-semibold text-white">Manuel Stok Güncelleme</h4>
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-3">
                <Field label="İşlem">
                  <select value={stockAdjustment.type} onChange={(e) => setStockAdjustment({ ...stockAdjustment, type: e.target.value })} className="form-input">
                    <option value="in">Stok Girişi</option>
                    <option value="out">Stok Çıkışı</option>
                  </select>
                </Field>
              </div>
              <div className="col-span-3">
                <Field label="Miktar">
                  <NumericInput value={stockAdjustment.quantity} onChange={(v) => setStockAdjustment({ ...stockAdjustment, quantity: v })} />
                </Field>
              </div>
              <div className="col-span-4">
                <Field label="Açıklama">
                  <input value={stockAdjustment.note} onChange={(e) => setStockAdjustment({ ...stockAdjustment, note: e.target.value })} className="form-input" />
                </Field>
              </div>
              <div className="col-span-2 flex justify-end">
                <button type="button" onClick={applyStockAdjustment} className="btn-primary h-[38px] w-full text-sm">Uygula</button>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel icon={Info} title="5. Birim, Koli ve Araç Kapasitesi" description="Ambalaj birimleri, koli ölçüsü ve araç yükleme hesabı">
        <div className="space-y-4">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-5 space-y-3 rounded-xl bg-dark-700/30 p-4">
              <h4 className="text-sm font-semibold text-white">Kutu ölçülerini giriniz</h4>
              <Field label="Koliye Sığacak Ürün Adedi">
                <NumericInput value={product.unitQuantities?.koli || 0} onChange={(v) => update('unitQuantities', { ...(product.unitQuantities || {}), koli: v })} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="En (mm)"><NumericInput value={product.boxDimensions?.width || 0} onChange={(v) => updateNested('boxDimensions', 'width', v)} /></Field>
                <Field label="Boy (mm)"><NumericInput value={product.boxDimensions?.depth || 0} onChange={(v) => updateNested('boxDimensions', 'depth', v)} /></Field>
                <Field label="Yükseklik (mm)"><NumericInput value={product.boxDimensions?.height || 0} onChange={(v) => updateNested('boxDimensions', 'height', v)} /></Field>
              </div>
              <p className="rounded-lg bg-dark-800/40 p-3 text-xs text-gray-400">
                Ürün görselindeki kutunun yaklaşık ölçülerini mm olarak girin. Koli ölçüsü bu ürün ölçülerine göre hesaplanır.
              </p>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Kutu koliye nasıl konacak?</label>
                <div className="flex gap-2">
                  {['yatay', 'dik'].map((item) => (
                    <button key={item} type="button" onClick={() => updateNested('boxDimensions', 'orientation', item)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${product.boxDimensions?.orientation === item ? 'border-accent-blue bg-accent-blue/20 text-accent-blue' : 'border-dark-500/50 text-gray-400'}`}>
                      {item === 'yatay' ? 'Yatay' : 'Dik'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-white">Koli içi sıra düzeni</label>
                <div className="flex gap-2">
                  {[
                    ['single', 'Tek sıra'],
                    ['double', 'Çift sıra'],
                  ].map(([value, label]) => (
                    <button key={value} type="button" onClick={() => updateNested('boxDimensions', 'rowMode', value)} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${((product.boxDimensions?.rowMode || 'single') === value) ? 'border-accent-blue bg-accent-blue/20 text-accent-blue' : 'border-dark-500/50 text-gray-400'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {cartonResult && <p className="rounded-lg bg-blue-500/10 p-3 text-xs text-blue-300">{cartonResult.note}</p>}
            </div>
            <div className="col-span-7">
              <Product3DPreview product={product} cartonResult={cartonResult} />
            </div>
          </div>
          <div className="rounded-xl bg-dark-700/30 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-white">Araç Kapasite Hesabı</h4>
              <div className="grid grid-cols-3 gap-2">
                <Field label="Araç En (mm)"><NumericInput value={product.vehicleDimensions?.width || 0} onChange={(v) => updateNested('vehicleDimensions', 'width', v)} /></Field>
                <Field label="Araç Boy (mm)"><NumericInput value={product.vehicleDimensions?.depth || 0} onChange={(v) => updateNested('vehicleDimensions', 'depth', v)} /></Field>
                <Field label="Araç Yük. (mm)"><NumericInput value={product.vehicleDimensions?.height || 0} onChange={(v) => updateNested('vehicleDimensions', 'height', v)} /></Field>
              </div>
              <div className="rounded-lg bg-emerald-500/10 p-3">
                <p className="text-xs text-gray-500">Tahmini araç kapasitesi</p>
                <p className="text-2xl font-semibold text-emerald-400">{vehicleCapacity.toLocaleString('tr-TR')} koli</p>
              </div>
          </div>
        </div>
      </Panel>

      <Panel icon={Info} title="6. Üretim Bilgileri" description="Ürün özellikleri ve üretimde kullanılacak malzemeler">
        <div className="grid grid-cols-2 gap-4">
          <DynamicRows
            title="Ürün Özellikleri"
            rows={product.properties || []}
            onChange={(rows) => update('properties', rows)}
            createRow={() => ({ id: generateId('prop'), name: '', value: '' })}
            columns={[
              { field: 'name', placeholder: 'Özellik', className: 'col-span-5' },
              { field: 'value', placeholder: 'Bilgi', className: 'col-span-6' },
            ]}
          />
          <DynamicRows
            title="Kullanılan Malzemeler"
            rows={product.materials || []}
            onChange={(rows) => update('materials', rows)}
            createRow={() => ({ id: generateId('mat'), name: '', quantity: 0, unit: 'adet' })}
            columns={[
              { field: 'name', placeholder: 'Malzeme adı', className: 'col-span-5' },
              { field: 'quantity', type: 'number', placeholder: 'Miktar', className: 'col-span-3' },
              { field: 'unit', placeholder: 'Birim', className: 'col-span-3' },
            ]}
          />
        </div>
      </Panel>

      <ProductFilesUpload
        files={product.files || []}
        fileLocationNote={product.fileLocationNote}
        onFileLocationNoteChange={(value) => update('fileLocationNote', value)}
        onChange={(files) => update('files', files)}
      />

      <Panel icon={DollarSign} title="7. Maliyet Detayları" description="Gerçek maliyet hesabı ve işçilik satırları">
        <div className="space-y-4">
          <CostRowsPanel
            type="product"
            title="Ürün Maliyet Satırları"
            description="Ürüne ait malzeme, baskı, ambalaj gibi maliyetleri satır satır ekleyin."
            rows={product.costRows || []}
            columns={product.costColumns || []}
            onColumnsChange={(columns) => {
              const cost = getProductCostTotal(product.costRows || [], columns) + getLaborCostTotal(product.laborRows || [])
              patchProduct({ costColumns: columns, costPrice: cost })
            }}
            onChange={(rows) => {
              const cost = getProductCostTotal(rows, product.costColumns || []) + getLaborCostTotal(product.laborRows || [])
              patchProduct({ costRows: rows, costPrice: cost })
            }}
            createRow={() => ({ id: generateId('cost'), text: '', sheetPrice: 0, sheetWidth: 0, sheetHeight: 0, openWidth: 0, openHeight: 0 })}
          />
          <CostRowsPanel
            type="labor"
            title="İşçilik Maliyeti"
            description="Kesim, baskı, montaj, paketleme gibi işçilik kalemlerini ayrı ayrı ekleyin."
            rows={product.laborRows || []}
            onChange={(rows) => {
              const cost = getProductCostTotal(product.costRows || [], product.costColumns || []) + getLaborCostTotal(rows)
              patchProduct({ laborRows: rows, costPrice: cost })
            }}
            createRow={() => ({ id: generateId('labor'), text: '', status: '', price: 0 })}
          />
        </div>
        <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-red-200">Gerçek Maliyet Toplamı</p>
              <p className="mt-1 text-xs text-red-300/80">Ürün maliyeti ve toplam işçilik maliyeti birlikte hesaplanır.</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-red-200">{formatTL(totalCalculatedCost)}</p>
              <FxHint tryValue={totalCalculatedCost} rates={rates} />
            </div>
          </div>
        </div>
      </Panel>

      <Panel icon={LinkIcon} title="8. Web ve Sosyal Linkler" description="Ürün sayfası ve paylaşım kanalları">
        <div className="grid grid-cols-2 gap-3">
          {[
            ['productPageUrl', 'Web sayfa linki'],
            ['instagramUrl', 'Instagram linki'],
            ['facebookUrl', 'Facebook linki'],
            ['twitterUrl', 'Twitter / X linki'],
            ['tiktokUrl', 'TikTok linki'],
            ['linkedinUrl', 'LinkedIn linki'],
          ].map(([field, label]) => (
            <Field key={field} label={label}>
              <div className="flex gap-2">
                <input value={product[field] || ''} onChange={(e) => update(field, e.target.value)} className="form-input" />
                <MiniButton onClick={() => copySocialLink(field)}>Kopyala</MiniButton>
              </div>
            </Field>
          ))}
        </div>
        <div className="mt-4">
          <Field label="Instagram / Reel Açıklamaları">
            <textarea value={product.instagramNote} onChange={(e) => update('instagramNote', e.target.value)} rows={3} className="form-input resize-none" />
          </Field>
        </div>
      </Panel>

      {previewMedia && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-6" onClick={() => setPreviewMedia(null)}>
          <div className="relative max-h-[88vh] w-full max-w-5xl rounded-2xl border border-dark-500/60 bg-dark-900 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-white">{previewMedia.name || 'Medya önizleme'}</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => downloadMedia(previewMedia)} className="rounded-lg border border-dark-500/60 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white">
                  <Download className="mr-1 inline h-3.5 w-3.5" /> İndir
                </button>
                <button type="button" onClick={() => setPreviewMedia(null)} className="rounded-lg border border-dark-500/60 p-2 text-gray-300 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex max-h-[76vh] items-center justify-center overflow-hidden rounded-xl bg-black/40">
              {previewMedia.type?.startsWith('video') ? (
                <video src={previewMedia.url} controls className="max-h-[76vh] w-full object-contain" />
              ) : (
                <img src={previewMedia.url} alt={previewMedia.name || ''} className="max-h-[76vh] w-full object-contain" />
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
