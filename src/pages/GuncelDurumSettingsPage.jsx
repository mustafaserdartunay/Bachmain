import { LayoutDashboard } from 'lucide-react'
import DashboardLayoutSettingsPanel from '../components/Settings/DashboardLayoutSettingsPanel'

export default function GuncelDurumSettingsPage() {
  return (
    <div className="w-full space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Güncel Durum</h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Ana sayfa panellerini, finans kartlarını, hızlı işlemleri ve dinamik blokları yönetin. Değişiklikler anında yansır.
            </p>
          </div>
        </div>
      </section>

      <DashboardLayoutSettingsPanel />
    </div>
  )
}
