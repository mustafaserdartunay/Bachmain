import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Award,
  Plus,
  Send,
  Trophy,
  Users,
} from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { getCustomerProfiles } from '../../data/customerProfiles'
import { addFieldSalesTask, getFieldSalesReps, updateFieldSalesTask } from '../../utils/fieldSalesStore'
import { formatTL } from '../../utils/productPricing'
import { loadSalesRepSettings } from '../../utils/salesRepSettingsStore'
import { getConversation, sendRepMessage } from '../../utils/salesRepStore'
import {
  buildMonthlyLeaderboard,
  formatMonthLabel,
  getRepDetail,
  monthKey,
} from '../../utils/salesRepUtils'
import { orderTotals } from '../../utils/ordersStore'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'

const TABS = [
  { id: 'overview', label: 'Özet' },
  { id: 'tasks', label: 'Görevler' },
  { id: 'quotes', label: 'Teklifler' },
  { id: 'orders', label: 'Siparişler' },
  { id: 'sales', label: 'Satışlar' },
  { id: 'messages', label: 'Mesajlar' },
]

const LIST_GRID = 'minmax(140px,1fr) minmax(120px,1fr) minmax(100px,1fr) 100px'

function emptyTaskForm(repLabel) {
  return {
    title: '',
    customerId: '',
    dueDate: '',
    notes: '',
    stageId: '',
    priority: 'Normal',
    assignedBy: 'Yönetici',
    repLabel,
  }
}

export default function SalesRepresentativesPage() {
  const [reps] = useState(() => getFieldSalesReps())
  const [selectedRep, setSelectedRep] = useState(() => getFieldSalesReps()[0]?.label || '')
  const [tab, setTab] = useState('overview')
  const [tick, setTick] = useState(0)
  const [taskForm, setTaskForm] = useState(() => emptyTaskForm(getFieldSalesReps()[0]?.label || ''))
  const [messagePeer, setMessagePeer] = useState('')
  const [messageText, setMessageText] = useState('')
  const customers = useMemo(() => getCustomerProfiles(), [tick])

  const refresh = useCallback(() => setTick((value) => value + 1), [])

  useEffect(() => {
    const events = [
      'bach:field-sales-updated',
      'bach:sales-rep-updated',
      'bach:sales-rep-settings-updated',
      'bach:quotes-updated',
      'bach:orders-updated',
      'erlenbox:sales-invoices-updated',
      'bach:personnel-updated',
    ]
    events.forEach((event) => window.addEventListener(event, refresh))
    return () => events.forEach((event) => window.removeEventListener(event, refresh))
  }, [refresh])

  const leaderboard = useMemo(() => buildMonthlyLeaderboard(monthKey()), [tick])
  const detail = useMemo(() => (selectedRep ? getRepDetail(selectedRep) : null), [selectedRep, tick])
  const settings = useMemo(() => loadSalesRepSettings(), [tick])
  const selectedRepMeta = reps.find((rep) => rep.label === selectedRep)
  const conversation = useMemo(() => {
    if (!selectedRep || !messagePeer) return []
    return getConversation(reps, selectedRep, messagePeer)
  }, [selectedRep, messagePeer, reps, tick])

  function handleAssignTask(event) {
    event.preventDefault()
    if (!taskForm.title.trim()) return
    addFieldSalesTask({
      repLabel: taskForm.repLabel || selectedRep,
      customerId: taskForm.customerId,
      title: taskForm.title,
      dueDate: taskForm.dueDate,
      notes: taskForm.notes,
      stageId: taskForm.stageId || settings.taskStages[0]?.id || '',
      assignedBy: taskForm.assignedBy,
      priority: taskForm.priority,
    })
    setTaskForm(emptyTaskForm(selectedRep))
    refresh()
  }

  function handleSendMessage(event) {
    event.preventDefault()
    if (!messagePeer || !messageText.trim()) return
    sendRepMessage({
      fromRepId: selectedRepMeta?.id,
      fromRepLabel: selectedRep,
      toRepId: reps.find((rep) => rep.label === messagePeer)?.id,
      toRepLabel: messagePeer,
      text: messageText,
    })
    setMessageText('')
    refresh()
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Satış Temsilcileri"
        actions={(
          <Link to="/saha-satis/temsilci-raporlari" className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-xs font-black text-blue-300">
            Temsilci Raporları
          </Link>
        )}
      />

      <SummaryMetrics
        columns={4}
        items={[
          { title: 'Temsilci', value: reps.length, icon: Users, tone: 'blue', valueTone: 'blue' },
          { title: formatMonthLabel(), value: `#${leaderboard[0]?.rank || '—'} ${leaderboard[0]?.repLabel || ''}`.trim(), icon: Trophy, tone: 'amber', valueTone: 'amber' },
          { title: 'Standart Prim', value: `%${settings.baseCommissionRate}`, icon: Award, tone: 'emerald', valueTone: 'emerald' },
          { title: 'Ay Birincisi', value: `%${settings.winnerCommissionRate}`, icon: Trophy, tone: 'purple', valueTone: 'purple' },
        ]}
      />

      <AppPagePanel title={`${formatMonthLabel()} Yarış Tablosu`}>
        <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
          {leaderboard.map((row) => (
            <button
              key={row.repLabel}
              type="button"
              onClick={() => { setSelectedRep(row.repLabel); setTaskForm(emptyTaskForm(row.repLabel)) }}
              className={`rounded-2xl border px-4 py-3 text-left transition-colors ${
                selectedRep === row.repLabel
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-dark-500/40 bg-dark-800/55 hover:bg-dark-800/80'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-black text-white">{row.rank}. {row.repLabel}</p>
                {row.rank === 1 ? <Trophy className="h-4 w-4 text-amber-300" /> : null}
              </div>
              <p className="mt-1 text-xs text-gray-500">{row.total} puan · {formatTL(row.salesTotal)} satış</p>
              <p className="text-xs font-bold text-emerald-300">
                Prim: {formatTL(row.commission.commission)} (%{row.commission.rate})
              </p>
            </button>
          ))}
        </div>
      </AppPagePanel>

      <div className="grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
        <AppPagePanel title="Temsilciler">
          <div className="space-y-2">
            {reps.map((rep) => {
              const row = leaderboard.find((item) => item.repLabel === rep.label)
              return (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => { setSelectedRep(rep.label); setTaskForm(emptyTaskForm(rep.label)) }}
                  className={`w-full rounded-2xl border px-3 py-3 text-left transition-colors ${
                    selectedRep === rep.label
                      ? 'border-blue-500/40 bg-blue-500/10'
                      : 'border-dark-500/40 bg-dark-800/55 hover:bg-dark-800/80'
                  }`}
                >
                  <p className="text-sm font-bold text-white">{rep.label}</p>
                  <p className="text-[11px] text-gray-500">
                    Sıra {row?.rank || '—'} · {row?.tasksOpen || 0} açık görev
                  </p>
                </button>
              )
            })}
          </div>
        </AppPagePanel>

        <AppPagePanel title={selectedRep ? `${selectedRep} Detayı` : 'Temsilci Detayı'}>
          {!detail ? (
            <p className="py-8 text-center text-sm text-gray-500">Temsilci seçin.</p>
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {TABS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                      tab === item.id ? 'bg-blue-500/20 text-blue-300' : 'text-gray-500 hover:bg-dark-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {tab === 'overview' && (
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Sıralama" value={`#${detail.rank || '—'}`} />
                  <MetricCard label="Puan" value={detail.points} />
                  <MetricCard label="Satış" value={formatTL(detail.commission.salesTotal)} />
                  <MetricCard label="Prim" value={formatTL(detail.commission.commission)} sub={`%${detail.commission.rate}`} />
                  <MetricCard label="Teklif" value={detail.quotes.length} />
                  <MetricCard label="Sipariş" value={detail.orders.length} />
                  <MetricCard label="Müşteri" value={detail.customers.length} />
                  <MetricCard label="Görev" value={detail.tasks.length} />
                </div>
              )}

              {tab === 'tasks' && (
                <div className="space-y-4">
                  <form onSubmit={handleAssignTask} className="rounded-2xl border border-dark-500/40 bg-dark-800/55 p-4">
                    <p className="mb-3 text-sm font-black text-white">Görev Ata</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input className="form-input text-sm" placeholder="Görev başlığı" value={taskForm.title} onChange={(e) => setTaskForm((c) => ({ ...c, title: e.target.value }))} required />
                      <select className="form-input text-sm" value={taskForm.repLabel} onChange={(e) => setTaskForm((c) => ({ ...c, repLabel: e.target.value }))}>
                        {reps.map((rep) => <option key={rep.id} value={rep.label}>{rep.label}</option>)}
                      </select>
                      <select className="form-input text-sm" value={taskForm.customerId} onChange={(e) => setTaskForm((c) => ({ ...c, customerId: e.target.value }))}>
                        <option value="">Müşteri (opsiyonel)</option>
                        {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.company || customer.name}</option>)}
                      </select>
                      <select className="form-input text-sm" value={taskForm.stageId} onChange={(e) => setTaskForm((c) => ({ ...c, stageId: e.target.value }))}>
                        {settings.taskStages.map((stage) => <option key={stage.id} value={stage.id}>{stage.label}</option>)}
                      </select>
                      <input type="date" className="form-input text-sm" value={taskForm.dueDate} onChange={(e) => setTaskForm((c) => ({ ...c, dueDate: e.target.value }))} />
                      <button type="submit" className={`${BTN_SUCCESS} gap-1.5 px-4 py-2 text-xs`}><Plus className="h-4 w-4" /> Görevi Ata</button>
                    </div>
                  </form>

                  <TaskList
                    tasks={detail.tasks}
                    stages={settings.taskStages}
                    onToggle={(task) => {
                      updateFieldSalesTask(task.id, { status: task.status === 'done' ? 'open' : 'done' })
                      refresh()
                    }}
                    onStage={(task, stageId) => {
                      updateFieldSalesTask(task.id, { stageId })
                      refresh()
                    }}
                  />
                </div>
              )}

              {tab === 'quotes' && (
                <SimpleRows
                  rows={detail.quotes.map((quote) => ({
                    id: quote.id,
                    primary: quote.title || quote.customer,
                    secondary: quote.status,
                    value: formatTL((quote.items || []).reduce((s, i) => s + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0)),
                  }))}
                  empty="Teklif bulunamadı."
                />
              )}

              {tab === 'orders' && (
                <SimpleRows
                  rows={detail.orders.map((order) => ({
                    id: order.id,
                    primary: order.title || order.customer,
                    secondary: order.status,
                    value: formatTL(orderTotals(order).grandTotal),
                  }))}
                  empty="Sipariş bulunamadı."
                />
              )}

              {tab === 'sales' && (
                <SimpleRows
                  rows={detail.invoices.map((invoice) => ({
                    id: invoice.id,
                    primary: invoice.customerName || invoice.title,
                    secondary: invoice.invoiceNo || invoice.status,
                    value: formatTL(invoice.totalAmount),
                  }))}
                  empty="Satış faturası bulunamadı."
                />
              )}

              {tab === 'messages' && (
                <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-2">
                    {reps.filter((rep) => rep.label !== selectedRep).map((rep) => (
                      <button
                        key={rep.id}
                        type="button"
                        onClick={() => setMessagePeer(rep.label)}
                        className={`w-full rounded-xl border px-3 py-2 text-left text-xs font-bold ${
                          messagePeer === rep.label ? 'border-purple-500/40 bg-purple-500/10 text-purple-200' : 'border-dark-500/40 text-gray-400'
                        }`}
                      >
                        {rep.label}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-2xl border border-dark-500/40 bg-dark-800/55 p-4">
                    {!messagePeer ? (
                      <p className="py-8 text-center text-sm text-gray-500">Mesajlaşmak için temsilci seçin.</p>
                    ) : (
                      <>
                        <div className="mb-3 max-h-64 space-y-2 overflow-y-auto">
                          {conversation.length === 0 ? (
                            <p className="text-center text-xs text-gray-500">Henüz mesaj yok.</p>
                          ) : conversation.map((msg) => (
                            <div
                              key={msg.id}
                              className={`rounded-xl px-3 py-2 text-xs ${
                                msg.fromRepLabel === selectedRep
                                  ? 'ml-8 bg-blue-500/15 text-blue-100'
                                  : 'mr-8 bg-dark-700/70 text-gray-200'
                              }`}
                            >
                              <p className="font-bold">{msg.fromRepLabel}</p>
                              <p>{msg.text}</p>
                            </div>
                          ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex gap-2">
                          <input className="form-input flex-1 text-sm" value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder={`${messagePeer} temsilcisine mesaj...`} />
                          <button type="submit" className={`${BTN_PRIMARY} px-3 py-2 text-xs`}><Send className="h-4 w-4" /></button>
                        </form>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}

function MetricCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-dark-500/40 bg-dark-800/55 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-black text-white">{value}</p>
      {sub ? <p className="text-[11px] text-gray-500">{sub}</p> : null}
    </div>
  )
}

function SimpleRows({ rows, empty }) {
  if (!rows.length) return <p className="py-8 text-center text-sm text-gray-500">{empty}</p>
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center justify-between rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3">
          <div>
            <p className="text-sm font-bold text-white">{row.primary}</p>
            <p className="text-xs text-gray-500">{row.secondary}</p>
          </div>
          <p className="text-sm font-black text-emerald-300">{row.value}</p>
        </div>
      ))}
    </div>
  )
}

function TaskList({ tasks, stages, onToggle, onStage }) {
  if (!tasks.length) return <p className="py-6 text-center text-sm text-gray-500">Görev bulunamadı.</p>
  return (
    <div className="space-y-2">
      {tasks.map((task) => {
        const stage = stages.find((item) => item.id === task.stageId)
        return (
          <div key={task.id} className="grid items-center gap-3 rounded-2xl border border-dark-500/40 bg-dark-800/55 px-3 py-3 md:grid-cols-[minmax(0,1fr)_160px_120px]">
            <div>
              <p className={`text-sm font-bold ${task.status === 'done' ? 'text-gray-500 line-through' : 'text-white'}`}>{task.title}</p>
              <p className="text-[11px] text-gray-500">{task.assignedBy ? `Atayan: ${task.assignedBy}` : '—'} · {task.dueDate || 'Tarihsiz'}</p>
            </div>
            <select className="form-input text-xs" value={task.stageId || stages[0]?.id || ''} onChange={(e) => onStage(task, e.target.value)}>
              {stages.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
            <button type="button" onClick={() => onToggle(task)} className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300">
              {task.status === 'done' ? 'Geri Al' : 'Tamamla'}
            </button>
          </div>
        )
      })}
    </div>
  )
}
