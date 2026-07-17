import { CheckCircle2, Package, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SplitCreateButton from '../../components/Common/SplitCreateButton'

export default function DeliveredPage() {
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <div className="app-page-header relative z-30 flex min-h-[4.75rem] items-center justify-center overflow-visible px-4 py-3 text-center sm:px-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-wide text-emerald-300">Teslim Edilenler</h1>
          <p className="mt-1 text-xs text-gray-500">Müşteriye teslim edilmiş sipariş ve kalemler</p>
        </div>
        <div className="absolute right-4 top-1/2 z-40 -translate-y-1/2 sm:right-6">
          <SplitCreateButton
            label="Yeni Teslimat İşlemi"
            onPrimaryClick={() => navigate('/depo')}
            menuAriaLabel="Teslimat seçenekleri"
            menuItems={[
              {
                id: 'depo',
                label: 'Depodan Devam Et',
                icon: Package,
                iconClassName: 'text-blue-300',
                onClick: () => navigate('/depo'),
              },
              {
                id: 'logistics',
                label: 'Lojistik Planına Git',
                icon: Truck,
                iconClassName: 'text-emerald-300',
                onClick: () => navigate('/lojistik/planlanan'),
              },
            ]}
          />
        </div>
      </div>

      <section className="card">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
            <Truck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-white">Teslimat Kayıtları</h2>
            <p className="mt-1 text-xs text-gray-500">
              Tamamlanan teslimatlar, irsaliye bağlantıları ve müşteri teslim geçmişi.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <p className="text-sm font-bold text-white">Teslim edilenler listesi hazırlanıyor</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-gray-500">
            Depodan çıkan ve müşteriye teslim edilen kalemler; teslim tarihi, adet ve
            ilişkili sipariş bilgileriyle burada görüntülenecek.
          </p>
        </div>
      </section>
    </div>
  )
}
