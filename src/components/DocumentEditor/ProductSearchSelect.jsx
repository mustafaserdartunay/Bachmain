import { useEffect, useRef, useState } from 'react'
import SearchInput from '../Common/SearchInput'
import ConfirmModal from '../Common/ConfirmModal'
import { getCatalogProducts } from '../../utils/productCatalog'
import {
  getProductCustomerMismatchMessage,
  rankCatalogProductsForCustomer,
} from '../../utils/productCustomerCompatibility'
import { PAGE_FILTER_MENU_CLASS } from '../../utils/dashboardDesign'

const MS_SEARCH_CLASS =
  'customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]'

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
          className={`${MS_SEARCH_CLASS} !text-center`}
        />
        {showDropdown && (
          <div className={`absolute left-0 right-0 top-11 z-40 ${PAGE_FILTER_MENU_CLASS} p-2`}>
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {rankedProducts.map(({ product, compatibility }) => {
                const code = product.stockCode || product.productCode || product.barcode || ''
                return (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => selectProduct(product, compatibility)}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-transform hover:scale-[1.02]"
                    data-tone="primary"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="customer-name-primary truncate">{product.name}</p>
                      {code ? (
                        <p className="customer-name-secondary truncate">{code}</p>
                      ) : null}
                    </div>
                  </button>
                )
              })}
              {rankedProducts.length === 0 && (
                <div className="rounded-xl border border-dashed border-[var(--search-border)] px-3 py-4 text-center text-[14px] font-normal text-[var(--muted)]">
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
