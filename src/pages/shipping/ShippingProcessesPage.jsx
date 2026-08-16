import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PackagePlus, Truck } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { SHIPPING_CREATE_PATH } from '../../data/shippingMenu'
import { getShippingLoadings } from '../../utils/shippingStore'
import { t } from '../../utils/shippingI18n'

export default function ShippingProcessesPage() {
  const [loadings, setLoadings] = useState(() => getShippingLoadings())

  useEffect(() => {
    function refresh() {
      setLoadings(getShippingLoadings())
    }
    refresh()
    window.addEventListener('bach:shipping-updated', refresh)
    return () => window.removeEventListener('bach:shipping-updated', refresh)
  }, [])

  const totalFreight = loadings.reduce((sum, item) => sum + (item.summary?.freight || 0), 0)
  const totalPieces = loadings.reduce((sum, item) => sum + (item.summary?.pieceCount || 0), 0)

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        title={t('page.title', 'tr')}
        actions={(
          <Link to={SHIPPING_CREATE_PATH} className="btn-primary inline-flex items-center gap-1.5 px-4 py-2.5 text-sm">
            <PackagePlus className="h-4 w-4" />
            {t('page.create', 'tr')}
          </Link>
        )}
      />

      <SummaryMetrics
        columns={4}
        className="customer-summary-metrics w-full"
        items={[
          { title: 'Toplam Yükleme', value: loadings.length, icon: Truck, tone: 'blue', valueTone: 'blue' },
          { title: 'Toplam Parça', value: totalPieces, icon: PackagePlus, tone: 'orange', valueTone: 'orange' },
          { title: 'Toplam Navlun', value: `${totalFreight.toLocaleString('tr-TR')} ₺`, icon: Truck, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Aktif Süreç', value: loadings.filter((item) => item.status === 'completed').length, icon: PackagePlus, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <AppPagePanel
        className="customer-list-panel w-full"
        title={`${t('page.list', 'tr')} :`}
        action={<span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-[14px] font-bold text-blue-300">{loadings.length} kayıt</span>}
      >
        {loadings.length === 0 ? (
          <p className="rounded-xl border border-dashed border-dark-500/60 bg-dark-800/40 py-10 text-center text-sm text-gray-500">
            Henüz yükleme kaydı yok. İlk yüklemeyi oluşturmak için yukarıdaki butonu kullanın.
          </p>
        ) : (
          <div className="space-y-3">
            {loadings.map((loading) => (
              <div key={loading.id} className="grid gap-3 rounded-xl border border-dark-500/45 bg-dark-700/35 p-4 md:grid-cols-[180px_minmax(0,1fr)_140px_120px] md:items-center">
                <div>
                  <p className="text-xs font-black text-blue-300">{loading.id}</p>
                  <p className="mt-1 text-[13px] text-gray-500">{new Date(loading.createdAt).toLocaleString('tr-TR')}</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{loading.customerName}</p>
                  <p className="mt-1 truncate text-xs text-gray-500">{loading.origin} → {loading.destination}</p>
                </div>
                <p className="text-sm font-bold text-emerald-300">{loading.summary?.freight?.toLocaleString('tr-TR')} ₺</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-center text-[12px] font-bold text-emerald-300">
                  {loading.invoiceNo}
                </span>
              </div>
            ))}
          </div>
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
