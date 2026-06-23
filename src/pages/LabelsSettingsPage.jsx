import { useEffect, useState } from 'react'
import { Workflow } from 'lucide-react'
import OptionListPanel from '../components/Settings/OptionListPanel'
import CrmProcessTemplatesSettingsPanel from '../components/Settings/CrmProcessTemplatesSettingsPanel'
import NoteProcessTemplatesSettingsPanel from '../components/Settings/NoteProcessTemplatesSettingsPanel'
import WorkflowStagesSettingsPanel from '../components/Settings/WorkflowStagesSettingsPanel'
import SalesRepProcessSettingsPanel from '../components/Settings/SalesRepProcessSettingsPanel'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { readOptionLists, saveOptionList } from '../utils/customerMeta'
import { appendActivityEntry } from '../utils/activityArchiveStore'

export default function LabelsSettingsPage() {
  const [optionLists, setOptionLists] = useState(() => readOptionLists())

  useEffect(() => {
    function refresh() {
      setOptionLists(readOptionLists())
    }
    window.addEventListener('bach:option-lists-updated', refresh)
    return () => window.removeEventListener('bach:option-lists-updated', refresh)
  }, [])

  function updateList(field, nextOptions) {
    const currentOptions = optionLists[field] || []
    currentOptions
      .filter((option) => !nextOptions.some((nextOption) => nextOption.id === option.id || nextOption.label === option.label))
      .forEach((option) => {
        appendActivityEntry({
          module: 'workflow',
          action: 'delete',
          entityType: 'option',
          entityId: option.id || option.label,
          entityLabel: option.label,
          description: `${option.label} seçeneği silindi.`,
          snapshot: { field, option },
          undo: { type: 'settings.restoreOption' },
        })
      })
    setOptionLists((current) => ({ ...current, [field]: nextOptions }))
    saveOptionList(field, nextOptions)
  }

  function handleRestoreArchiveEntry(entry) {
    const field = entry.snapshot?.field
    const option = entry.snapshot?.option
    if (!field || !option) return false
    const current = readOptionLists()
    const list = current[field] || []
    if (!list.some((item) => item.id === option.id || item.label === option.label)) {
      const next = [...list, option]
      saveOptionList(field, next)
      setOptionLists((state) => ({ ...state, [field]: next }))
    }
    return true
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <Workflow className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Süreçler Yönetimi</h1>
            <p className="mt-1 text-xs font-semibold text-gray-500">
              Süreç, durum, tip, puantaj ve kategori listelerini merkezi olarak yönetin.
            </p>
          </div>
        </div>
      </section>

      <WorkflowStagesSettingsPanel />

      <CrmProcessTemplatesSettingsPanel />

      <NoteProcessTemplatesSettingsPanel />

      <SalesRepProcessSettingsPanel />

      <section className="card space-y-4">
        <div>
          <h2 className="text-base font-black text-white">Durum</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Teklif durumları ve öncelik seviyeleri.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <OptionListPanel
            title="Teklif Durumu"
            description="Taslak, onaylandı, reddedildi vb."
            options={optionLists.status}
            onChange={(next) => updateList('status', next)}
            placeholder="Yeni durum adı..."
            activeLabel="Aktif Durum"
            countSuffix="durum tanımlı"
            emptyMessage="Henüz durum eklenmedi."
          />
          <OptionListPanel
            title="Sipariş Durumu"
            description="Yeni, üretimde, tamamlandı vb."
            options={optionLists.orderStatus}
            onChange={(next) => updateList('orderStatus', next)}
            placeholder="Yeni durum adı..."
            activeLabel="Aktif Durum"
            countSuffix="durum tanımlı"
            emptyMessage="Henüz durum eklenmedi."
          />
          <OptionListPanel
            title="Öncelik"
            description="Teklif ve sipariş listelerinde görünür."
            options={optionLists.priority}
            onChange={(next) => updateList('priority', next)}
            placeholder="Yeni öncelik adı..."
            activeLabel="Aktif Öncelik"
            countSuffix="öncelik tanımlı"
            emptyMessage="Henüz öncelik eklenmedi."
          />
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-base font-black text-white">Müşteri Süreçleri</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Müşteri tipi ve puantaj değerlendirmesi.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <OptionListPanel
            title="Tipi"
            description="Müşteri listesi ve kayıtlarında kullanılır."
            options={optionLists.type}
            onChange={(next) => updateList('type', next)}
            placeholder="Yeni tip adı..."
            activeLabel="Aktif Tip"
            countSuffix="tip tanımlı"
            emptyMessage="Henüz tip eklenmedi."
          />
          <OptionListPanel
            title="Puantaj"
            description="Müşteri puantaj değerlendirmesi."
            options={optionLists.scoring}
            onChange={(next) => updateList('scoring', next)}
            placeholder="Yeni puantaj adı..."
            activeLabel="Aktif Puantaj"
            countSuffix="puantaj tanımlı"
            emptyMessage="Henüz puantaj eklenmedi."
          />
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-base font-black text-white">Kategori Süreçleri</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Müşteri sektör kategorileri ve stok ürün kategorileri.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <OptionListPanel
            title="Müşteri Kategorileri"
            options={optionLists.category}
            onChange={(next) => updateList('category', next)}
            placeholder="Yeni müşteri kategorisi..."
            activeLabel="Aktif Kategori"
            countSuffix="kategori tanımlı"
            emptyMessage="Henüz kategori eklenmedi."
          />
          <OptionListPanel
            title="Ürün Kategorileri"
            options={optionLists.productCategory}
            onChange={(next) => updateList('productCategory', next)}
            placeholder="Yeni ürün kategorisi..."
            activeLabel="Aktif Kategori"
            countSuffix="kategori tanımlı"
            emptyMessage="Henüz kategori eklenmedi."
          />
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-base font-black text-white">Kasa Oluşturma Süreçleri</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Kasa, banka ve çek kasası oluşturma seçenekleri.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <OptionListPanel
            title="Kasa Türleri"
            description="Kasa oluşturma formundaki tür seçenekleri."
            options={optionLists.account}
            onChange={(next) => updateList('account', next)}
            placeholder="Yeni kasa türü..."
            activeLabel="Aktif Kasa Türü"
            countSuffix="tür tanımlı"
            emptyMessage="Henüz kasa türü eklenmedi."
          />
        </div>
      </section>

      <section className="card space-y-4">
        <div>
          <h2 className="text-base font-black text-white">Etiketler</h2>
          <p className="mt-1 text-xs font-semibold text-gray-500">Teklif ve ürünlerde kullanılabilecek etiket önerileri.</p>
        </div>
        <OptionListPanel
          title="Etiketler"
          description="Teklif ve ürünlerde kullanılabilecek etiket önerileri."
          options={optionLists.tags}
          onChange={(next) => updateList('tags', next)}
          placeholder="Yeni etiket adı..."
          activeLabel="Aktif Etiket"
          countSuffix="etiket tanımlı"
          emptyMessage="Henüz etiket eklenmedi."
        />
      </section>

      <ActivityArchivePanel
        title="Süreçler Arşiv ve İşlem Geçmişi"
        modules={['workflow']}
        onRestore={handleRestoreArchiveEntry}
        emptyMessage="Henüz süreç veya seçenek silme kaydı yok."
      />
    </div>
  )
}
