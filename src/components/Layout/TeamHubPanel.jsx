import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageCircle,
  Pencil,
  Send,
  ShoppingCart,
  Trash2,
  Trophy,
  UserPlus,
  X,
  Check,
} from 'lucide-react'
import { TASK_CATEGORIES, TASK_PRIORITIES } from '../../utils/crmStore'
import { fullName } from '../../utils/personnelHelpers'
import {
  assignTaskToEmployee,
  buildTeamPerformanceRows,
  canManageTeamMessage,
  deleteTeamMessage,
  ensureDailyWinnerRecorded,
  formatTeamHubDateTime,
  getActiveTeamMembers,
  getEmployeeHubBadgeCount,
  getMonthlyBonusSummary,
  getSortedTeamMessages,
  getTeamAvatarUrl,
  getTeamHubTabBadgeCount,
  getTodayDealFeed,
  loadTeamHubState,
  markTeamHubChatRead,
  resolveCurrentTeamAuthor,
  sendTeamMessage,
  TEAM_HUB_EVENT,
  TEAM_HUB_NOTICE_BADGE_CLASS,
  updateTeamMessage,
} from '../../utils/teamHubStore'
import { TEAM_HUB_FIELD_CLASS, TEAM_HUB_TEXTAREA_CLASS } from '../../utils/themeMode'

const TABS = [
  {
    id: 'chat',
    label: 'Sohbet',
    icon: MessageCircle,
    iconWrap: 'bg-gradient-to-br from-sky-400 to-blue-600',
    activeRing: 'ring-sky-400/40',
  },
  {
    id: 'deals',
    label: 'Teklif & Sipariş',
    icon: FileText,
    iconWrap: 'bg-gradient-to-br from-emerald-400 to-teal-600',
    activeRing: 'ring-emerald-400/40',
  },
  {
    id: 'race',
    label: 'Yarış',
    icon: Trophy,
    iconWrap: 'bg-gradient-to-br from-amber-400 to-orange-500',
    activeRing: 'ring-amber-400/40',
  },
  {
    id: 'assign',
    label: 'Görev Ata',
    icon: UserPlus,
    iconWrap: 'bg-gradient-to-br from-violet-400 to-fuchsia-600',
    activeRing: 'ring-violet-400/40',
  },
]

function TeamAvatar({ employee, size = 'md', selected = false }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10'
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full bg-white/70 ring-2 ${
        selected ? 'ring-orange-400' : 'ring-white/80'
      } ${sizeClass}`}
      title={employee ? fullName(employee) : ''}
    >
      <img
        src={getTeamAvatarUrl(employee?.id)}
        alt={employee ? fullName(employee) : 'Kullanıcı'}
        className="h-full w-full object-cover"
      />
    </span>
  )
}

function TeamHubNoticeBadge({ count }) {
  if (!count) return null
  return (
    <span className={TEAM_HUB_NOTICE_BADGE_CLASS}>
      {count > 99 ? '99+' : count}
    </span>
  )
}

function ScoreRing({ score, rank }) {
  const tone = rank === 1
    ? 'text-amber-500'
    : rank === 2
      ? 'text-slate-400'
      : rank === 3
        ? 'text-orange-400'
        : 'text-sky-500'

  return (
    <div className={`flex flex-col items-center ${tone}`}>
      <span className="text-lg font-black leading-none tabular-nums">{score}</span>
      <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">puan</span>
    </div>
  )
}

const TEAM_HEADER_DOTS = [
  'bg-sky-500',
  'bg-emerald-500',
  'bg-amber-400',
  'bg-violet-500',
  'bg-rose-500',
]

function TeamHeaderDots() {
  return (
    <span className="flex shrink-0 items-center -space-x-0.5" aria-hidden="true">
      {TEAM_HEADER_DOTS.map((color, index) => (
        <span
          key={color}
          className={`relative h-1.5 w-1.5 rounded-full ring-1 ring-white/75 ${color}`}
          style={{ zIndex: TEAM_HEADER_DOTS.length - index }}
        />
      ))}
    </span>
  )
}

function TeamChatMessage({ message, member, onChanged }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(message.text)
  const canManage = canManageTeamMessage(message)

  function handleSaveEdit(event) {
    event.preventDefault()
    const next = draft.trim()
    if (!next) return
    updateTeamMessage(message.id, next)
    setEditing(false)
    onChanged?.()
  }

  function handleDelete() {
    deleteTeamMessage(message.id)
    onChanged?.()
  }

  return (
    <div className="flex items-start gap-2 rounded-[14px] bg-white/65 px-2.5 py-2">
      <TeamAvatar employee={member || { id: message.authorId }} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[11px] font-extrabold text-[var(--ink)]">{message.authorName}</p>
            <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
              {formatTeamHubDateTime(message.createdAt)}
              {message.updatedAt ? ' · düzenlendi' : ''}
            </p>
          </div>
          {canManage && !editing ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.text)
                  setEditing(true)
                }}
                className="rounded-lg p-1 text-[var(--muted)] transition-colors hover:bg-white/70 hover:text-[var(--ink)]"
                title="Düzenle"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-lg p-1 text-rose-500 transition-colors hover:bg-rose-500/10"
                title="Sil"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={handleSaveEdit} className="mt-2 space-y-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={3}
              className={`${TEAM_HUB_TEXTAREA_CLASS} !min-h-[72px]`}
            />
            <div className="flex items-center justify-end gap-1">
              <button
                type="button"
                onClick={() => {
                  setDraft(message.text)
                  setEditing(false)
                }}
                className="rounded-lg p-1.5 text-[var(--muted)] transition-colors hover:bg-white/70"
                title="Vazgeç"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <button
                type="submit"
                className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-500/10"
                title="Kaydet"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>
        ) : (
          <p className="mt-1 text-[12px] leading-snug text-[var(--ink)]">{message.text}</p>
        )}
      </div>
    </div>
  )
}

export default function TeamHubPanel({ collapsed, onToggle }) {
  const [activeTab, setActiveTab] = useState('chat')
  const [tick, setTick] = useState(0)
  const [messageDraft, setMessageDraft] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    customer: '',
    category: 'Genel',
    priority: 'Normal',
  })

  useEffect(() => {
    function refresh() {
      setTick((value) => value + 1)
    }
    const events = [
      TEAM_HUB_EVENT,
      'bach:crm-updated',
      'bach:quotes-updated',
      'bach:orders-updated',
      'bach:personnel-updated',
    ]
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [])

  const hubState = useMemo(() => {
    ensureDailyWinnerRecorded()
    return loadTeamHubState()
  }, [tick])

  const members = useMemo(() => getActiveTeamMembers(), [tick])
  const leaderboard = useMemo(() => buildTeamPerformanceRows(), [tick])
  const deals = useMemo(() => getTodayDealFeed(), [tick])
  const monthlyBonus = useMemo(() => getMonthlyBonusSummary(), [tick])
  const chatMessages = useMemo(
    () => getSortedTeamMessages(hubState.messages),
    [hubState.messages],
  )
  const selectedEmployee = members.find((item) => item.id === selectedEmployeeId) || members[0] || null

  useEffect(() => {
    if (!selectedEmployeeId && members[0]?.id) {
      setSelectedEmployeeId(members[0].id)
    }
  }, [members, selectedEmployeeId])

  useEffect(() => {
    if (activeTab !== 'chat') return
    markTeamHubChatRead()
    setTick((value) => value + 1)
  }, [activeTab])

  const tabBadges = useMemo(() => (
    Object.fromEntries(TABS.map((tab) => [tab.id, getTeamHubTabBadgeCount(tab.id)]))
  ), [tick, hubState.messages, hubState.lastReadChatAt])

  const panelWidthClass = collapsed ? 'lg:w-[var(--ds-sidebar-collapsed,5.5rem)] w-[var(--ds-sidebar-expanded,17.5rem)]' : 'w-[var(--ds-sidebar-expanded,17.5rem)]'
  const panelPaddingClass = collapsed ? 'p-4 lg:px-2 lg:py-4' : 'px-3 py-4'

  function handleSendMessage(event) {
    event.preventDefault()
    if (!messageDraft.trim()) return
    const author = resolveCurrentTeamAuthor()
    sendTeamMessage(messageDraft, author)
    setMessageDraft('')
    setTick((value) => value + 1)
  }

  function handleAssignTask(event) {
    event.preventDefault()
    if (!selectedEmployee || !taskForm.title.trim()) return
    assignTaskToEmployee(selectedEmployee, taskForm)
    setTaskForm({
      title: '',
      description: '',
      customer: '',
      category: 'Genel',
      priority: 'Normal',
    })
    setActiveTab('race')
  }

  return (
    <aside
      data-collapsed={collapsed ? 'true' : 'false'}
      className={`glass-team-hub app-sidebar fixed top-[var(--shell-gap)] bottom-[var(--shell-gap)] right-[var(--shell-gap)] z-50 hidden h-[calc(100dvh-(2*var(--shell-gap)))] flex-col transition-all duration-300 lg:flex ${panelPaddingClass} ${panelWidthClass}`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'justify-between gap-2 px-1'}`}>
        {!collapsed ? (
          <div className="flex min-w-0 items-center gap-2">
            <TeamHeaderDots />
            <h2 className="truncate text-xs font-extrabold leading-none text-[var(--ink)]">Ekip Merkezi</h2>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggle}
          className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 items-center justify-center rounded-xl"
          aria-label={collapsed ? 'Ekip panelini aç' : 'Ekip panelini daralt'}
        >
          {collapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
      </div>

      <nav className={`mt-2 ${collapsed ? 'flex flex-col items-center gap-1.5' : 'grid grid-cols-4 gap-1'}`}>
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id)
                if (collapsed) onToggle?.()
              }}
              className={`flex items-center justify-center rounded-[14px] p-1 transition-all ${
                active
                  ? `bg-white/78 ring-2 ${tab.activeRing} shadow-sm`
                  : 'bg-white/30 hover:bg-white/58'
              } ${collapsed ? 'h-10 w-10' : 'h-10'}`}
              title={tab.label}
              aria-label={tab.label}
              aria-current={active ? 'page' : undefined}
            >
              <span className={`relative flex h-8 w-8 items-center justify-center rounded-xl shadow-sm ${tab.iconWrap}`}>
                <Icon className="h-4 w-4 text-[#ffffff]" strokeWidth={2.25} />
                <TeamHubNoticeBadge count={tabBadges[tab.id]} />
              </span>
            </button>
          )
        })}
      </nav>

      {!collapsed ? (
        <div className="mt-2 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[18px] bg-white/35 ring-1 ring-[rgba(140,145,165,0.14)]">
          {activeTab === 'chat' ? (
            <>
              <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-2.5">
                {chatMessages.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[12px] font-semibold text-[var(--muted)]">
                    Henüz mesaj yok. Ekiple sohbeti buradan başlatın.
                  </p>
                ) : chatMessages.map((message) => {
                  const member = members.find((item) => item.id === message.authorId)
                  return (
                    <TeamChatMessage
                      key={message.id}
                      message={message}
                      member={member}
                      onChanged={() => setTick((value) => value + 1)}
                    />
                  )
                })}
              </div>
              <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-white/50 p-2.5">
                <input
                  value={messageDraft}
                  onChange={(event) => setMessageDraft(event.target.value)}
                  placeholder="Mesaj yaz..."
                  className={`${TEAM_HUB_FIELD_CLASS} min-w-0 flex-1 !rounded-full`}
                />
                <button type="submit" className="btn-primary !h-9 !w-9 !rounded-full !p-0" aria-label="Gönder">
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </>
          ) : null}

          {activeTab === 'deals' ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-2.5">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Bugünkü hareketler</p>
              {deals.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12px] font-semibold text-[var(--muted)]">
                  Bugün yeni teklif veya sipariş yok.
                </p>
              ) : deals.map((deal) => {
                const Icon = deal.kind === 'order' ? ShoppingCart : FileText
                return (
                  <Link
                    key={`${deal.kind}-${deal.id}`}
                    to={deal.href}
                    className="flex items-start gap-2 rounded-[14px] bg-white/65 px-2.5 py-2 transition-colors hover:bg-white/85"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/80 text-sky-600">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-extrabold text-[var(--ink)]">{deal.label}</p>
                      <p className="mt-0.5 truncate text-[11px] font-semibold text-[var(--muted)]">{deal.customer}</p>
                      <p className="mt-0.5 text-[10px] font-bold text-orange-600">{deal.owner}</p>
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : null}

          {activeTab === 'race' ? (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-2.5">
              <div className="rounded-[14px] bg-gradient-to-br from-amber-500/15 to-orange-500/10 px-3 py-2.5">
                <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Günün birincisi</p>
                {leaderboard[0] ? (
                  <div className="mt-2 flex items-center gap-2">
                    <TeamAvatar employee={members.find((item) => item.id === leaderboard[0].employeeId)} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-extrabold text-[var(--ink)]">{leaderboard[0].name}</p>
                      <p className="text-[11px] font-semibold text-[var(--muted)]">
                        {leaderboard[0].score}/100 · +15 prim puanı
                      </p>
                    </div>
                    <Trophy className="h-5 w-5 shrink-0 text-amber-500" />
                  </div>
                ) : (
                  <p className="mt-2 text-[12px] font-semibold text-[var(--muted)]">Henüz puan yok.</p>
                )}
              </div>

              {leaderboard.map((row) => (
                <button
                  key={row.employeeId}
                  type="button"
                  onClick={() => {
                    setSelectedEmployeeId(row.employeeId)
                    setActiveTab('assign')
                  }}
                  className={`flex w-full items-center gap-2 rounded-[14px] bg-white/65 px-2.5 py-2 text-left transition-colors hover:bg-white/85 ${
                    selectedEmployeeId === row.employeeId ? 'ring-2 ring-orange-300' : ''
                  }`}
                >
                  <TeamAvatar employee={members.find((item) => item.id === row.employeeId)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-[var(--muted)]">#{row.rank}</span>
                      <p className="truncate text-[12px] font-extrabold text-[var(--ink)]">{row.name}</p>
                    </div>
                    <p className="mt-0.5 text-[10px] font-semibold text-[var(--muted)]">
                      {row.quotesToday.length} teklif · {row.ordersToday.length} sipariş · {row.tasksDoneToday.length} görev
                    </p>
                  </div>
                  <ScoreRing score={row.score} rank={row.rank} />
                </button>
              ))}

              {monthlyBonus.length > 0 ? (
                <div className="mt-1 rounded-[14px] border border-white/50 bg-white/45 p-2.5">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Ay sonu prim birikimi</p>
                  <div className="space-y-1.5">
                    {monthlyBonus.map((row) => (
                      <div key={row.employeeId} className="flex items-center justify-between gap-2 text-[11px]">
                        <span className="truncate font-semibold text-[var(--ink)]">{row.name}</span>
                        <span className="shrink-0 font-extrabold text-emerald-600">
                          {row.points} puan · ≈{row.bonusTry.toLocaleString('tr-TR')}₺
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {activeTab === 'assign' ? (
            <form onSubmit={handleAssignTask} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain p-2.5">
              <p className="px-1 text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">Görev atanan kişi</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {members.map((employee) => (
                  <button
                    key={employee.id}
                    type="button"
                    onClick={() => setSelectedEmployeeId(employee.id)}
                    className="shrink-0"
                  >
                    <TeamAvatar employee={employee} selected={selectedEmployeeId === employee.id} />
                  </button>
                ))}
              </div>
              {selectedEmployee ? (
                <p className="px-1 text-[12px] font-extrabold text-[var(--ink)]">{fullName(selectedEmployee)}</p>
              ) : null}

              <label className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--muted)]">Görev başlığı</span>
                <input
                  value={taskForm.title}
                  onChange={(event) => setTaskForm((current) => ({ ...current, title: event.target.value }))}
                  className={TEAM_HUB_FIELD_CLASS}
                  placeholder="Örn. Müşteri geri arama"
                  required
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--muted)]">Müşteri</span>
                <input
                  value={taskForm.customer}
                  onChange={(event) => setTaskForm((current) => ({ ...current, customer: event.target.value }))}
                  className={TEAM_HUB_FIELD_CLASS}
                  placeholder="Opsiyonel"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[11px] font-bold text-[var(--muted)]">Açıklama</span>
                <textarea
                  value={taskForm.description}
                  onChange={(event) => setTaskForm((current) => ({ ...current, description: event.target.value }))}
                  className={TEAM_HUB_TEXTAREA_CLASS}
                  placeholder="Görev detayı"
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--muted)]">Kategori</span>
                  <select
                    value={taskForm.category}
                    onChange={(event) => setTaskForm((current) => ({ ...current, category: event.target.value }))}
                    className={`${TEAM_HUB_FIELD_CLASS} team-hub-select`}
                  >
                    {TASK_CATEGORIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-[11px] font-bold text-[var(--muted)]">Öncelik</span>
                  <select
                    value={taskForm.priority}
                    onChange={(event) => setTaskForm((current) => ({ ...current, priority: event.target.value }))}
                    className={`${TEAM_HUB_FIELD_CLASS} team-hub-select`}
                  >
                    {TASK_PRIORITIES.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="submit" className="btn-primary mt-1 inline-flex items-center justify-center gap-2 !text-[12px]">
                <ClipboardList className="h-3.5 w-3.5" />
                Görevi Ata
              </button>
            </form>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-1 flex-col items-center gap-2">
          {members.slice(0, 4).map((employee) => {
            const badgeCount = getEmployeeHubBadgeCount(employee, hubState.messages, hubState.lastReadChatAt)
            return (
            <button
              key={employee.id}
              type="button"
              onClick={() => {
                setSelectedEmployeeId(employee.id)
                setActiveTab('assign')
                onToggle?.()
              }}
              className="relative rounded-full"
              title={fullName(employee)}
            >
              <TeamAvatar employee={employee} size="sm" />
              <TeamHubNoticeBadge count={badgeCount} />
            </button>
            )
          })}
        </div>
      )}
    </aside>
  )
}
