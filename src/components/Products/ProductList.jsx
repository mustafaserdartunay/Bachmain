import { Search, Plus, Package } from 'lucide-react'
import { formatTL, getProductPricing } from '../../utils/productPricing'

export default function ProductList({
  products,
  selectedId,
  onSelect,
  onNew,
  searchQuery,
  onSearchChange,
}) {
  const filtered = products.filter((p) => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.stockCode.toLowerCase().includes(q) ||
      p.barcode.includes(q) ||
      p.category.toLowerCase().includes(q)
    )
  })

  return (
    <div className="card h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Hizmet & Ürünler</h3>
        <button
          onClick={onNew}
          className="btn-primary flex items-center gap-1 px-2.5 py-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Yeni
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          type="text"
          placeholder="Ara..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full bg-dark-700 border border-dark-500/50 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-accent-blue/50"
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
        {filtered.map((product) => {
          const pricing = getProductPricing(product)
          const isActive = selectedId === product.id
          return (
            <button
              key={product.id}
              onClick={() => onSelect(product.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-accent-blue/15 border border-accent-blue/30'
                  : 'hover:bg-dark-700/70 border border-transparent'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-dark-600 flex items-center justify-center shrink-0">
                  {product.image ? (
                    <img src={product.image} alt="" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <Package className="w-4 h-4 text-gray-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium truncate ${isActive ? 'text-accent-blue' : 'text-gray-200'}`}>
                    {product.name}
                  </p>
                  <p className="text-[10px] text-gray-500">{product.stockCode}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{product.category}</span>
                    <span className="text-xs font-medium text-white">{formatTL(pricing.finalSalesPriceIncl)}</span>
                  </div>
                </div>
              </div>
            </button>
          )
        })}

        {filtered.length === 0 && (
          <p className="text-center text-xs text-gray-500 py-8">Ürün bulunamadı</p>
        )}
      </div>

      <p className="text-[10px] text-gray-600 text-center mt-3 pt-3 border-t border-dark-500/30">
        {filtered.length} ürün / hizmet
      </p>
    </div>
  )
}
