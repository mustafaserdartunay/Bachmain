import { useEffect, useState } from 'react'
import { Tags } from 'lucide-react'
import OptionListPanel from '../components/Settings/OptionListPanel'
import { readOptionLists, saveOptionList } from '../utils/customerMeta'

export default function TagLabelsSettingsPage() {
  const [optionLists, setOptionLists] = useState(() => readOptionLists())

  useEffect(() => {
    function refresh() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refresh)
    return () => window.removeEventListener('bach:option-lists-updated', refresh)
  }, [])

  function updateTags(nextOptions) {
    setOptionLists((current) => ({ ...current, tags: nextOptions }))
    saveOptionList('tags', nextOptions)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <Tags className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Etiketler</h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Teklif ve ürünlerde kullanılabilecek etiket önerilerini buradan yönetin.
            </p>
          </div>
        </div>
      </section>

      <section className="card">
        <OptionListPanel
          title="Etiketler"
          description="Teklif ve ürünlerde kullanılabilecek etiket önerileri."
          options={optionLists.tags}
          onChange={updateTags}
          placeholder="Yeni etiket adı..."
          activeLabel="Aktif Etiket"
          countSuffix="etiket tanımlı"
          emptyMessage="Henüz etiket eklenmedi."
        />
      </section>
    </div>
  )
}
