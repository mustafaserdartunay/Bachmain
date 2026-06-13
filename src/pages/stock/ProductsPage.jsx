import { useEffect, useState } from 'react'
import { ChevronRight, Plus, ArrowLeft, Trash2, Pencil, CheckCircle2, Send, ChevronDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProductsTable from '../../components/Products/ProductsTable'
import ProductForm from '../../components/Products/ProductForm'
import { emptyProduct, sampleProducts } from '../../data/productsData'
import { DeleteTrashButton } from '../../components/Common/ListDeleteConfirmPanel'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

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

export default function ProductsPage() {
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
      const newId = `PRD-${String(products.length + 1).padStart(3, '0')}`
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

  function handleDelete() {
    if (!selectedId) return
    setProducts((prev) => prev.filter((p) => p.id !== selectedId))
    showToast('Ürün silindi')
    setPendingProductDelete(false)
    handleBack()
  }

  function handleDeleteFromList(id) {
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

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <Link to="/" className="hover:text-gray-300 transition-colors">Dashboard</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-400">Stok Yönetimi</span>
            <ChevronRight className="w-3 h-3" />
            {view === 'list' ? (
              <span className="text-gray-300">Hizmet ve Ürünler</span>
            ) : (
              <>
                <button onClick={handleBack} className="hover:text-gray-300 transition-colors">
                  Hizmet ve Ürünler
                </button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-300">{isNew ? 'Yeni Ürün' : 'Düzenle'}</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold text-white">Hizmet ve Ürünler</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {view === 'list'
              ? 'Tüm ürün ve hizmet tanımlarını görüntüleyin'
              : isNew
                ? 'Yeni ürün veya hizmet tanımı oluşturun'
                : `${draft.name} — düzenleme`}
          </p>
        </div>

        {view === 'list' ? (
          <div className="flex gap-2">
            <button
              onClick={handleNew}
              className={`${BTN_PRIMARY} gap-1.5 px-4 py-2.5 text-sm`}
            >
              <Plus className="w-4 h-4" /> Yeni
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-gray-400 border border-dark-500/50 hover:bg-dark-700 hover:text-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Vazgeç
            </button>
            <button
              onClick={() => alert('Ürün önerme modülü sonraki adımda WhatsApp / mail / görsel seçimleriyle bağlanacak.')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-blue-300 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 transition-colors"
            >
              <Send className="w-4 h-4" /> Ürünü Öner
            </button>
            {!isNew && (
              <>
                <button
                  onClick={() => setView('edit')}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
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
            <div className="relative flex">
              <button
                onClick={handleSave}
                className={`${BTN_SUCCESS} gap-1.5 rounded-r-none px-4 py-2.5 text-sm`}
              >
                Kaydet
              </button>
              <button
                onClick={() => setSaveMenuOpen((open) => !open)}
                className={`${BTN_SUCCESS} rounded-l-none border-l border-emerald-400/40 px-2 py-2.5`}
                aria-label="Kaydet menüsü"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${saveMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {saveMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-dark-800 border border-dark-500/70 shadow-2xl z-50 overflow-hidden">
                  <button
                    onClick={handleSave}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-700"
                  >
                    Kaydet
                  </button>
                  <button
                    onClick={handleSaveAndNew}
                    className="block w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-700"
                  >
                    Kaydet ve yeni ürün oluştur
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {view === 'list' ? (
        <ProductsTable
          products={products}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onEdit={handleEdit}
          onDelete={handleDeleteFromList}
        />
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
    </div>
  )
}
