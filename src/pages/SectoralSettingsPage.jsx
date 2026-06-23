import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { SECTORAL_CATEGORIES } from '../utils/sectoralSettings'

export default function SectoralSettingsPage() {
  return (
    <AppPageShell>
      <AppPageHeader title="Sektörel Ayarlar" />

      <AppPagePanel
        title="Sektörel Kategoriler"
        description="Sektöre özel modülleri kategori bazında yönetin. Bir kategori seçerek bölüm ve modül ayarlarını düzenleyin."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {SECTORAL_CATEGORIES.map((category) => (
            <Link
              key={category.id}
              to={`/ayarlar/sektorel/${category.id}`}
              className="flex min-h-[8.5rem] flex-col justify-between rounded-2xl border border-dark-500/45 bg-dark-800/55 px-4 py-4 transition-colors hover:border-blue-500/35 hover:bg-dark-700/60"
            >
              <div>
                <p className="text-sm font-black text-white">{category.label}</p>
                <p className="mt-1 text-xs font-semibold text-gray-500">{category.description}</p>
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-600">
                  {category.sections.length} bölüm
                </p>
                <ChevronRight className="h-4 w-4 shrink-0 text-gray-500" />
              </div>
            </Link>
          ))}
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
