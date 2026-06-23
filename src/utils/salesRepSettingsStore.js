const STORAGE_KEY = 'erlenbox-sales-rep-settings'

export const DEFAULT_SALES_REP_SETTINGS = {
  baseCommissionRate: 10,
  winnerCommissionRate: 15,
  pointsPerSale: 100,
  pointsPerQuote: 25,
  pointsPerTask: 10,
  taskStages: [
    { id: 'srs-assigned', label: 'Atandı', color: 'blue' },
    { id: 'srs-progress', label: 'Devam Ediyor', color: 'orange' },
    { id: 'srs-visit', label: 'Ziyaret Edildi', color: 'purple' },
    { id: 'srs-done', label: 'Tamamlandı', color: 'emerald' },
  ],
}

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SALES_REP_SETTINGS }
    return { ...DEFAULT_SALES_REP_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SALES_REP_SETTINGS }
  }
}

export function loadSalesRepSettings() {
  const settings = readRaw()
  return {
    ...settings,
    taskStages: Array.isArray(settings.taskStages) && settings.taskStages.length
      ? settings.taskStages
      : DEFAULT_SALES_REP_SETTINGS.taskStages,
  }
}

export function saveSalesRepSettings(patch) {
  const next = { ...loadSalesRepSettings(), ...patch }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('bach:sales-rep-settings-updated'))
  return next
}

export function saveSalesRepTaskStages(taskStages) {
  return saveSalesRepSettings({ taskStages })
}
