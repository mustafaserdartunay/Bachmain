import { useEffect, useRef, useState } from 'react'
import SearchInput from '../Common/SearchInput'
import { sampleProducts } from '../../data/productsData'
import { formatTL } from '../../utils/productPricing'

export default function ProductSearchSelect({ item, onSelect, onTextChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const pickerRef = useRef(null)
  const query = item.product || ''
  const normalizedQuery = query.trim().toLowerCase()
  const filteredProducts = normalizedQuery
    ? sampleProducts.filter((product) => (
      [product.name, product.stockCode, product.barcode, product.productCode]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    ))
    : sampleProducts

  useEffect(() => {
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  function selectProduct(product) {
    onSelect(product.name)
    setIsOpen(false)
  }

  return (
    <div ref={pickerRef} className="relative">
      <SearchInput
        value={query}
        onChange={(event) => {
          onTextChange(event.target.value)
          setIsOpen(true)
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Ürün adı, ürün kodu veya barkod ara..."
      />
      {isOpen && (
        <div className="absolute left-0 right-0 top-11 z-40 rounded-2xl border border-dark-500 bg-dark-900 p-2 shadow-card">
          <div className="max-h-72 space-y-1 overflow-y-auto">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => selectProduct(product)}
                className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blue-500/15"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{product.name}</p>
                  <p className="truncate text-[13px] font-semibold text-gray-500">
                    {product.stockCode || product.productCode || 'Kod yok'} · Barkod: {product.barcode || 'Yok'}
                  </p>
                </div>
                <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-black text-emerald-300">
                  KDV hariç {formatTL(product.salesPriceExcl || product.purchasePriceExcl || 0)}
                </span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
                Ürün adı, ürün kodu veya barkod ile eşleşen ürün bulunamadı.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
