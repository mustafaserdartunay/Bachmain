import { useEffect, useRef, useState } from 'react'
import SearchInput from '../Common/SearchInput'
import ConfirmModal from '../Common/ConfirmModal'
import { getCatalogProducts } from '../../utils/productCatalog'
import {
  getProductCustomerMismatchMessage,
  rankCatalogProductsForCustomer,
} from '../../utils/productCustomerCompatibility'

export default function ProductSearchSelect({
  item,
  onSelect,
  onTextChange,
  customerId = '',
  customerLabel = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [catalogProducts, setCatalogProducts] = useState(() => getCatalogProducts())
  const [pendingProduct, setPendingProduct] = useState(null)
  const pickerRef = useRef(null)
  const query = typeof item.product === 'string' ? item.product : item.product?.name || ''
  const trimmedQuery = query.trim()
  const rankedProducts = rankCatalogProductsForCustomer(catalogProducts, customerId, query)
  const showDropdown = isOpen && trimmedQuery.length > 0

  useEffect(() => {
    function refreshCatalog() {
      setCatalogProducts(getCatalogProducts())
    }
    refreshCatalog()
    window.addEventListener('storage', refreshCatalog)
    window.addEventListener('bach:products-updated', refreshCatalog)
    window.addEventListener('erlenbox:products-updated', refreshCatalog)
    return () => {
      window.removeEventListener('storage', refreshCatalog)
      window.removeEventListener('bach:products-updated', refreshCatalog)
      window.removeEventListener('erlenbox:products-updated', refreshCatalog)
    }
  }, [])

  useEffect(() => {
    if (!showDropdown) return undefined

    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [showDropdown])

  function commitProduct(product) {
    onSelect(product)
    setIsOpen(false)
  }

  function selectProduct(product, compatibility) {
    if (compatibility.status === 'mismatch') {
      setPendingProduct(product)
      return
    }
    commitProduct(product)
  }

  return (
    <>
      <div ref={pickerRef} className="relative">
        <SearchInput
          value={query}
          onChange={(event) => {
            const next = event.target.value
            onTextChange(next)
            setIsOpen(next.trim().length > 0)
          }}
          onFocus={() => {
            if (trimmedQuery.length > 0) setIsOpen(true)
          }}
          placeholder="Ürün adı, ürün kodu veya barkod ara..."
          className="!text-center"
        />
        {showDropdown && (
          <div className="absolute left-0 right-0 top-11 z-40 rounded-2xl border border-dark-500 bg-dark-900 p-2 shadow-card">
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {rankedProducts.map(({ product, compatibility }) => {
                const code = product.stockCode || product.productCode || product.barcode || ''
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product, compatibility)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blue-500/15"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--ink)]">{product.name}</p>
                      {code ? (
                        <p className="truncate text-[12px] font-medium text-[var(--muted)]">{code}</p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
              {rankedProducts.length === 0 && (
                <div className="rounded-xl px-3 py-4 text-center text-xs font-semibold text-gray-500">
                  Eşleşen ürün bulunamadı.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={Boolean(pendingProduct)}
        title="Uyumsuz ürün"
        description={getProductCustomerMismatchMessage(pendingProduct, customerLabel)}
        confirmLabel="Yine de seç"
        cancelLabel="Vazgeç"
        onConfirm={() => {
          if (pendingProduct) commitProduct(pendingProduct)
          setPendingProduct(null)
        }}
        onCancel={() => setPendingProduct(null)}
      />
    </>
  )
}
