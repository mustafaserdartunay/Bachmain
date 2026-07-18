import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import FeatureToggleButton from '../components/Common/FeatureToggleButton'
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

  function handleToggle(next) {
    setEnabled(next)
    setSectoralModuleEnabled(categoryId, sectionId, module.id, next)
  }

  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-dark-500/45 bg-dark-800/55 px-4 py-3 transition-colors hover:border-blue-500/25">
      <div className="min-w-0">
        <p className="text-sm font-black text-white">{module.label}</p>
        <p className="mt-1 text-xs font-semibold text-gray-500">{module.description}</p>
        {enabled && module.route ? (
          <p className="mt-2 text-[12px] font-semibold text-emerald-300">Sayfa aktif: {module.route}</p>
        ) : (
          <p className="mt-2 text-[12px] font-semibold text-gray-600">
            {enabled ? 'Özellik açık.' : 'Kapalıyken ilgili detay alanları gizlenir.'}
          </p>
        )}
      </div>
      <FeatureToggleButton
        enabled={enabled}
        onChange={handleToggle}
        ariaLabel={`${module.label} durumu`}
      />
    </div>
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
          <div className="grid gap-2 lg:grid-cols-1 xl:grid-cols-2">
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
