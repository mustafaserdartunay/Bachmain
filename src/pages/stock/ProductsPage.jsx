import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, Plus, ArrowLeft, Trash2, Pencil, CheckCircle2, Send, ChevronDown, Package, Boxes, AlertTriangle, WalletCards } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import ProductsTable from '../../components/Products/ProductsTable'
import ProductForm from '../../components/Products/ProductForm'
import { emptyProduct, sampleProducts } from '../../data/productsData'
import { DeleteTrashButton } from '../../components/Common/ListDeleteConfirmPanel'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import ActivityArchivePanel from '../../components/Common/ActivityArchivePanel'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import { appendActivityEntry } from '../../utils/activityArchiveStore'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import { formatTL, getProductPricing } from '../../utils/productPricing'

const PRODUCT_STORAGE_KEY = 'erlenbox-products'
const PRODUCT_DB_NAME = 'erlenbox-product-storage'
const PRODUCT_DB_STORE = 'products'
const PRODUCT_DB_KEY = 'all-products'

function stripRuntimeFields(value) {
  if (Array.isArray(value)) return value.map(stripRuntimeFields)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== 'file' && key !== 'imageFile')
        .map(([key, item]) => [key, stripRuntimeFields(item)]),
    )
  }
  return value
}

function stripHeavyMedia(value) {
  if (Array.isArray(value)) return value.map(stripHeavyMedia)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => {
        if (key === 'image') return [key, null]
        if (['instagramImages', 'webImages', 'videos', 'gallery', 'files'].includes(key)) return [key, []]
        return [key, stripHeavyMedia(item)]
      }),
    )
  }
  return value
}

function openProductDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB kullanılamıyor'))
      return
    }
    const request = window.indexedDB.open(PRODUCT_DB_NAME, 1)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(PRODUCT_DB_STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function saveProductsToIndexedDb(products) {
  const db = await openProductDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCT_DB_STORE, 'readwrite')
    transaction.objectStore(PRODUCT_DB_STORE).put(products, PRODUCT_DB_KEY)
    transaction.oncomplete = () => {
      db.close()
      resolve()
    }
    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

async function loadProductsFromIndexedDb() {
  const db = await openProductDb()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(PRODUCT_DB_STORE, 'readonly')
    const request = transaction.objectStore(PRODUCT_DB_STORE).get(PRODUCT_DB_KEY)
    request.onsuccess = () => {
      db.close()
      resolve(request.result)
    }
    request.onerror = () => {
      db.close()
      reject(request.error)
    }
  })
}

function cloneProduct(product) {
  const base = {
    ...emptyProduct,
    ...product,
    unitQuantities: {
      ...emptyProduct.unitQuantities,
      ...(product.unitQuantities || {}),
    },
    boxDimensions: {
      ...emptyProduct.boxDimensions,
      ...(product.boxDimensions || {}),
    },
    vehicleDimensions: {
      ...emptyProduct.vehicleDimensions,
      ...(product.vehicleDimensions || {}),
    },
  }

  return {
    ...base,
    tags: [...(base.tags || [])],
    gallery: [...(base.gallery || [])],
    instagramImages: [...(base.instagramImages || [])],
    webImages: [...(base.webImages || [])],
    videos: [...(base.videos || [])],
    properties: (base.properties || []).map((item) => ({ ...item })),
    materials: (base.materials || []).map((item) => ({ ...item })),
    producerSuppliers: [...(base.producerSuppliers || [])],
    costColumns: (base.costColumns || []).map((item) => ({ ...item })),
    costRows: (base.costRows || []).map((item) => ({ ...item })),
    laborRows: (base.laborRows || []).map((item) => ({ ...item })),
    dealerSalesHistory: (base.dealerSalesHistory || []).map((item) => ({ ...item })),
    warehouses: (base.warehouses || []).map((item) => ({ ...item })),
    files: (base.files || []).map((item) => ({ ...item })),
  }
}

function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCT_STORAGE_KEY)
    if (!saved) return sampleProducts.map(cloneProduct)
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return sampleProducts.map(cloneProduct)
    return parsed.map(cloneProduct)
  } catch {
    return sampleProducts.map(cloneProduct)
  }
}

function createNextProductId(products = []) {
  const usedIds = new Set(products.map((product) => product.id).filter(Boolean))
  let index = products.length + 1
  let nextId = `PRD-${String(index).padStart(3, '0')}`
  while (usedIds.has(nextId)) {
    index += 1
    nextId = `PRD-${String(index).padStart(3, '0')}`
  }
  return nextId
}

function Panel({ title, description, children, action }) {
  return (
    <section className="card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">{title}</h2>
          {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export default function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [products, setProducts] = useState(loadProducts)
  const [storageReady, setStorageReady] = useState(false)
  const [view, setView] = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [pendingProductDelete, setPendingProductDelete] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draft, setDraft] = useState(cloneProduct(emptyProduct))
  const [toast, setToast] = useState('')
  const [saveMenuOpen, setSaveMenuOpen] = useState(false)

  const selectedProduct = products.find((p) => p.id === selectedId)
  const isNew = view === 'create'

  const productSummary = useMemo(() => {
    return products.reduce((summary, product) => {
      const stock = product.stockTracking ? Number(product.initialStock) || 0 : 0
      const pricing = getProductPricing(product)
      const isCritical = product.stockTracking
        && Number(product.criticalStock) > 0
        && Number(product.initialStock) <= Number(product.criticalStock)

      return {
        stockTracked: summary.stockTracked + (product.stockTracking ? 1 : 0),
        totalStock: summary.totalStock + stock,
        critical: summary.critical + (isCritical ? 1 : 0),
        salesIncl: summary.salesIncl + stock * (Number(pricing.finalSalesPriceIncl) || 0),
        cost: summary.cost + stock * (Number(product.costPrice) || 0),
      }
    }, {
      stockTracked: 0,
      totalStock: 0,
      critical: 0,
      salesIncl: 0,
      cost: 0,
    })
  }, [products])

  useEffect(() => {
    let cancelled = false
    loadProductsFromIndexedDb()
      .then((saved) => {
        if (!cancelled && Array.isArray(saved)) setProducts(saved.map(cloneProduct))
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setStorageReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!storageReady) return
    const cleanProducts = stripRuntimeFields(products)
    saveProductsToIndexedDb(cleanProducts).catch(() => {
      showToast('Görseller saklanırken tarayıcı alanı yetersiz kaldı.')
    })
    try {
      localStorage.setItem(PRODUCT_STORAGE_KEY, JSON.stringify(stripHeavyMedia(cleanProducts)))
      window.dispatchEvent(new CustomEvent('erlenbox:products-updated'))
    } catch {
      localStorage.removeItem(PRODUCT_STORAGE_KEY)
    }
  }, [products, storageReady])

  useEffect(() => {
    function openProductsList() {
      setView('list')
      setSelectedId(null)
      setSaveMenuOpen(false)
    }

    window.addEventListener('erlenbox:open-products-list', openProductsList)
    return () => window.removeEventListener('erlenbox:open-products-list', openProductsList)
  }, [])

  useEffect(() => {
    const voiceProductId = sessionStorage.getItem('erlenbox-voice-open-product')
    if (!voiceProductId) return
    sessionStorage.removeItem('erlenbox-voice-open-product')
    const product = products.find((item) => item.id === voiceProductId)
    if (product) {
      setSelectedId(product.id)
      setDraft(cloneProduct(product))
      setView('edit')
    }
  }, [products])

  function handleNew() {
    setSelectedId(null)
    setDraft(cloneProduct(emptyProduct))
    setView('create')
  }

  useEffect(() => {
    if (searchParams.get('yeni') !== '1') return
    setSelectedId(null)
    setDraft(cloneProduct(emptyProduct))
    setView('create')
    navigate('/stok/urunler', { replace: true })
  }, [searchParams, navigate])

  function handleEdit(id) {
    const product = products.find((p) => p.id === id)
    if (product) {
      setSelectedId(id)
      setDraft(cloneProduct(product))
      setView('edit')
    }
  }

  function handleBack() {
    setView('list')
    setSelectedId(null)
    setSaveMenuOpen(false)
  }

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2500)
  }

  function persistProduct({ createAnother = false } = {}) {
    if (!draft.name.trim()) {
      alert('Ürün adı zorunludur.')
      return false
    }

    const generatedCode = `URN-${String(products.length + 1).padStart(4, '0')}`
    const productToSave = {
      ...draft,
      stockCode: draft.stockCode.trim() || generatedCode,
    }

    if (isNew) {
      const newId = createNextProductId(products)
      const newProduct = { ...productToSave, id: newId }
      setProducts((prev) => [newProduct, ...prev])
      showToast('Ürün kaydedildi')
      if (createAnother) {
        setSelectedId(null)
        setDraft(cloneProduct(emptyProduct))
        setView('create')
      } else {
        setSelectedId(newId)
        setDraft(cloneProduct(newProduct))
        setView('list')
      }
    } else {
      setProducts((prev) => prev.map((p) => (p.id === selectedId ? { ...productToSave, id: selectedId } : p)))
      setDraft(cloneProduct({ ...productToSave, id: selectedId }))
      showToast('Ürün kaydedildi')
      setSelectedId(null)
      setView('list')
    }
    setSaveMenuOpen(false)
    return true
  }

  function handleSave() {
    persistProduct()
  }

  function handleSaveAndNew() {
    persistProduct({ createAnother: true })
  }

  function handleCopyAndCreate() {
    if (!draft.name.trim()) {
      alert('Ürün adı zorunludur.')
      return
    }

    const newId = createNextProductId(products)
    const copiedProduct = {
      ...cloneProduct(draft),
      id: newId,
    }

    setProducts((prev) => [copiedProduct, ...prev])
    setSelectedId(newId)
    setDraft(cloneProduct(copiedProduct))
    setView('edit')
    setSaveMenuOpen(false)
    showToast('Ürün kopyalandı ve açıldı')
  }

  function handleDelete() {
    if (!selectedId) return
    const product = products.find((item) => item.id === selectedId)
    if (product) {
      appendActivityEntry({
        module: 'products',
        action: 'delete',
        entityType: 'product',
        entityId: product.id,
        entityLabel: product.name || product.stockCode || 'Ürün',
        description: `${product.name || 'Ürün'} silindi. Geri alınabilir kayıt olarak saklandı.`,
        snapshot: product,
        undo: { type: 'product.restoreDeleted' },
      })
    }
    setProducts((prev) => prev.filter((p) => p.id !== selectedId))
    showToast('Ürün silindi')
    setPendingProductDelete(false)
    handleBack()
  }

  function handleDeleteFromList(id) {
    const product = products.find((item) => item.id === id)
    if (product) {
      appendActivityEntry({
        module: 'products',
        action: 'delete',
        entityType: 'product',
        entityId: product.id,
        entityLabel: product.name || product.stockCode || 'Ürün',
        description: `${product.name || 'Ürün'} silindi. Geri alınabilir kayıt olarak saklandı.`,
        snapshot: product,
        undo: { type: 'product.restoreDeleted' },
      })
    }
    setProducts((prev) => prev.filter((item) => item.id !== id))
    if (selectedId === id) {
      setSelectedId(null)
      setDraft(cloneProduct(emptyProduct))
    }
    showToast('Ürün silindi')
  }

  function handleReset() {
    if (isNew) {
      setDraft(cloneProduct(emptyProduct))
    } else if (selectedProduct) {
      setDraft(cloneProduct(selectedProduct))
    }
  }

  function handleRestoreArchiveEntry(entry) {
    const product = entry.snapshot
    if (!product?.id) return false
    setProducts((prev) => (
      prev.some((item) => item.id === product.id)
        ? prev
        : [cloneProduct(product), ...prev]
    ))
    showToast('Ürün geri alındı')
    return true
  }

  return (
    <AppPageShell>
      {view === 'list' ? (
        <AppPageHeader
          title="Hizmet ve Ürünler"
          actions={(
            <SplitCreateButton
              label="Yeni Ürün Oluştur"
              onPrimaryClick={handleNew}
              menuAriaLabel="Ürün seçenekleri"
              menuItems={[
                {
                  id: 'new',
                  label: 'Hızlı Ürün Oluştur',
                  icon: Plus,
                  iconClassName: 'text-blue-300',
                  onClick: handleNew,
                },
                {
                  id: 'copy-hint',
                  label: 'Listeden Kopyala',
                  icon: Package,
                  iconClassName: 'text-emerald-300',
                  onClick: handleNew,
                },
              ]}
            />
          )}
        />
      ) : (
        <AppPageHeader
          title={isNew ? 'Yeni Ürün Oluştur' : 'Ürün Düzenle'}
          onBack={handleBack}
          backLabel="Ürün listesine dön"
          actions={(
            <div className="relative flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleBack}
                className="btn-cancel flex items-center gap-1.5 px-4 text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Vazgeç
              </button>
              <button
                type="button"
                onClick={() => alert('Ürün önerme modülü sonraki adımda WhatsApp / mail / görsel seçimleriyle bağlanacak.')}
                className="flex items-center gap-1.5 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm text-blue-300 transition-colors hover:bg-blue-500/20"
              >
                <Send className="w-4 h-4" /> Ürünü Öner
              </button>
              {!isNew && (
                <>
                  <button
                    type="button"
                    onClick={() => setView('edit')}
                    className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                  >
                    <Pencil className="w-4 h-4" /> Düzenle
                  </button>
                  <DeleteTrashButton
                    pending={pendingProductDelete}
                    onClick={() => setPendingProductDelete(true)}
                    onConfirm={handleDelete}
                    onCancel={() => setPendingProductDelete(false)}
                    title="Ürün silinsin mi?"
                    description={`"${selectedProduct?.name || 'Bu ürün'}" kalıcı olarak silinecek.`}
                    buttonClassName="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300 transition-colors hover:bg-red-500/20"
                    popoverClassName="absolute right-0 top-full z-50 mt-2"
                    wrapperClassName="relative"
                  >
                    <Trash2 className="w-4 h-4" /> Sil
                  </DeleteTrashButton>
                </>
              )}
              <div className="btn-split">
                <button type="button" onClick={handleSave} className={`${BTN_SUCCESS} gap-1.5 px-4 text-sm`}>
                  Kaydet
                </button>
                <span className="btn-split-divider" aria-hidden />
                <button
                  type="button"
                  onClick={() => setSaveMenuOpen((open) => !open)}
                  className={`${BTN_SUCCESS} w-14 px-0`}
                  aria-label="Kaydet menüsü"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${saveMenuOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {saveMenuOpen ? (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-dark-500/70 bg-dark-800 shadow-2xl">
                  <button type="button" onClick={handleSave} className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-dark-700">
                    Kaydet
                  </button>
                  <button type="button" onClick={handleSaveAndNew} className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-dark-700">
                    Kaydet ve yeni ürün oluştur
                  </button>
                  <button type="button" onClick={handleCopyAndCreate} className="block w-full px-4 py-2.5 text-left text-sm text-gray-300 hover:bg-dark-700">
                    Kopyala ve Oluştur
                  </button>
                </div>
              ) : null}
            </div>
          )}
        />
      )}

      {view === 'list' && (
        <SummaryMetrics
          columns={5}
          items={[
            { title: 'Toplam Kayıt', value: products.length, icon: Package },
            { title: 'Stok Takipli', value: productSummary.stockTracked, icon: CheckCircle2, tone: 'blue', valueTone: 'blue' },
            { title: 'Toplam Stok', value: productSummary.totalStock.toLocaleString('tr-TR'), icon: Boxes, tone: 'emerald', valueTone: 'emerald' },
            { title: 'Kritik Ürün', value: productSummary.critical, icon: AlertTriangle, tone: 'red', valueTone: 'red' },
            { title: 'Stok Toplam Maliyeti', value: formatTL(productSummary.cost), icon: WalletCards, tone: 'purple', valueTone: 'red' },
          ]}
        />
      )}

      {view === 'list' ? (
        <>
          <Panel
            title="Detaylı Ürün ve Hizmet Listesi"
            action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{products.length} kayıt</span>}
          >
            <ProductsTable
              products={products}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onEdit={handleEdit}
              onDelete={handleDeleteFromList}
            />
          </Panel>
          <ActivityArchivePanel
            title="Arşiv ve İşlem Geçmişi"
            modules={['products']}
            onRestore={handleRestoreArchiveEntry}
            emptyMessage="Henüz ürün arşiv veya silme kaydı yok."
          />
        </>
      ) : (
        <ProductForm
          product={draft}
          onChange={setDraft}
          onSave={handleSave}
          onReset={handleReset}
          isNew={isNew}
        />
      )}

      {toast && (
        <div className="fixed right-6 bottom-6 z-[120] flex items-center gap-2 rounded-xl bg-emerald-500/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
          <CheckCircle2 className="w-4 h-4" />
          {toast}
        </div>
      )}
    </AppPageShell>
  )
}
