import { Plus, Trash2, Upload, X } from 'lucide-react'
import { DeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'
import NumericInput from '../Products/NumericInput'
import { vatRates } from '../../data/productsData'
import { formatTL } from '../../utils/productPricing'
import { itemTotals } from '../../utils/documentTotals'
import { DocumentField, DocumentFieldLabelSpacer } from './DocumentField'
import ProductSearchSelect from './ProductSearchSelect'
import {
  documentDropdownMenuClass,
  documentItemFieldGapClass,
  documentItemFieldsGridClass,
  documentItemGridClass,
} from './documentItemLayout'

export default function DocumentLineItemRow({
  item,
  openItemMenuId,
  setOpenItemMenuId,
  pendingItemDeleteId,
  setPendingItemDeleteId,
  onUpdate,
  onSelectProduct,
  onEnableOption,
  onDisableOption,
  onUploadImage,
  onRemove,
}) {
  const totals = itemTotals(item)

  return (
    <div className="glass-inset rounded-[20px] p-4">
      <div className={`grid ${documentItemGridClass} ${documentItemFieldGapClass} items-start`}>
        <div className="flex flex-col self-start">
          <label className="mb-2 block shrink-0 text-sm font-semibold text-white">Görsel</label>
          <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-dashed border-blue-500/25 bg-dark-800/40">
            {item.lineImage ? (
              <>
                <img src={item.lineImage} alt="" className="h-full w-full object-cover object-center" />
                <button
                  type="button"
                  onClick={() => onUpdate(item.id, 'lineImage', '')}
                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/90 text-white shadow-lg transition-colors hover:bg-red-400"
                  title="Görseli kaldır"
                >
                  <X className="h-4 w-4" />
                </button>
              </>
            ) : (
              <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 px-3 py-4 text-center transition-colors hover:bg-blue-500/5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-300">
                  <Upload className="h-5 w-5" />
                </span>
                <span className="text-xs font-bold text-gray-400">Görsel Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    onUploadImage(item.id, event.target.files?.[0])
                    event.target.value = ''
                  }}
                />
              </label>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col gap-3 self-stretch">
          <div className={`grid ${documentItemFieldsGridClass} ${documentItemFieldGapClass} items-end`}>
            <DocumentField label="Ürün">
              <ProductSearchSelect
                item={item}
                onSelect={(productName) => onSelectProduct(item.id, productName)}
                onTextChange={(value) => onUpdate(item.id, 'product', value)}
              />
            </DocumentField>
            <DocumentField label="Adet">
              <NumericInput value={item.quantity} onChange={(value) => onUpdate(item.id, 'quantity', value)} />
            </DocumentField>
            <DocumentField label="Birim Fiyat">
              <NumericInput value={item.unitPrice} onChange={(value) => onUpdate(item.id, 'unitPrice', value)} suffix="₺" formatMode="price" />
            </DocumentField>
            <DocumentField label="KDV %">
              <select value={item.vatRate ?? 20} onChange={(event) => onUpdate(item.id, 'vatRate', Number(event.target.value))} className="form-input">
                {vatRates.map((rate) => <option key={rate} value={rate}>{rate}</option>)}
              </select>
            </DocumentField>
            <DocumentField label="Toplam">
              <div className="flex h-[38px] items-center justify-end rounded-xl bg-emerald-500/10 px-3 text-sm font-black tabular-nums text-white">
                {formatTL(totals.total)}
              </div>
            </DocumentField>
            <div className="relative">
              <DocumentFieldLabelSpacer label="İşlem" />
              <div className={`flex h-[38px] items-center ${documentItemFieldGapClass}`} data-document-dropdown>
                <button
                  type="button"
                  onClick={() => setOpenItemMenuId(openItemMenuId === item.id ? null : item.id)}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-blue-500/25 bg-blue-500/10 text-blue-300 transition-colors hover:bg-blue-500/20"
                  title="Satıra alan ekle"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingItemDeleteId(item.id)}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 transition-colors hover:bg-red-500/20"
                  title="Satırı sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                {openItemMenuId === item.id && (
                  <div className={`absolute right-0 top-12 z-30 w-56 ${documentDropdownMenuClass}`}>
                    {[
                      ['showDescription', 'Açıklama ekle'],
                      ['showDiscount', 'İndirim ekle'],
                      ['showExciseTax', 'ÖTV ekle'],
                      ['showAccommodationTax', 'Konaklama vergisi ekle'],
                    ].filter(([field]) => field !== 'showDescription' || !item.showDescription).map(([field, label]) => (
                      <button
                        key={field}
                        type="button"
                        onClick={() => onEnableOption(item.id, field)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-gray-300 transition-colors hover:bg-blue-500/15 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5 text-blue-300" /> {label}
                      </button>
                    ))}
                  </div>
                )}
                {pendingItemDeleteId === item.id && (
                  <DeleteConfirmPopover
                    onConfirm={() => onRemove(item.id)}
                    onCancel={() => setPendingItemDeleteId(null)}
                    className="absolute right-0 top-12 z-40"
                  />
                )}
              </div>
            </div>
          </div>
          {(item.showDiscount || item.showExciseTax || item.showAccommodationTax) && (
            <div className={`grid grid-cols-2 ${documentItemFieldGapClass} gap-y-3`}>
              {item.showDiscount && (
                <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                    <DocumentField label="İndirim %">
                      <NumericInput value={item.discountRate || 0} onChange={(value) => onUpdate(item.id, 'discountRate', value)} />
                    </DocumentField>
                    <button
                      type="button"
                      onClick={() => onDisableOption(item.id, 'showDiscount', { discountRate: 0 })}
                      className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <X className="h-3.5 w-3.5" /> Kaldır
                    </button>
                  </div>
                </div>
              )}
              {item.showExciseTax && (
                <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                    <DocumentField label="ÖTV %">
                      <NumericInput value={item.exciseTaxRate || 0} onChange={(value) => onUpdate(item.id, 'exciseTaxRate', value)} />
                    </DocumentField>
                    <button
                      type="button"
                      onClick={() => onDisableOption(item.id, 'showExciseTax', { exciseTaxRate: 0 })}
                      className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <X className="h-3.5 w-3.5" /> Kaldır
                    </button>
                  </div>
                </div>
              )}
              {item.showAccommodationTax && (
                <div className="rounded-2xl border border-dark-500/45 bg-dark-800/70 p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_92px] items-end gap-3">
                    <DocumentField label="Konaklama Vergisi %">
                      <NumericInput value={item.accommodationTaxRate || 0} onChange={(value) => onUpdate(item.id, 'accommodationTaxRate', value)} />
                    </DocumentField>
                    <button
                      type="button"
                      onClick={() => onDisableOption(item.id, 'showAccommodationTax', { accommodationTaxRate: 0 })}
                      className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
                    >
                      <X className="h-3.5 w-3.5" /> Kaldır
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {item.showDescription && (
            <div className={`mt-auto grid grid-cols-[minmax(0,1fr)_92px] items-end ${documentItemFieldGapClass}`}>
              <DocumentField label="Satır Açıklaması">
                <input
                  value={item.extraDescription ?? item.description ?? ''}
                  onChange={(event) => onUpdate(item.id, 'extraDescription', event.target.value)}
                  placeholder="Bu ürün satırı için ekstra açıklama yazın..."
                  className="form-input"
                />
              </DocumentField>
              <button
                type="button"
                onClick={() => onDisableOption(item.id, 'showDescription', { extraDescription: '' })}
                className="inline-flex h-[38px] items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 text-xs font-black text-red-300 transition-colors hover:bg-red-500/20"
              >
                <X className="h-3.5 w-3.5" /> Kaldır
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function createEmptyDocumentItem(createId) {
  return {
    id: createId('item'),
    product: '',
    description: '',
    extraDescription: '',
    lineImage: '',
    showDescription: true,
    showDiscount: false,
    showExciseTax: false,
    showAccommodationTax: false,
    quantity: 1,
    unitPrice: 0,
    discountRate: 0,
    exciseTaxRate: 0,
    accommodationTaxRate: 0,
    vatRate: 20,
  }
}
