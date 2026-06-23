import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import {
  findSectoralCategory,
  isSectoralModuleEnabled,
  setSectoralModuleEnabled,
} from '../utils/sectoralSettings'

function ModuleToggle({ categoryId, sectionId, module }) {
  const [enabled, setEnabled] = useState(() => isSectoralModuleEnabled(categoryId, sectionId, module.id))

  useEffect(() => {
    function sync() {
      setEnabled(isSectoralModuleEnabled(categoryId, sectionId, module.id))
    }
    window.addEventListener('bach:sectoral-settings-updated', sync)
    return () => window.removeEventListener('bach:sectoral-settings-updated', sync)
  }, [categoryId, sectionId, module.id])

  function handleToggle(event) {
    const next = event.target.checked
    setEnabled(next)
    setSectoralModuleEnabled(categoryId, sectionId, module.id, next)
  }

  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-dark-500/45 bg-dark-800/55 px-4 py-3 transition-colors hover:border-blue-500/25">
      <div className="min-w-0">
        <p className="text-sm font-black text-white">{module.label}</p>
        <p className="mt-1 text-xs font-semibold text-gray-500">{module.description}</p>
        {enabled && module.route ? (
          <p className="mt-2 text-[10px] font-semibold text-emerald-300">Sayfa aktif: {module.route}</p>
        ) : (
          <p className="mt-2 text-[10px] font-semibold text-gray-600">Onay verilmediğinde menüde görünmez.</p>
        )}
      </div>
      <input
        type="checkbox"
        checked={enabled}
        onChange={handleToggle}
        className="mt-1 h-5 w-5 shrink-0 rounded border-dark-500 bg-dark-700 accent-emerald-500"
        aria-label={`${module.label} onayı`}
      />
    </label>
  )
}

export default function SectoralCategorySettingsPage() {
  const { categoryId } = useParams()
  const category = findSectoralCategory(categoryId)

  if (!category) {
    return (
      <AppPageShell>
        <AppPageHeader title="Sektörel Ayarlar" backTo="/ayarlar/sektorel" backLabel="Sektörel Ayarlar" />
        <AppPagePanel>
          <p className="text-center text-sm font-semibold text-gray-400">
            Sektörel kategori bulunamadı.
            <Link to="/ayarlar/sektorel" className="ml-2 text-blue-300 hover:underline">Listeye dön</Link>
          </p>
        </AppPagePanel>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={category.label}
        backTo="/ayarlar/sektorel"
        backLabel="Sektörel Ayarlar"
      />

      {category.sections.map((section) => (
        <AppPagePanel
          key={section.id}
          title={section.label}
          description={section.description}
        >
          <div className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
            {section.modules.map((module) => (
              <ModuleToggle
                key={module.id}
                categoryId={category.id}
                sectionId={section.id}
                module={module}
              />
            ))}
          </div>
        </AppPagePanel>
      ))}
    </AppPageShell>
  )
}
