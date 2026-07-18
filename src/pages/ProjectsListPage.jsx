import { useEffect, useMemo, useState } from 'react'
import {
  Calendar,
  CheckCircle2,
  ClipboardList,
  FolderKanban,
  FolderPlus,
  WalletCards,
} from 'lucide-react'
import { DataTable } from '@bachmain/ui'
import { useNavigate } from 'react-router-dom'
import SearchInput from '../components/Common/SearchInput'
import SummaryMetrics from '../components/Common/SummaryMetrics'
import SplitCreateButton from '../components/Common/SplitCreateButton'
import ActivityArchivePanel from '../components/Common/ActivityArchivePanel'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../components/Layout/AppPageLayout'
import { PROJECTS_CREATE_PATH, PROJECTS_HOME_PATH } from '../data/projectsMenu'
import { formatTL } from '../utils/productPricing'
import {
  loadProjects,
  PROJECTS_UPDATED_EVENT,
  saveProjects,
} from '../utils/projectsStore'
import { softDeleteRecord } from '../utils/deletedRecordsStore'
import { appendActivityEntry } from '../utils/activityArchiveStore'
import { flushWorkspaceNow } from '../utils/workspaceStorage'
import {
  filterProjectsByScope,
  PROJECT_STATUS_STYLES,
} from '../utils/projectStatus'

const SCOPE_COPY = {
  all: {
    pageTitle: 'Projeler',
    listTitle: 'Projeler Listesi',
    totalLabel: 'Toplam Proje',
    emptyTitle: 'Proje bulunamadı.',
  },
  ongoing: {
    pageTitle: 'Devam Eden Projeler',
    listTitle: 'Devam Eden Projeler',
    totalLabel: 'Devam Eden',
    emptyTitle: 'Devam eden proje bulunamadı.',
  },
  completed: {
    pageTitle: 'Tamamlanan Projeler',
    listTitle: 'Tamamlanan Projeler',
    totalLabel: 'Tamamlanan',
    emptyTitle: 'Tamamlanan proje bulunamadı.',
  },
  cancelled: {
    pageTitle: 'İptal Projeler',
    listTitle: 'İptal Projeler',
    totalLabel: 'İptal',
    emptyTitle: 'İptal proje bulunamadı.',
  },
}

export default function ProjectsListPage({ scope = 'all' }) {
  const navigate = useNavigate()
  const copy = SCOPE_COPY[scope] || SCOPE_COPY.all
  const [projects, setProjects] = useState(loadProjects)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    function refresh() {
      setProjects(loadProjects())
    }
    window.addEventListener(PROJECTS_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(PROJECTS_UPDATED_EVENT, refresh)
  }, [])

  const scopedProjects = useMemo(
    () => filterProjectsByScope(projects, scope),
    [projects, scope],
  )

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase('tr-TR')
    if (!query) return scopedProjects
    return scopedProjects.filter((project) => {
      const haystack = [
        project.id,
        project.name,
        project.customer,
        project.manager,
        project.status,
        project.priority,
      ]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('tr-TR')
      return haystack.includes(query)
    })
  }, [scopedProjects, searchQuery])

  const totalBudget = useMemo(
    () => filteredProjects.reduce((sum, project) => sum + (Number(project.budget) || 0), 0),
    [filteredProjects],
  )

  const upcomingCount = useMemo(
    () => filteredProjects.filter((project) => project.deadline).length,
    [filteredProjects],
  )

  function removeProject(project) {
    if (!window.confirm(`"${project.name}" silinenlere taşınsın mı?`)) return
    softDeleteRecord('projects', project, { entityLabel: project.name })
    appendActivityEntry({
      module: 'projects',
      action: 'delete',
      entityLabel: project.name,
      snapshot: project,
    })
    saveProjects(loadProjects().filter((item) => item.id !== project.id))
    setProjects(loadProjects())
    flushWorkspaceNow()
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={copy.pageTitle}
        backTo={scope === 'all' ? '/' : PROJECTS_HOME_PATH}
        backLabel={scope === 'all' ? 'Başa dön' : 'Projeler'}
        actions={(
          <SplitCreateButton
            label="Yeni Proje Oluştur"
            onPrimaryClick={() => navigate(PROJECTS_CREATE_PATH)}
            menuAriaLabel="Proje seçenekleri"
            menuItems={[
              {
                id: 'create',
                label: 'Yeni Proje Oluştur',
                icon: FolderPlus,
                iconClassName: 'text-blue-300',
                onClick: () => navigate(PROJECTS_CREATE_PATH),
              },
              {
                id: 'list',
                label: 'Projeler Listesi',
                icon: ClipboardList,
                iconClassName: 'text-emerald-300',
                onClick: () => navigate(PROJECTS_HOME_PATH),
              },
            ]}
          />
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: copy.totalLabel, value: scopedProjects.length, icon: FolderKanban },
          { title: 'Listelenen', value: filteredProjects.length, icon: CheckCircle2, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Teslim Tarihi Olan', value: upcomingCount, icon: Calendar, tone: 'orange', valueTone: 'orange' },
          { title: 'Toplam Bütçe', value: formatTL(totalBudget), icon: WalletCards, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <AppPagePanel
        title={copy.listTitle}
        dotColor="blue"
        action={<span className="badge badge-blue shrink-0 !px-2 !py-0.5 !text-[12px]">{filteredProjects.length} kayıt</span>}
      >
        <div className="mb-4">
          <SearchInput
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Proje, müşteri veya sorumlu ara..."
          />
        </div>

        <DataTable
          className="mt-3"
          emptyTitle={copy.emptyTitle}
          emptyDescription="Arama filtresini değiştirin veya yeni proje oluşturun."
          data={filteredProjects}
          getRowId={(project) => project.id}
          columns={[
            {
              id: 'id',
              header: 'Proje No',
              sortable: true,
              accessorKey: 'id',
              cell: (project) => (
                <span className="font-semibold text-[var(--bach-sky,#79a6d2)]">{project.id}</span>
              ),
            },
            {
              id: 'name',
              header: 'Proje',
              sortable: true,
              accessorKey: 'name',
              cell: (project) => (
                <span className="font-semibold text-[var(--ink)]">{project.name}</span>
              ),
            },
            {
              id: 'customer',
              header: 'Müşteri',
              sortable: true,
              accessorKey: 'customer',
              hideOnMobile: true,
              cell: (project) => (
                <span className="text-[var(--muted)]">{project.customer || '—'}</span>
              ),
            },
            {
              id: 'status',
              header: 'Durum',
              cell: (project) => (
                <span className={PROJECT_STATUS_STYLES[project.status] || 'badge-gray'}>
                  {project.status || '—'}
                </span>
              ),
            },
            {
              id: 'budget',
              header: 'Bütçe',
              sortable: true,
              accessorKey: 'budget',
              hideOnMobile: true,
              cell: (project) => (
                <span className="tabular-nums font-semibold">{formatTL(project.budget || 0)}</span>
              ),
            },
            {
              id: 'deadline',
              header: 'Teslim',
              hideOnMobile: true,
              cell: (project) => (
                <span className="text-[var(--muted)]">{project.deadline || '—'}</span>
              ),
            },
            {
              id: 'progress',
              header: 'İlerleme',
              cell: (project) => {
                const progress = Math.max(0, Math.min(100, Number(project.progress) || 0))
                return (
                  <div className="min-w-[5.5rem]">
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(148,163,184,0.25)]">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="mt-1 block text-[11px] font-bold text-[var(--muted)]">%{progress}</span>
                  </div>
                )
              },
            },
            {
              id: 'actions',
              header: 'İşlem',
              cell: (project) => (
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    removeProject(project)
                  }}
                  className="rounded-lg border border-rose-500/30 px-2.5 py-1 text-[11px] font-black uppercase text-rose-500 hover:bg-rose-500/10"
                >
                  Sil
                </button>
              ),
            },
          ]}
        />
      </AppPagePanel>

      <ActivityArchivePanel
        title="Proje Arşiv ve İşlem Geçmişi"
        modules={['projects']}
        emptyMessage="Henüz proje arşiv veya silme kaydı yok."
      />
    </AppPageShell>
  )
}
