import { useMemo, useState } from 'react'
import { Search, Package, Pencil, Boxes, Tag, Warehouse, SlidersHorizontal, X, Trash2, ChevronDown } from 'lucide-react'
import { formatPrice, formatTL, getProductPricing } from '../../utils/productPricing'
import { ListInlineDeleteConfirmPopover } from '../Common/ListDeleteConfirmPanel'

export default function ProductsTable({
  products,
  searchQuery,
  onSearchChange,
  onEdit,
  onDelete,
}) {
  const [failedImages, setFailedImages] = useState(() => new Set())
  const [pendingDeleteId, setPendingDeleteId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [filters, setFilters] = useState({
    category: 'all',
    status: 'all',
    minPrice: '',
    maxPrice: '',
  })

  const categories = useMemo(() => {
    return [...new Set(products.map((product) => product.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'tr'))
  }, [products])

  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.stockCode.toLowerCase().includes(q) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.category || '').toLowerCase().includes(q)
    )
  }).filter((product) => {
    const pricing = getProductPricing(product)
    const isCritical = product.stockTracking
      && product.criticalStock > 0
      && product.initialStock <= product.criticalStock
    const price = Number(pricing.finalSalesPriceIncl) || 0
    const minPrice = Number(filters.minPrice) || 0
    const maxPrice = Number(filters.maxPrice) || 0

    if (filters.category !== 'all' && product.category !== filters.category) return false
    if (filters.status === 'stock-tracked' && !product.stockTracking) return false
    if (filters.status === 'service' && product.stockTracking) return false
    if (filters.status === 'critical' && !isCritical) return false
    if (filters.status === 'active' && (!product.stockTracking || isCritical)) return false
    if (minPrice && price < minPrice) return false
    if (maxPrice && price > maxPrice) return false
    return true
  })

  const hasActiveFilters = filters.category !== 'all' || filters.status !== 'all' || filters.minPrice || filters.maxPrice

  function resetFilters() {
    setFilters({ category: 'all', status: 'all', minPrice: '', maxPrice: '' })
  }

  function markImageFailed(id) {
    setFailedImages((current) => new Set(current).add(id))
  }

  const activeCount = filtered.filter((product) => product.stockTracking).length
  const criticalCount = filtered.filter((product) => (
    product.stockTracking
    && product.criticalStock > 0
    && product.initialStock <= product.criticalStock
  )).length
  const totalStock = filtered.reduce((sum, product) => sum + (Number(product.initialStock) || 0), 0)
  const stockTotals = filtered.reduce((totals, product) => {
    const stock = product.stockTracking ? Number(product.initialStock) || 0 : 0
    const pricing = getProductPricing(product)
    return {
      salesExcl: totals.salesExcl + stock * (Number(pricing.finalSalesPriceExcl) || 0),
      salesIncl: totals.salesIncl + stock * (Number(pricing.finalSalesPriceIncl) || 0),
      cost: totals.cost + stock * (Number(product.costPrice) || 0),
    }
  }, { salesExcl: 0, salesIncl: 0, cost: 0 })

  function getPriceDetail(product, pricing) {
    const cost = Number(product.costPrice) || 0
    const profitExcl = (Number(pricing.finalSalesPriceExcl) || 0) - cost
    const profitIncl = (Number(pricing.finalSalesPriceIncl) || 0) - cost
    const dealerProfitExcl = (Number(pricing.dealerSalesPriceExcl) || 0) - cost
    const dealerProfitIncl = (Number(pricing.dealerSalesPriceIncl) || 0) - cost
    const dealerProfitRate = cost ? (dealerProfitExcl / cost) * 100 : 0
    const dealerProfitRateIncl = cost ? (dealerProfitIncl / cost) * 100 : 0

    return {
      cost,
      profitExcl,
      profitIncl,
      dealerProfitExcl,
      dealerProfitIncl,
      dealerProfitRate,
      dealerProfitRateIncl,
    }
  }

  function PriceMiniCard({ label, value, tone = 'text-white', sub, prefix = '', suffix = '₺' }) {
    return (
      <div className="rounded-lg border border-dark-500/40 bg-dark-800/70 px-2 py-1.5">
        <p className="text-[10px] font-medium text-gray-500">{label}</p>
        <p className={`mt-0.5 text-xs font-semibold ${tone}`}>{prefix}{formatPrice(value)}{suffix}</p>
        {sub && <p className="mt-0.5 text-[9px] text-gray-600">{sub}</p>}
      </div>
    )
  }

  function PriceGroup({ title, children, dot = 'bg-blue-400' }) {
    return (
      <div className="rounded-xl border border-dark-500/45 bg-dark-800/45 p-2">
        <div className="mb-1.5 flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          <p className="text-[10px] font-semibold text-gray-300">{title}</p>
        </div>
        <div className="grid grid-cols-2 gap-1.5">{children}</div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="mb-4 grid grid-cols-7 gap-2">
        <div className="rounded-xl border border-dark-500/50 bg-dark-700/40 p-3">
          <p className="text-xs text-gray-500">Toplam Kayıt</p>
          <p className="text-xl font-semibold text-white">{filtered.length}</p>
        </div>
        <div className="rounded-xl border border-dark-500/50 bg-dark-700/40 p-3">
          <p className="text-xs text-gray-500">Stok Takipli</p>
          <p className="text-xl font-semibold text-blue-300">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-dark-500/50 bg-dark-700/40 p-3">
          <p className="text-xs text-gray-500">Toplam Stok</p>
          <p className="text-xl font-semibold text-emerald-300">{totalStock.toLocaleString('tr-TR')}</p>
        </div>
        <div className="rounded-xl border border-dark-500/50 bg-dark-700/40 p-3">
          <p className="text-xs text-gray-500">Kritik Ürün</p>
          <p className="text-xl font-semibold text-red-300">{criticalCount}</p>
        </div>
        <div className="rounded-xl border border-dark-500/50 bg-emerald-500/10 p-3">
          <p className="text-xs text-gray-500">Stok Satış KDV Hariç</p>
          <p className="text-sm font-semibold text-emerald-300">{formatTL(stockTotals.salesExcl)}</p>
        </div>
        <div className="rounded-xl border border-dark-500/50 bg-green-500/10 p-3">
          <p className="text-xs text-gray-500">Stok Satış KDV Dahil</p>
          <p className="text-sm font-semibold text-green-300">{formatTL(stockTotals.salesIncl)}</p>
        </div>
        <div className="rounded-xl border border-dark-500/50 bg-red-500/10 p-3">
          <p className="text-xs text-gray-500">Stok Toplam Maliyeti</p>
          <p className="text-sm font-semibold text-red-300">{formatTL(stockTotals.cost)}</p>
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Ürün adı, stok kodu, barkod veya kategori ara..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-dark-700 border border-dark-500/50 rounded-lg pl-10 pr-4 py-2 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50"
          />
        </div>
        <h3 className="shrink-0 text-sm font-semibold text-white">Detaylı Ürün ve Hizmet Listesi</h3>
      </div>

      <div className="mb-4 rounded-xl border border-dark-500/50 bg-dark-700/25 p-3">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-accent-blue" />
            <h4 className="text-xs font-semibold text-white">Filtreleme</h4>
          </div>
          {hasActiveFilters && (
            <button type="button" onClick={resetFilters} className="flex items-center gap-1 rounded-lg border border-dark-500/60 px-2 py-1 text-[10px] font-semibold text-gray-400 hover:bg-dark-700 hover:text-gray-200">
              <X className="h-3.5 w-3.5" /> Temizle
            </button>
          )}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <div>
            <label className="form-label">Kategori</label>
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="form-input">
              <option value="all">Tüm kategoriler</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Durum</label>
            <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} className="form-input">
              <option value="all">Tüm durumlar</option>
              <option value="active">Aktif stoklu</option>
              <option value="critical">Kritik stok</option>
              <option value="stock-tracked">Stok takibi açık</option>
              <option value="service">Hizmet / stok takibi kapalı</option>
            </select>
          </div>
          <div>
            <label className="form-label">Min. Satış Fiyatı</label>
            <input
              type="number"
              min="0"
              value={filters.minPrice}
              onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">Maks. Satış Fiyatı</label>
            <input
              type="number"
              min="0"
              value={filters.maxPrice}
              onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
              className="form-input"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((product) => {
          const pricing = getProductPricing(product)
          const priceDetail = getPriceDetail(product, pricing)
          const isExpanded = expandedId === product.id
          const isCritical = product.stockTracking
            && product.criticalStock > 0
            && product.initialStock <= product.criticalStock

          return (
            <div
              key={product.id}
              className="rounded-2xl border border-dark-500/40 bg-dark-800/55 transition-all hover:border-accent-blue/30 hover:bg-dark-700/40"
            >
              <div className="grid grid-cols-[74px_130px_minmax(0,1fr)_140px_140px_110px_44px] items-center gap-3 p-3">
                <div className="group/image relative h-14 w-14 overflow-hidden rounded-xl border border-dark-500/50 bg-dark-700 p-1.5">
                  {product.image && !failedImages.has(product.id) ? (
                    <img
                      src={product.image}
                      alt={product.name || 'Ürün görseli'}
                      onError={() => markImageFailed(product.id)}
                      className="h-full w-full rounded-lg object-contain"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center rounded-lg bg-dark-800">
                      <Package className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  {product.image && !failedImages.has(product.id) && (
                    <div className="pointer-events-none absolute left-full top-0 z-50 ml-3 hidden w-72 rounded-2xl border border-dark-500/70 bg-dark-900 p-3 shadow-2xl group-hover/image:block">
                      <img src={product.image} alt={product.name || 'Ürün görseli'} className="max-h-72 w-full rounded-xl object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Stok Kodu</p>
                  <p className="mt-1 truncate text-sm font-black text-accent-blue">{product.stockCode || '—'}</p>
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-white">{product.name || 'İsimsiz ürün'}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{product.category || 'Kategori yok'}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">KDV Hariç</p>
                  <p className="mt-1 text-sm font-black text-emerald-300">{formatTL(pricing.finalSalesPriceExcl)}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">KDV Dahil</p>
                  <p className="mt-1 text-sm font-black text-green-300">{formatTL(pricing.finalSalesPriceIncl)}</p>
                </div>

                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Stok</p>
                  {product.stockTracking ? (
                    <p className={`mt-1 text-sm font-black ${isCritical ? 'text-red-300' : 'text-white'}`}>
                      {Number(product.initialStock || 0).toLocaleString('tr-TR')}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs font-semibold text-gray-500">Takip yok</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : product.id)}
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/50 bg-dark-700/70 text-gray-400 transition-colors hover:bg-dark-600 hover:text-white ${isExpanded ? 'text-accent-blue' : ''}`}
                  title={isExpanded ? 'Detayları kapat' : 'Detayları aç'}
                  aria-expanded={isExpanded}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {isExpanded && (
                <div className="border-t border-dark-500/35 p-4">
                  <div className="grid grid-cols-[190px_1fr] gap-4">
                    <div>
                      <div className="group/image relative h-44 w-44 overflow-hidden rounded-3xl border border-dark-500/50 bg-dark-700 p-3">
                    {product.image && !failedImages.has(product.id) ? (
                      <img
                        src={product.image}
                        alt={product.name || 'Ürün görseli'}
                        onError={() => markImageFailed(product.id)}
                        className="h-full w-full rounded-2xl object-contain transition-transform duration-300 group-hover/image:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-dark-800">
                        <Package className="h-12 w-12 text-gray-500" />
                      </div>
                    )}
                    {product.image && !failedImages.has(product.id) && (
                      <div className="pointer-events-none absolute left-full top-0 z-50 ml-3 hidden w-80 rounded-2xl border border-dark-500/70 bg-dark-900 p-3 shadow-2xl group-hover/image:block">
                        <img src={product.image} alt={product.name || 'Ürün görseli'} className="max-h-80 w-full rounded-xl object-contain" />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 rounded-2xl border border-dark-500/40 bg-dark-700/40 p-2">
                    <div className="mb-2 flex justify-center">
                      {!product.stockTracking ? (
                        <span className="badge-gray">Hizmet</span>
                      ) : isCritical ? (
                        <span className="badge-red">Kritik</span>
                      ) : (
                        <span className="badge-green">Aktif</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onEdit(product.id)}
                        className="flex items-center justify-center gap-1 rounded-xl border border-blue-500/20 bg-blue-500/10 px-2 py-2 text-[10px] font-semibold text-blue-300 transition-colors hover:bg-blue-500/20"
                        title="Düzenle"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Düzenle
                      </button>
                      <div className="relative z-10 flex w-full items-center justify-center" onClick={(event) => event.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setPendingDeleteId(product.id)}
                          className={`flex w-full items-center justify-center gap-1 rounded-xl border border-red-500/20 bg-red-500/10 px-2 py-2 text-[10px] font-semibold text-red-300 transition-colors hover:bg-red-500/20 ${pendingDeleteId === product.id ? 'pointer-events-none invisible' : ''}`}
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Sil
                        </button>
                        {pendingDeleteId === product.id && (
                          <ListInlineDeleteConfirmPopover
                            onConfirm={() => {
                              setPendingDeleteId(null)
                              onDelete?.(product.id)
                            }}
                            onCancel={() => setPendingDeleteId(null)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-xl border border-dark-500/40 bg-dark-700/40 p-2">
                      <p className="line-clamp-2 text-xs font-semibold text-white">{product.name || 'İsimsiz ürün'}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-semibold text-blue-300">
                          <Tag className="h-3 w-3" /> {product.category || 'Kategori yok'}
                        </span>
                        <span className="rounded-full bg-dark-800/80 px-2 py-0.5 text-[9px] font-semibold text-gray-400">{product.salesUnit || 'adet'} birim</span>
                      </div>
                      {(product.tags || []).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {product.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="rounded-md bg-dark-800/70 px-1.5 py-0.5 text-[9px] text-gray-400">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="rounded-xl border border-dark-500/40 bg-dark-700/40 p-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Kod Bilgileri</p>
                      <p className="mt-0.5 text-xs font-semibold text-accent-blue">{product.stockCode || '—'}</p>
                      <p className="text-[10px] text-gray-500">Barkod: {product.barcode || '—'}</p>
                      <p className="text-[10px] text-gray-500">GTIP: {product.gtipCode || '—'}</p>
                    </div>

                    <div className="rounded-xl border border-dark-500/40 bg-dark-700/40 p-2">
                      <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-500">Stok & Depo</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <Boxes className="h-3.5 w-3.5 text-emerald-300" />
                        {product.stockTracking ? (
                          <span className={`text-xs ${isCritical ? 'font-semibold text-red-300' : 'font-semibold text-emerald-300'}`}>
                            {product.initialStock.toLocaleString('tr-TR')} stok
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">Stok takibi kapalı</span>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-gray-500">
                        <Warehouse className="h-3 w-3" /> {product.warehouseLocation || product.warehouses?.[0]?.name || 'Depo yok'}
                      </p>
                      <p className="text-[10px] text-gray-500">Raf: {product.shelfLocation || product.warehouses?.[0]?.shelf || '—'} · Kritik: {product.criticalStock?.toLocaleString?.('tr-TR') || 0}</p>
                    </div>
                  </div>

                  <div className="mt-3 rounded-2xl border border-dark-500/50 bg-dark-700/35 p-3">
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-dark-500/30 pb-1.5">
                      <span className="text-xs font-semibold text-white">Fiyat Özeti</span>
                      <span className="text-[10px] font-medium text-gray-500">Ürün kartındaki fiyat grupları</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <PriceGroup title="Maliyet ve Oran" dot="bg-red-400">
                        <PriceMiniCard label="Maliyet" value={priceDetail.cost} tone="text-red-300" />
                        <PriceMiniCard label="Kar %" value={pricing.profitMargin} tone="text-blue-300" prefix="" suffix="%" />
                      </PriceGroup>
                      <PriceGroup title="Kar" dot="bg-blue-400">
                        <PriceMiniCard label="Vergi Hariç" value={priceDetail.profitExcl} tone="text-blue-300" />
                        <PriceMiniCard label="Vergi Dahil" value={priceDetail.profitIncl} tone="text-cyan-300" />
                      </PriceGroup>
                      <PriceGroup title="Satış Fiyatları" dot="bg-emerald-400">
                        <PriceMiniCard label="KDV Hariç" value={pricing.finalSalesPriceExcl} tone="text-emerald-300" />
                        <PriceMiniCard label="KDV Dahil" value={pricing.finalSalesPriceIncl} tone="text-green-300" />
                      </PriceGroup>
                      <PriceGroup title="Bayi Kar Yüzdesi" dot="bg-fuchsia-400">
                        <PriceMiniCard label="KDV Hariç" value={priceDetail.dealerProfitRate} tone="text-purple-300" prefix="" suffix="%" />
                        <PriceMiniCard label="KDV Dahil" value={priceDetail.dealerProfitRateIncl} tone="text-fuchsia-300" prefix="" suffix="%" />
                      </PriceGroup>
                      <PriceGroup title="Bayi Karları" dot="bg-purple-400">
                        <PriceMiniCard label="Vergi Hariç" value={priceDetail.dealerProfitExcl} tone="text-purple-300" />
                        <PriceMiniCard label="Vergi Dahil" value={priceDetail.dealerProfitIncl} tone="text-fuchsia-300" />
                      </PriceGroup>
                      <PriceGroup title="Bayi Satış" dot="bg-orange-400">
                        <PriceMiniCard label="KDV Hariç" value={pricing.dealerSalesPriceExcl} tone="text-orange-300" />
                        <PriceMiniCard label="KDV Dahil" value={pricing.dealerSalesPriceIncl} tone="text-amber-200" />
                      </PriceGroup>
                      <PriceGroup title="Alış Fiyatları" dot="bg-gray-400">
                        <PriceMiniCard label="KDV Hariç" value={product.purchasePriceExcl || 0} tone="text-gray-300" />
                        <PriceMiniCard label="KDV Dahil" value={pricing.purchaseIncl} tone="text-gray-200" />
                      </PriceGroup>
                      <PriceGroup title="Vergi ve İndirim" dot="bg-violet-400">
                        <PriceMiniCard label="Bayi İnd." value={product.dealerDiscount ?? 0} tone="text-orange-300" prefix="" suffix="%" />
                        <PriceMiniCard label="KDV" value={product.vatRate || 0} tone="text-violet-300" prefix="" suffix="%" />
                      </PriceGroup>
                    </div>
                  </div>
                </div>
              </div>
            </div>
              )}
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-gray-500 text-sm">
          Arama kriterlerine uygun ürün bulunamadı.
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4 pt-3 border-t border-dark-500/30">
        Toplam {filtered.length} ürün / hizmet listeleniyor
      </p>
    </div>
  )
}
