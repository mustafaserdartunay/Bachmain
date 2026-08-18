import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderPlus, LayoutDashboard, PackagePlus, ShoppingBag, Tags } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import {
  WEB_STUDIO_CATEGORY_CREATE_PATH,
  WEB_STUDIO_MANAGEMENT_PATH,
  WEB_STUDIO_PRODUCT_CREATE_PATH,
} from '../../data/webMenu'
import { APP_METRIC_ROW_CLASS, APP_LABEL_CLASS, APP_VALUE_CLASS } from '../../utils/dashboardDesign'
import { getWebCategories, getWebStoreProducts } from '../../utils/webSiteStorage'

function money(value) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

export default function WebStudioAdminPage() {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const refresh = () => setTick((value) => value + 1)
    window.addEventListener('bach:web-catalog-updated', refresh)
    return () => window.removeEventListener('bach:web-catalog-updated', refresh)
  }, [])

  const snapshot = useMemo(() => {
    const categories = getWebCategories()
    const products = getWebStoreProducts()
    return {
      categories,
      products,
      published: products.filter((item) => item.published).length,
      showcase: categories.filter((item) => item.showcase).length,
      recentCategories: [...categories].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6),
      recentProducts: [...products].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))).slice(0, 6),
    }
  }, [tick])

  return (
    <AppPageShell>
      <AppPageHeader title="Yönetim" backTo={WEB_STUDIO_MANAGEMENT_PATH} backLabel="Güncel Durum" />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Kategori', value: snapshot.categories.length, icon: Tags, tone: 'blue', valueTone: 'blue' },
          { title: 'Ürün', value: snapshot.products.length, icon: ShoppingBag, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Yayında', value: snapshot.published, icon: LayoutDashboard, tone: 'cyan', valueTone: 'cyan' },
          { title: 'Vitrin kategori', value: snapshot.showcase, icon: FolderPlus, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <Link
          to={WEB_STUDIO_CATEGORY_CREATE_PATH}
          className="card flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-white/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
              <FolderPlus className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--ink)]">Kategori oluştur</p>
              <p className="text-[12px] font-semibold text-[var(--muted)]">
                Web menüsü, vitrin ve ürün grupları için kategori kaydı açın.
              </p>
            </div>
          </div>
          <span className="text-[12px] font-extrabold text-blue-600">Aç</span>
        </Link>

        <Link
          to={WEB_STUDIO_PRODUCT_CREATE_PATH}
          className="card flex items-center justify-between gap-4 px-4 py-4 transition-colors hover:bg-white/40"
        >
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
              <PackagePlus className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-black text-[var(--ink)]">Ürün oluştur</p>
              <p className="text-[12px] font-semibold text-[var(--muted)]">
                Kategoriye bağlı fiyat, stok ve yayın bilgisiyle vitrin ürünü ekleyin.
              </p>
            </div>
          </div>
          <span className="text-[12px] font-extrabold text-emerald-600">Aç</span>
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <AppPagePanel
          title="Son kategoriler"
          action={
            <Link to={WEB_STUDIO_CATEGORY_CREATE_PATH} className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Yeni
            </Link>
          }
        >
          {snapshot.recentCategories.length ? (
            <div className="flex flex-col gap-1">
              {snapshot.recentCategories.map((item) => (
                <Link key={item.id} to={WEB_STUDIO_CATEGORY_CREATE_PATH} className={APP_METRIC_ROW_CLASS}>
                  <span className={APP_LABEL_CLASS}>{item.name}</span>
                  <span className={`${APP_VALUE_CLASS} text-[var(--muted)]`}>/{item.slug}</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-1 py-4 text-center text-[12px] font-semibold text-[var(--muted)]">
              Henüz kategori yok. İlk grubu oluşturun.
            </p>
          )}
        </AppPagePanel>

        <AppPagePanel
          title="Son ürünler"
          action={
            <Link to={WEB_STUDIO_PRODUCT_CREATE_PATH} className="text-[10px] font-extrabold uppercase tracking-wide text-blue-600">
              Yeni
            </Link>
          }
        >
          {snapshot.recentProducts.length ? (
            <div className="flex flex-col gap-1">
              {snapshot.recentProducts.map((item) => (
                <Link key={item.id} to={WEB_STUDIO_PRODUCT_CREATE_PATH} className={APP_METRIC_ROW_CLASS}>
                  <span className={APP_LABEL_CLASS}>{item.name}</span>
                  <span className={`${APP_VALUE_CLASS} ${item.published ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {money(item.price)}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="px-1 py-4 text-center text-[12px] font-semibold text-[var(--muted)]">
              Henüz ürün yok. Kategori seçip ürün ekleyin.
            </p>
          )}
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
