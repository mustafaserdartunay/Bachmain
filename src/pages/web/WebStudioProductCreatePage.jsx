import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Hash, Image, Link2, PackagePlus, Save, ShoppingBag, Tags, Text, Warehouse } from 'lucide-react'
import ConfirmModal from '../../components/Common/ConfirmModal'
import { FormFieldCompact, FormSectionPanel } from '../../components/Common/FormSectionPanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import { WEB_STUDIO_ADMIN_PATH, WEB_STUDIO_CATEGORY_CREATE_PATH } from '../../data/webMenu'
import { APP_METRIC_ROW_CLASS, APP_LABEL_CLASS, APP_VALUE_CLASS, YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import {
  createWebStoreProduct,
  deleteWebStoreProduct,
  getWebCategories,
  getWebStoreProducts,
  slugify,
  updateWebStoreProduct,
} from '../../utils/webSiteStorage'

const emptyForm = {
  name: '',
  slug: '',
  sku: '',
  categoryId: '',
  price: '',
  stock: '',
  description: '',
  image: '',
  published: true,
}

const inputClass = 'form-input !h-8 !min-h-8 !py-1'
const selectClass = 'form-input !h-8 !min-h-8 !py-0'

function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export default function WebStudioProductCreatePage() {
  const [tick, setTick] = useState(0)
  const [form, setForm] = useState(emptyForm)
  const [slugLocked, setSlugLocked] = useState(false)
  const [editingId, setEditingId] = useState('')
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState('')

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:web-catalog-updated', refresh)
    return () => window.removeEventListener('bach:web-catalog-updated', refresh)
  }, [])

  const categories = useMemo(() => getWebCategories(), [tick])
  const products = useMemo(() => getWebStoreProducts(), [tick])
  const deleteTarget = products.find((item) => item.id === deleteId)

  function setField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'name' && !slugLocked) next.slug = slugify(value, 'urun')
      return next
    })
    setError('')
  }

  function startEdit(item) {
    setEditingId(item.id)
    setSlugLocked(true)
    setForm({
      name: item.name,
      slug: item.slug,
      sku: item.sku || '',
      categoryId: item.categoryId || '',
      price: item.price === 0 ? '0' : String(item.price ?? ''),
      stock: item.stock === 0 ? '0' : String(item.stock ?? ''),
      description: item.description || '',
      image: item.image || '',
      published: item.published !== false,
    })
    setError('')
  }

  function resetForm() {
    setEditingId('')
    setSlugLocked(false)
    setForm(emptyForm)
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Ürün adı zorunlu.')
      return
    }
    if (!categories.length) {
      setError('Önce bir kategori oluşturun.')
      return
    }
    if (!form.categoryId) {
      setError('Ürünü bir kategoriye bağlayın.')
      return
    }
    const payload = {
      ...form,
      slug: slugify(form.slug || form.name, 'urun'),
      price: Number(form.price) || 0,
      stock: Number(form.stock) || 0,
    }
    if (editingId) updateWebStoreProduct(editingId, payload)
    else createWebStoreProduct(payload)
    resetForm()
    setTick((value) => value + 1)
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteWebStoreProduct(deleteId)
    if (editingId === deleteId) resetForm()
    setDeleteId('')
    setTick((value) => value + 1)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={editingId ? 'Ürün düzenle' : 'Ürün oluştur'}
        backTo={WEB_STUDIO_ADMIN_PATH}
        backLabel="Yönetim"
        actions={
          <button type="submit" form="web-product-form" className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}>
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>{editingId ? 'Güncelle' : 'Kaydet'}</span>
          </button>
        }
      />

      {!categories.length ? (
        <div className="card flex items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-sm font-black text-[var(--ink)]">Önce kategori gerekli</p>
            <p className="text-[12px] font-semibold text-[var(--muted)]">
              Ürünler vitrinde bir kategoriye bağlanır. İlk grubu oluşturun, sonra buraya dönün.
            </p>
          </div>
          <Link
            to={WEB_STUDIO_CATEGORY_CREATE_PATH}
            className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.primary}`}
          >
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Tags className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>Kategori oluştur</span>
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <form id="web-product-form" onSubmit={handleSubmit} className="space-y-4">
          <FormSectionPanel icon={PackagePlus} title="Ürün bilgisi">
            <div className="space-y-2">
              <FormFieldCompact icon={ShoppingBag} label="Ad:" as="label">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder="Örn. Bitter Tablet"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Link2} label="Slug:" as="label">
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(event) => {
                    setSlugLocked(true)
                    setField('slug', event.target.value)
                  }}
                  placeholder="bitter-tablet"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Hash} label="SKU:" as="label">
                <input
                  className={inputClass}
                  value={form.sku}
                  onChange={(event) => setField('sku', event.target.value)}
                  placeholder="BM-001"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Tags} label="Kategori:" as="label">
                <select
                  className={selectClass}
                  value={form.categoryId}
                  onChange={(event) => setField('categoryId', event.target.value)}
                >
                  <option value="">Seçin</option>
                  {categories.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </FormFieldCompact>
              <FormFieldCompact icon={ShoppingBag} label="Fiyat:" as="label">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(event) => setField('price', event.target.value)}
                  placeholder="0"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Warehouse} label="Stok:" as="label">
                <input
                  className={inputClass}
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(event) => setField('stock', event.target.value)}
                  placeholder="0"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Image} label="Görsel URL:" as="label">
                <input
                  className={inputClass}
                  value={form.image}
                  onChange={(event) => setField('image', event.target.value)}
                  placeholder="https://"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Text} label="Açıklama:" as="label">
                <input
                  className={inputClass}
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  placeholder="Kısa vitrin açıklaması"
                />
              </FormFieldCompact>
              <label className="inline-flex items-center gap-2 rounded-xl bg-white/35 px-3 py-2 text-[12px] font-bold text-[var(--ink)]">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(event) => setField('published', event.target.checked)}
                />
                Yayında
              </label>
              {error ? <p className="px-1 text-[12px] font-bold text-rose-600">{error}</p> : null}
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-[12px] font-extrabold text-[var(--muted)]">
                  Yeni kayıt olarak sıfırla
                </button>
              ) : null}
            </div>
          </FormSectionPanel>
        </form>

        <AppPagePanel title="Kayıtlı ürünler" description={`${products.length} ürün`}>
          {products.length ? (
            <div className="flex flex-col gap-1">
              {products.map((item) => {
                const category = categories.find((row) => row.id === item.categoryId)
                return (
                  <div key={item.id} className={`${APP_METRIC_ROW_CLASS} !h-auto min-h-[2.5625rem]`}>
                    <button type="button" onClick={() => startEdit(item)} className="min-w-0 flex-1 text-left">
                      <span className={APP_LABEL_CLASS}>{item.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--muted)]">
                        {category?.name || 'Kategorisiz'}
                        {item.sku ? ` · ${item.sku}` : ''}
                        {item.published ? '' : ' · taslak'}
                      </span>
                    </button>
                    <span className={`${APP_VALUE_CLASS} shrink-0 ${item.published ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {money(item.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeleteId(item.id)}
                      className="shrink-0 text-[11px] font-extrabold text-rose-600"
                    >
                      Sil
                    </button>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="px-1 py-4 text-center text-[12px] font-semibold text-[var(--muted)]">
              Henüz ürün yok. Soldan ilk kaydı oluşturun.
            </p>
          )}
        </AppPagePanel>
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Ürün silinsin mi?"
        description={deleteTarget ? `${deleteTarget.name} vitrinden kaldırılır.` : ''}
        confirmLabel="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId('')}
      />
    </AppPageShell>
  )
}
