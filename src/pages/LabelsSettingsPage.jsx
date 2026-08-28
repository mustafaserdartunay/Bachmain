import { useEffect, useMemo, useState } from 'react'
import { EmptyState } from '@bachmain/ui'
import SearchInput from '../components/Common/SearchInput'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
  AppPanelDot,
} from '../components/Layout/AppPageLayout'
import OptionListPanel from '../components/Settings/OptionListPanel'
import ProcessSettingsSectionShell from '../components/Settings/ProcessSettingsSectionShell'
import CrmProcessTemplatesSettingsPanel from '../components/Settings/CrmProcessTemplatesSettingsPanel'
import NoteProcessTemplatesSettingsPanel from '../components/Settings/NoteProcessTemplatesSettingsPanel'
import WorkflowStagesSettingsPanel from '../components/Settings/WorkflowStagesSettingsPanel'
import SalesRepProcessSettingsPanel from '../components/Settings/SalesRepProcessSettingsPanel'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { readOptionLists, saveOptionList } from '../utils/customerMeta'
import { appendActivityEntry } from '../utils/activityArchiveStore'
import {
  PAGE_CENTER_TITLE_CLASS,
  PAGE_HEADER_TITLE_SLOT_CLASS,
  YF_TEXT_CLASS,
} from '../utils/dashboardDesign'
import { matchesProcessSearch } from '../utils/processSettingsSearch'

export default function LabelsSettingsPage() {
  const [optionLists, setOptionLists] = useState(() => readOptionLists())
  const [searchQuery, setSearchQuery] = useState('')

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
      .filter(
        (option) =>
          !nextOptions.some(
            (nextOption) => nextOption.id === option.id || nextOption.label === option.label,
          ),
      )
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

  const showStatus = matchesProcessSearch(searchQuery, 'Durum')

  const showCustomer = matchesProcessSearch(searchQuery, 'Müşteri Süreçleri')

  const showCategory = matchesProcessSearch(searchQuery, 'Kategori Süreçleri')

  const showCash = matchesProcessSearch(searchQuery, 'Kasa Oluşturma Süreçleri')

  const showTags = matchesProcessSearch(searchQuery, 'Etiketler')

  const showArchive = matchesProcessSearch(searchQuery, 'Süreçler Arşiv ve İşlem Geçmişi')

  const workflowVisible = matchesProcessSearch(searchQuery, [
    'Teklif Süreçleri',
    'Sipariş Süreçleri',
    'Depo Süreçleri',
    'Üretim Süreçleri',
    'Güncel Durum',
  ])

  const crmVisible = matchesProcessSearch(searchQuery, 'Crm Süreçleri')
  const noteVisible = matchesProcessSearch(searchQuery, 'Not Defteri Süreçleri')
  const salesRepVisible = matchesProcessSearch(searchQuery, 'Satış Temsilcileri Süreçleri')

  const visibleSectionCount = useMemo(() => {
    let count = 0
    if (workflowVisible) {
      if (matchesProcessSearch(searchQuery, 'Teklif Süreçleri')) count += 1
      if (matchesProcessSearch(searchQuery, 'Sipariş Süreçleri')) count += 1
      if (matchesProcessSearch(searchQuery, 'Depo Süreçleri')) count += 1
      if (matchesProcessSearch(searchQuery, 'Üretim Süreçleri')) count += 1
      if (matchesProcessSearch(searchQuery, 'Güncel Durum')) count += 1
    }
    if (crmVisible) count += 1
    if (noteVisible) count += 1
    if (salesRepVisible) count += 1
    if (showStatus) count += 1
    if (showCustomer) count += 1
    if (showCategory) count += 1
    if (showCash) count += 1
    if (showTags) count += 1
    if (showArchive) count += 1
    return count
  }, [
    searchQuery,
    workflowVisible,
    crmVisible,
    noteVisible,
    salesRepVisible,
    showStatus,
    showCustomer,
    showCategory,
    showCash,
    showTags,
    showArchive,
  ])

  const hasActiveSearch = Boolean(searchQuery.trim())

  return (
    <AppPageShell className="customers-page-type w-full">
      <AppPageHeader
        showBack={false}
        title={<AppPageBackLink />}
        centerTitle="SÜREÇLER YÖNETİMİ"
        centerTitleClassName={PAGE_CENTER_TITLE_CLASS}
        titleClassName={PAGE_HEADER_TITLE_SLOT_CLASS}
      />

      <AppPagePanel className="customer-filter-panel flex min-h-[4.75rem] w-full items-center">
        <div className="flex w-full min-w-0 items-center gap-3 px-1">
          <div className="flex shrink-0 items-center gap-2">
            <AppPanelDot color="blue" />
            <span className={YF_TEXT_CLASS}>Süreç Başlığı :</span>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Süreç adı veya süreç başlığı ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>
            {hasActiveSearch ? `${visibleSectionCount} Başlık` : 'Tüm Süreçler'}
          </span>
        </div>
      </AppPagePanel>

      {hasActiveSearch && visibleSectionCount === 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <EmptyState
            title="Eşleşen süreç başlığı bulunamadı."
            description="Arama yalnızca süreç panel başlıklarında yapılır. Başlık adını deneyin."
          />
        </AppPagePanel>
      ) : null}

      <WorkflowStagesSettingsPanel searchQuery={searchQuery} />

      <CrmProcessTemplatesSettingsPanel searchQuery={searchQuery} />

      <NoteProcessTemplatesSettingsPanel searchQuery={searchQuery} />

      <SalesRepProcessSettingsPanel searchQuery={searchQuery} />

      {showStatus ? (
        <ProcessSettingsSectionShell
          title="Durum"
          description="Teklif durumları, sipariş durumları ve öncelik seviyeleri."
        >
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <OptionListPanel
              hideHeader
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
              hideHeader
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
              hideHeader
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
        </ProcessSettingsSectionShell>
      ) : null}

      {showCustomer ? (
        <ProcessSettingsSectionShell
          title="Müşteri Süreçleri"
          description="Müşteri tipi ve puantaj değerlendirmesi."
        >
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <OptionListPanel
              hideHeader
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
              hideHeader
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
        </ProcessSettingsSectionShell>
      ) : null}

      {showCategory ? (
        <ProcessSettingsSectionShell
          title="Kategori Süreçleri"
          description="Müşteri sektör kategorileri ve stok ürün kategorileri."
        >
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <OptionListPanel
              hideHeader
              title="Müşteri Kategorileri"
              options={optionLists.category}
              onChange={(next) => updateList('category', next)}
              placeholder="Yeni müşteri kategorisi..."
              activeLabel="Aktif Kategori"
              countSuffix="kategori tanımlı"
              emptyMessage="Henüz kategori eklenmedi."
            />
            <OptionListPanel
              hideHeader
              title="Ürün Kategorileri"
              options={optionLists.productCategory}
              onChange={(next) => updateList('productCategory', next)}
              placeholder="Yeni ürün kategorisi..."
              activeLabel="Aktif Kategori"
              countSuffix="kategori tanımlı"
              emptyMessage="Henüz kategori eklenmedi."
            />
          </div>
        </ProcessSettingsSectionShell>
      ) : null}

      {showCash ? (
        <ProcessSettingsSectionShell
          title="Kasa Oluşturma Süreçleri"
          description="Kasa, banka ve çek kasası oluşturma seçenekleri."
        >
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <OptionListPanel
              hideHeader
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
        </ProcessSettingsSectionShell>
      ) : null}

      {showTags ? (
        <ProcessSettingsSectionShell
          title="Etiketler"
          description="Teklif ve ürünlerde kullanılabilecek etiket önerileri."
        >
          <div className="mt-5">
            <OptionListPanel
              hideHeader
              title="Etiketler"
              description="Teklif ve ürünlerde kullanılabilecek etiket önerileri."
              options={optionLists.tags}
              onChange={(next) => updateList('tags', next)}
              placeholder="Yeni etiket adı..."
              activeLabel="Aktif Etiket"
              countSuffix="etiket tanımlı"
              emptyMessage="Henüz etiket eklenmedi."
            />
          </div>
        </ProcessSettingsSectionShell>
      ) : null}

      {showArchive ? (
        <ActivityArchivePanel
          title="Süreçler Arşiv ve İşlem Geçmişi"
          modules={['workflow']}
          onRestore={handleRestoreArchiveEntry}
          emptyMessage="Henüz süreç veya seçenek silme kaydı yok."
        />
      ) : null}
    </AppPageShell>
  )
}
