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

  const showStatus = matchesProcessSearch(searchQuery, [
    'Durum',
    'teklif durumu',
    'sipariş durumu',
    'öncelik',
    ...(optionLists.status || []).map((item) => item.label),
    ...(optionLists.orderStatus || []).map((item) => item.label),
    ...(optionLists.priority || []).map((item) => item.label),
  ])

  const showCustomer = matchesProcessSearch(searchQuery, [
    'Müşteri Süreçleri',
    'müşteri',
    'tipi',
    'puantaj',
    ...(optionLists.type || []).map((item) => item.label),
    ...(optionLists.scoring || []).map((item) => item.label),
  ])

  const showCategory = matchesProcessSearch(searchQuery, [
    'Kategori Süreçleri',
    'kategori',
    'sektör',
    'ürün',
    ...(optionLists.category || []).map((item) => item.label),
    ...(optionLists.productCategory || []).map((item) => item.label),
  ])

  const showCash = matchesProcessSearch(searchQuery, [
    'Kasa Oluşturma Süreçleri',
    'kasa',
    'banka',
    'çek',
    ...(optionLists.account || []).map((item) => item.label),
  ])

  const showTags = matchesProcessSearch(searchQuery, [
    'Etiketler',
    'etiket',
    'tag',
    ...(optionLists.tags || []).map((item) => item.label),
  ])

  const showArchive = matchesProcessSearch(searchQuery, [
    'Süreçler Arşiv',
    'arşiv',
    'geçmiş',
    'işlem',
    'silinen',
  ])

  const visibleSectionFlags = useMemo(
    () => ({
      workflow: matchesProcessSearch(searchQuery, [
        'teklif',
        'sipariş',
        'depo',
        'üretim',
        'dashboard',
        'finans',
        'süreç',
      ]),
      crm: matchesProcessSearch(searchQuery, ['crm', 'toplantı', 'ziyaret', 'numune']),
      note: matchesProcessSearch(searchQuery, ['not', 'defteri']),
      salesRep: matchesProcessSearch(searchQuery, ['satış', 'temsilci', 'prim', 'puan', 'görev']),
      status: showStatus,
      customer: showCustomer,
      category: showCategory,
      cash: showCash,
      tags: showTags,
      archive: showArchive,
    }),
    [searchQuery, showStatus, showCustomer, showCategory, showCash, showTags, showArchive],
  )

  const visibleSectionCount = useMemo(
    () => Object.values(visibleSectionFlags).filter(Boolean).length,
    [visibleSectionFlags],
  )

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
            <span className={YF_TEXT_CLASS}>Süreç Ara :</span>
          </div>
          <div className="min-w-0 flex-1">
            <SearchInput
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Süreç adı, durum, tip, kategori veya etiket ara..."
              className="customer-filter-search !text-[14px] !font-normal !leading-tight !tracking-normal !text-[var(--muted)]"
            />
          </div>
          <span className={`shrink-0 ${YF_TEXT_CLASS}`}>
            {hasActiveSearch ? `${visibleSectionCount} Bölüm` : 'Tüm Süreçler'}
          </span>
        </div>
      </AppPagePanel>

      {hasActiveSearch && visibleSectionCount === 0 ? (
        <AppPagePanel className="customer-filter-panel w-full">
          <EmptyState
            title="Eşleşen süreç bulunamadı."
            description="Arama terimini değiştirin veya süreç adını kısaltın."
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
