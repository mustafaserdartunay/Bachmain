import { quotes } from '../data/mockData'
import { loadProductionJobs } from './productionStore'
import { detailedOrders } from '../data/ordersData'
import { loadTasks, loadAppointments } from './crmStore'
import { isTaskCompleted } from './crmProcessHelpers'
import { getCustomerProfiles } from '../data/customerProfiles'
import { formatCurrency } from '../data/mockData'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

function offsetDate(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function parseDate(value) {
  if (!value) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const parts = String(value).split('.')
  if (parts.length === 3) {
    const [day, month, year] = parts
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function daysUntil(dateIso) {
  if (!dateIso) return 0
  const today = new Date(todayIso())
  const target = new Date(`${dateIso}T12:00:00`)
  return Math.round((target - today) / 86400000)
}

function buildAlert({ id, category, title, subtitle, date, amount, recurring = false, link, meta = {} }) {
  const dateIso = parseDate(date) || date
  const diff = daysUntil(dateIso)
  const overdue = diff < 0
  const dueToday = diff === 0
  return {
    id,
    category,
    title,
    subtitle,
    date: dateIso,
    dateLabel: formatDateLabel(dateIso),
    amount,
    recurring,
    overdue,
    dueToday,
    daysUntil: diff,
    urgency: overdue ? 'overdue' : dueToday ? 'today' : diff <= 3 ? 'soon' : 'normal',
    link,
    meta,
  }
}

function formatDateLabel(dateIso) {
  if (!dateIso) return ''
  const date = new Date(`${dateIso}T12:00:00`)
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

const recurringObligations = []
const paymentObligations = []

export function getActionTimeline() {
  const today = todayIso()
  const alerts = []

  paymentObligations.forEach((item) => {
    alerts.push(buildAlert({
      id: item.id,
      category: item.type === 'tahsilat' ? 'Tahsilat' : 'Ödeme',
      title: item.title,
      subtitle: item.customer,
      date: item.dueDate,
      amount: item.amount,
      link: item.orderId ? '/siparisler' : '/musteriler',
      meta: { orderId: item.orderId },
    }))
  })

  recurringObligations.forEach((item) => {
    alerts.push(buildAlert({
      id: item.id,
      category: item.type === 'tahsilat' ? 'Tekrarlayan Tahsilat' : 'Tekrarlayan Ödeme',
      title: item.title,
      subtitle: item.subtitle,
      date: item.dueDate,
      amount: item.amount,
      recurring: true,
      link: '/kasa',
    }))
  })

  loadTasks().filter((t) => t.status !== 'Tamamlandı').forEach((task) => {
    alerts.push(buildAlert({
      id: task.id,
      category: 'Görev',
      title: task.title,
      subtitle: `${task.customer} · ${task.assignee}`,
      date: task.dueDate,
      link: '/crm',
      meta: { priority: task.priority, status: task.status },
    }))
  })

  loadAppointments().filter((a) => a.status !== 'İptal' && a.status !== 'Tamamlandı').forEach((apt) => {
    alerts.push(buildAlert({
      id: apt.id,
      category: 'Randevu',
      title: apt.title,
      subtitle: `${apt.customer} · ${apt.startTime}`,
      date: apt.date,
      link: '/crm',
      meta: { type: apt.type },
    }))
  })

  quotes.list.filter((q) => q.status === 'Bekliyor').forEach((quote) => {
    alerts.push(buildAlert({
      id: quote.id,
      category: 'Teklif Süresi',
      title: `Teklif ${quote.id} son tarih`,
      subtitle: quote.customer,
      date: quote.expiry,
      amount: quote.amount,
      link: '/teklifler',
    }))
  })

  const productionJobs = loadProductionJobs()
  productionJobs.forEach((job) => {
    const endIso = parseDate(job.endDate)
    if (!endIso) return
    alerts.push(buildAlert({
      id: job.id || job.workOrder,
      category: 'Üretim Termin',
      title: `${job.product} · ${job.stage}`,
      subtitle: `${job.orderId} · ${job.quantity} adet`,
      date: endIso,
      link: '/uretim',
      meta: { status: job.status, workOrder: job.id || job.workOrder },
    }))
  })

  detailedOrders.filter((o) => o.paymentStatus === 'Bekliyor').forEach((order) => {
    alerts.push(buildAlert({
      id: `payment-${order.id}`,
      category: 'Sipariş Ödemesi',
      title: `${order.id} ödeme bekliyor`,
      subtitle: order.customer,
      date: parseDate(order.delivery) || offsetDate(2),
      amount: order.amount,
      link: '/siparisler',
      meta: { paymentStatus: order.paymentStatus },
    }))
  })

  getCustomerProfiles()
    .filter((c) => c.balance > 80000 && c.stage === 'Tahsilat')
    .slice(0, 3)
    .forEach((customer) => {
      alerts.push(buildAlert({
        id: `balance-${customer.id}`,
        category: 'Cari Risk',
        title: 'Yüksek açık bakiye',
        subtitle: customer.company,
        date: offsetDate(-2),
        amount: customer.balance,
        link: `/musteriler/${customer.id}`,
        meta: { score: customer.score },
      }))
    })

  return alerts.sort((a, b) => {
    if (a.overdue !== b.overdue) return a.overdue ? -1 : 1
    if (a.dueToday !== b.dueToday) return a.dueToday ? -1 : 1
    return a.date.localeCompare(b.date)
  })
}

export function getDashboardAnalytics() {
  const tasks = loadTasks()
  const appointments = loadAppointments()
  const today = todayIso()
  const timeline = getActionTimeline()

  const ordersActive = detailedOrders.filter((o) => !['Tamamlandı', 'İptal'].includes(o.status)).length
  const ordersLate = detailedOrders.filter((o) => {
    const delivery = parseDate(o.delivery)
    return delivery && delivery < today && o.status !== 'Tamamlandı'
  }).length

  const productionJobs = loadProductionJobs()
  const productionActive = productionJobs.filter((p) => p.status === 'Devam Ediyor').length
  const productionLate = productionJobs.filter((p) => parseDate(p.endDate) < today).length

  const quotesPending = quotes.summary.pending
  const quoteConversion = Math.round((quotes.summary.accepted / quotes.summary.total) * 100)

  const tasksOpen = tasks.filter((t) => !isTaskCompleted(t)).length
  const tasksDone = tasks.filter((t) => isTaskCompleted(t)).length
  const taskCompletion = tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0

  return {
    ordersActive,
    ordersLate,
    productionActive,
    productionLate,
    quotesPending,
    quoteConversion,
    tasksOpen,
    tasksOverdue: timeline.filter((a) => a.category === 'Görev' && a.overdue).length,
    appointmentsToday: appointments.filter((a) => a.date === today).length,
    overdueTotal: timeline.filter((a) => a.overdue).length,
    dueTodayTotal: timeline.filter((a) => a.dueToday).length,
    recurringTotal: timeline.filter((a) => a.recurring).length,
    tahsilatBekleyen: timeline.filter((a) => a.category.includes('Tahsilat') || a.category === 'Sipariş Ödemesi').reduce((s, a) => s + (a.amount || 0), 0),
    odemeBekleyen: timeline.filter((a) => a.category.includes('Ödeme')).reduce((s, a) => s + (a.amount || 0), 0),
    taskCompletion,
  }
}

export function getDetailedOrders() {
  return detailedOrders.filter((o) => o.status !== 'Tamamlandı' && o.status !== 'İptal')
}

export function getDetailedProduction() {
  return loadProductionJobs()
}

export function getDetailedQuotes() {
  return quotes.list
}

export function getDetailedCrm() {
  return {
    tasks: loadTasks(),
    appointments: loadAppointments().filter((a) => a.status !== 'İptal'),
  }
}

export { formatCurrency, formatDateLabel, daysUntil }
