import { loadOrders } from './ordersStore'
import { loadQuotes } from './quotesStore'
import { getLineQuantityRows } from './productionLineItems'

function parseTimestamp(value) {
  if (!value) return null
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})(?:[, ]+\s*(\d{1,2}):(\d{2}))?/)
  if (trMatch) {
    const [, day, month, year, hours = '0', minutes = '0'] = trMatch
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)).getTime()
  }
  const isoDate = raw.split(/[T ]/)[0]
  const [year, month, day] = isoDate.split('-')
  if (year && month && day) {
    const timePart = raw.includes('T') ? raw.split('T')[1] : raw.split(' ')[1]
    const [hours = '0', minutes = '0'] = (timePart || '').split(':')
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hours), Number(minutes)).getTime()
  }
  const parsed = new Date(raw)
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
}

function pickLatestTimestamp(values = []) {
  let latest = ''
  let latestTime = -Infinity
  values.forEach((value) => {
    const time = parseTimestamp(value)
    if (time != null && time >= latestTime) {
      latestTime = time
      latest = value
    }
  })
  return latest
}

function pickEarliestTimestamp(values = []) {
  let earliest = ''
  let earliestTime = Infinity
  values.forEach((value) => {
    const time = parseTimestamp(value)
    if (time != null && time <= earliestTime) {
      earliestTime = time
      earliest = value
    }
  })
  return earliest
}

function findProductionStartDate(job, lineItems = []) {
  const timestamps = []
  lineItems.forEach((line) => {
    if (line?.productionStartedAt) timestamps.push(line.productionStartedAt)
    getLineQuantityRows(line).forEach((row) => {
      if (row?.productionStartedAt) timestamps.push(row.productionStartedAt)
      Object.values(row?.stageTimestamps || {}).forEach((value) => {
        if (value) timestamps.push(value)
      })
    })
  })
  const fromRows = pickEarliestTimestamp(timestamps)
  if (fromRows) return fromRows

  const activities = Array.isArray(job?.activities) ? job.activities : []
  const productionActivity = activities.find((entry) => /üretime/i.test(entry?.text || ''))
  if (productionActivity?.date) return productionActivity.date

  const oldestActivity = activities[activities.length - 1]?.date
  return oldestActivity || job?.createdAt || ''
}

function findJobCompletedDate(job, lineItems = []) {
  if (!lineItems.length) return ''

  const allLinesCompleted = lineItems.every((line) => line.fulfillmentStatus === 'Tamamlandı')
  if (!allLinesCompleted) return ''

  const timestamps = []
  lineItems.forEach((line) => {
    getLineQuantityRows(line).forEach((row) => {
      if (row.fulfillmentStatus === 'Tamamlandı') {
        if (row.statusUpdatedAt) timestamps.push(row.statusUpdatedAt)
        if (row.deliveredUpdatedAt) timestamps.push(row.deliveredUpdatedAt)
      }
    })
    if (line.productionClosedAt) timestamps.push(line.productionClosedAt)
  })

  return pickLatestTimestamp(timestamps)
}

export function getProductionJobTimelineDates(job, lineItems = [], options = {}) {
  const orders = options.orders || loadOrders()
  const quotes = options.quotes || loadQuotes()
  const order = orders.find((entry) => entry.id === job?.orderId || entry.id === job?.id) || null
  const quoteId = order?.quoteId || null
  const quote = quoteId ? quotes.find((entry) => entry.id === quoteId) : null

  return {
    quoteDate: quote?.createdAt || '',
    orderDate: order?.createdAt || order?.date || job?.createdAt || '',
    productionStartDate: findProductionStartDate(job, lineItems),
    completedDate: findJobCompletedDate(job, lineItems),
  }
}
