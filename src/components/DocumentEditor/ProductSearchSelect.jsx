import { useEffect, useRef, useState } from 'react'
import SearchInput from '../Common/SearchInput'
import ConfirmModal from '../Common/ConfirmModal'
import { getCatalogProducts } from '../../utils/productCatalog'
import { formatTL } from '../../utils/productPricing'
import {
  getProductCustomerMismatchMessage,
  rankCatalogProductsForCustomer,
} from '../../utils/productCustomerCompatibility'

const COMPATIBILITY_BADGES = {
  linked: 'bg-blue-500/10 text-blue-600',
  general: 'bg-emerald-500/10 text-emerald-600',
  unknown: 'bg-amber-500/10 text-amber-600',
  mismatch: 'bg-rose-500/10 text-rose-600',
}

const COMPATIBILITY_LABELS = {
  linked: 'Müşteriye özel',
  general: 'Genel',
  unknown: 'Müşteri seçin',
  mismatch: 'Uyumsuz',
}

export default function ProductSearchSelect({
  item,
  onSelect,
  onTextChange,
  customerId = '',
  customerLabel = '',
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [catalogProducts, setCatalogProducts] = useState(() => getCatalogProducts())
  const [pendingProduct, setPendingProduct] = useState(null)
  const pickerRef = useRef(null)
  const query = typeof item.product === 'string' ? item.product : item.product?.name || ''
  const rankedProducts = rankCatalogProductsForCustomer(catalogProducts, customerId, query)

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
    if (!isOpen) return undefined

    function handleOutsideClick(event) {
      if (!pickerRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

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
            onTextChange(event.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Ürün adı, ürün kodu veya barkod ara..."
        />
        {isOpen && (
          <div className="absolute left-0 right-0 top-11 z-40 rounded-2xl border border-dark-500 bg-dark-900 p-2 shadow-card">
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {rankedProducts.map(({ product, compatibility }) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => selectProduct(product, compatibility)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-blue-500/15"
                >
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-bold text-white">{product.name}</p>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-black ${COMPATIBILITY_BADGES[compatibility.status]}`}
                      >
                        {COMPATIBILITY_LABELS[compatibility.status]}
                      </span>
                    </div>
                    <p className="truncate text-[13px] font-semibold text-gray-500">
                      {product.category || 'Stok'} ·{' '}
                      {product.stockCode || product.productCode || 'Kod yok'} · Barkod:{' '}
                      {product.barcode || 'Yok'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-[12px] font-black text-emerald-300">
                    KDV hariç {formatTL(product.salesPriceExcl || product.purchasePriceExcl || 0)}
                  </span>
                </button>
              ))}
              {rankedProducts.length === 0 && (
                <div className="rounded-xl border border-dashed border-dark-500/70 px-3 py-4 text-center text-xs font-semibold text-gray-500">
                  Stok ürün/hizmet listesinde eşleşen kayıt yok.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <ConfirmModal
        open={Boolean(pendingProduct)}
        title="Ürün Müşteriyle Uyumlu Değil"
        description={
          pendingProduct
            ? getProductCustomerMismatchMessage(pendingProduct, customerLabel || 'seçili müşteri')
            : ''
        }
        confirmLabel="Yine de Ekle"
        cancelLabel="Vazgeç"
        tone="warning"
        onConfirm={() => {
          if (pendingProduct) commitProduct(pendingProduct)
          setPendingProduct(null)
        }}
        onCancel={() => setPendingProduct(null)}
      />
    </>
  )
}
