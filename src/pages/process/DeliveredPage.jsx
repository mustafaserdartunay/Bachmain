import { CheckCircle2, Truck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DeliveredPage() {
  return (
    <div className="space-y-5">
      <div className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="flex justify-center">
          <h1 className="text-2xl font-black uppercase tracking-wide text-emerald-300">Teslim Edilenler</h1>
        </div>
        <p className="mt-2 text-xs text-gray-500">Müşteriye teslim edilmiş sipariş ve kalemler</p>
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
          <Link
            to="/depo"
            className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-emerald-300 hover:text-emerald-200"
          >
            Sipariş deposu sayfasına git →
          </Link>
        </div>
      </section>
    </div>
  )
}
