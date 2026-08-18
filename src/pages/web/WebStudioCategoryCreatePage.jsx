import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderPlus, Hash, Image, Link2, Save, Tags, Text } from 'lucide-react'
import ConfirmModal from '../../components/Common/ConfirmModal'
import { FormFieldCompact, FormSectionPanel } from '../../components/Common/FormSectionPanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import {
  HEADER_ACTION_CTA_CLASS,
  HEADER_ACTION_CTA_ICON_CLASS,
  HEADER_ACTION_CTA_ICON_WRAP_CLASS,
  HEADER_ACTION_GRADIENTS,
} from '../../components/Layout/HeaderCashActionsPanel'
import { WEB_STUDIO_ADMIN_PATH, WEB_STUDIO_PRODUCT_CREATE_PATH } from '../../data/webMenu'
import { APP_METRIC_ROW_CLASS, APP_LABEL_CLASS, APP_VALUE_CLASS, YF_TEXT_ON_COLOR_CLASS } from '../../utils/dashboardDesign'
import {
  createWebCategory,
  deleteWebCategory,
  getWebCategories,
  getWebStoreProducts,
  slugify,
  updateWebCategory,
} from '../../utils/webSiteStorage'

const emptyForm = {
  name: '',
  slug: '',
  parentId: '',
  description: '',
  image: '',
  showInMenu: true,
  showcase: false,
}

const inputClass = 'form-input !h-8 !min-h-8 !py-1'
const selectClass = 'form-input !h-8 !min-h-8 !py-0'

export default function WebStudioCategoryCreatePage() {
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
  const parentOptions = categories.filter((item) => item.id !== editingId)
  const deleteTarget = categories.find((item) => item.id === deleteId)

  function setField(key, value) {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === 'name' && !slugLocked) next.slug = slugify(value, 'kategori')
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
      parentId: item.parentId || '',
      description: item.description || '',
      image: item.image || '',
      showInMenu: item.showInMenu !== false,
      showcase: Boolean(item.showcase),
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
      setError('Kategori adı zorunlu.')
      return
    }
    const payload = {
      ...form,
      slug: slugify(form.slug || form.name, 'kategori'),
    }
    if (editingId) updateWebCategory(editingId, payload)
    else createWebCategory(payload)
    resetForm()
    setTick((value) => value + 1)
  }

  function confirmDelete() {
    if (!deleteId) return
    deleteWebCategory(deleteId)
    if (editingId === deleteId) resetForm()
    setDeleteId('')
    setTick((value) => value + 1)
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={editingId ? 'Kategori düzenle' : 'Kategori oluştur'}
        backTo={WEB_STUDIO_ADMIN_PATH}
        backLabel="Yönetim"
        actions={
          <button type="submit" form="web-category-form" className={`${HEADER_ACTION_CTA_CLASS} ${HEADER_ACTION_GRADIENTS.success}`}>
            <span className={HEADER_ACTION_CTA_ICON_WRAP_CLASS}>
              <Save className={HEADER_ACTION_CTA_ICON_CLASS} strokeWidth={2.25} />
            </span>
            <span className={YF_TEXT_ON_COLOR_CLASS}>{editingId ? 'Güncelle' : 'Kaydet'}</span>
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <form id="web-category-form" onSubmit={handleSubmit} className="space-y-4">
          <FormSectionPanel icon={FolderPlus} title="Kategori bilgisi">
            <div className="space-y-2">
              <FormFieldCompact icon={Tags} label="Ad:" as="label">
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(event) => setField('name', event.target.value)}
                  placeholder="Örn. Çikolata"
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
                  placeholder="cikolata"
                />
              </FormFieldCompact>
              <FormFieldCompact icon={Hash} label="Üst kategori:" as="label">
                <select
                  className={selectClass}
                  value={form.parentId}
                  onChange={(event) => setField('parentId', event.target.value)}
                >
                  <option value="">Ana kategori</option>
                  {parentOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
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
                  placeholder="Vitrin ve kategori sayfası metni"
                />
              </FormFieldCompact>
              <div className="flex flex-wrap gap-2 pt-1">
                <label className="inline-flex items-center gap-2 rounded-xl bg-white/35 px-3 py-2 text-[12px] font-bold text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={form.showInMenu}
                    onChange={(event) => setField('showInMenu', event.target.checked)}
                  />
                  Menüde göster
                </label>
                <label className="inline-flex items-center gap-2 rounded-xl bg-white/35 px-3 py-2 text-[12px] font-bold text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={form.showcase}
                    onChange={(event) => setField('showcase', event.target.checked)}
                  />
                  Vitrin
                </label>
              </div>
              {error ? <p className="px-1 text-[12px] font-bold text-rose-600">{error}</p> : null}
              {editingId ? (
                <button type="button" onClick={resetForm} className="text-[12px] font-extrabold text-[var(--muted)]">
                  Yeni kayıt olarak sıfırla
                </button>
              ) : null}
            </div>
          </FormSectionPanel>
        </form>

        <AppPagePanel
          title="Kayıtlı kategoriler"
          description={`${categories.length} kategori · ürün oluşturmadan önce grupları hazırlayın`}
          action={
            <Link to={WEB_STUDIO_PRODUCT_CREATE_PATH} className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Ürün
            </Link>
          }
        >
          {categories.length ? (
            <div className="flex flex-col gap-1">
              {categories.map((item) => {
                const count = products.filter((product) => product.categoryId === item.id).length
                const parent = categories.find((row) => row.id === item.parentId)
                return (
                  <div key={item.id} className={`${APP_METRIC_ROW_CLASS} !h-auto min-h-[2.5625rem]`}>
                    <button type="button" onClick={() => startEdit(item)} className="min-w-0 flex-1 text-left">
                      <span className={APP_LABEL_CLASS}>{item.name}</span>
                      <span className="mt-0.5 block truncate text-[11px] font-semibold text-[var(--muted)]">
                        /{item.slug}
                        {parent ? ` · ${parent.name}` : ''}
                        {item.showcase ? ' · vitrin' : ''}
                      </span>
                    </button>
                    <span className={`${APP_VALUE_CLASS} shrink-0 text-[var(--muted)]`}>{count} ürün</span>
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
              Henüz kategori yok. Soldan ilk grubu kaydedin.
            </p>
          )}
        </AppPagePanel>
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Kategori silinsin mi?"
        description={
          deleteTarget
            ? `${deleteTarget.name} silinince bağlı ürünler kategorisiz kalır.`
            : ''
        }
        confirmLabel="Sil"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId('')}
      />
    </AppPageShell>
  )
}
