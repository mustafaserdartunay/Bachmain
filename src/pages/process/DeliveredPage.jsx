import { CheckCircle2, Package, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SplitCreateButton from '../../components/Common/SplitCreateButton'
import { AppPageHeader, AppPageShell, AppPagePanel } from '../../components/Layout/AppPageLayout'

export default function DeliveredPage() {
  const navigate = useNavigate()

  return (
    <AppPageShell>
      <AppPageHeader
        title="Teslim Edilenler"
        titleClassName="text-emerald-300"
        actions={(
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
        )}
      />

      <AppPagePanel title="Teslimat Kayıtları" description="Tamamlanan teslimatlar, irsaliye bağlantıları ve müşteri teslim geçmişi." dotColor="emerald">
        <div className="rounded-2xl border border-dashed border-dark-500/60 bg-dark-800/40 p-10 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-gray-600" />
          <p className="text-sm font-bold text-white">Teslim edilenler listesi hazırlanıyor</p>
          <p className="mx-auto mt-2 max-w-md text-xs text-gray-500">
            Depodan çıkan ve müşteriye teslim edilen kalemler; teslim tarihi, adet ve
            ilişkili sipariş bilgileriyle burada görüntülenecek.
          </p>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
