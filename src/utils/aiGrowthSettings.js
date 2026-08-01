const SETTINGS_KEY = 'bach-ai-growth-settings'
const USAGE_KEY = 'bach-ai-growth-usage'
const LIBRARY_KEY = 'bach-ai-growth-library'
const CALENDAR_KEY = 'bach-ai-growth-calendar'
const AUTOMATION_KEY = 'bach-ai-growth-automation'

/** Display labels → API model ids (dynamic list can override). */
export const AI_GROWTH_MODEL_PRESETS = [
  { id: 'gpt-5.5-pro', label: 'GPT-5.5 Pro (en yüksek kalite)' },
  { id: 'gpt-5.5', label: 'GPT-5.5 (önerilen)' },
  { id: 'gpt-5', label: 'GPT-5' },
  { id: 'gpt-4.1', label: 'GPT-4.1' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
]

/** Rough USD / 1M tokens (estimate only). */
export const AI_GROWTH_MODEL_RATES = {
  'gpt-5.5-pro': { input: 30, output: 180 },
  'gpt-5.5': { input: 5, output: 30 },
  'gpt-5': { input: 4, output: 12 },
  'gpt-4.1': { input: 2, output: 8 },
  'gpt-4o': { input: 2.5, output: 10 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
}

const DEFAULT_SETTINGS = {
  apiKey: '',
  model: 'gpt-5.5',
  brandVoice: 'Profesyonel, samimi, satış odaklı',
  industry: 'Genel',
  companyName: '',
  website: '',
  language: 'tr',
}

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

export function readAiGrowthSettings() {
  return { ...DEFAULT_SETTINGS, ...readJson(SETTINGS_KEY, {}) }
}

export function saveAiGrowthSettings(patch) {
  const next = { ...readAiGrowthSettings(), ...patch }
  writeJson(SETTINGS_KEY, next)
  window.dispatchEvent(new CustomEvent('bach:ai-growth-settings'))
  return next
}

export function estimateCostUsd(model, promptTokens = 0, completionTokens = 0) {
  const rates = AI_GROWTH_MODEL_RATES[model] || AI_GROWTH_MODEL_RATES['gpt-4o']
  return (promptTokens / 1_000_000) * rates.input + (completionTokens / 1_000_000) * rates.output
}

export function readAiGrowthUsage() {
  return readJson(USAGE_KEY, { entries: [] })
}

export function recordAiGrowthUsage({
  model,
  promptTokens = 0,
  completionTokens = 0,
  feature = 'general',
}) {
  const costUsd = estimateCostUsd(model, promptTokens, completionTokens)
  const data = readAiGrowthUsage()
  const entry = {
    id: `u-${Date.now()}`,
    at: new Date().toISOString(),
    model,
    feature,
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
    costUsd,
  }
  const next = { entries: [entry, ...(data.entries || [])].slice(0, 2000) }
  writeJson(USAGE_KEY, next)
  window.dispatchEvent(new CustomEvent('bach:ai-growth-usage'))
  return entry
}

export function summarizeAiGrowthUsage(entries = readAiGrowthUsage().entries || []) {
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const monthEntries = entries.filter((e) => String(e.at || '').startsWith(monthKey))
  const sum = (list, key) => list.reduce((acc, row) => acc + Number(row[key] || 0), 0)
  return {
    monthKey,
    monthTokens: sum(monthEntries, 'totalTokens'),
    monthCostUsd: sum(monthEntries, 'costUsd'),
    totalTokens: sum(entries, 'totalTokens'),
    totalCostUsd: sum(entries, 'costUsd'),
    count: entries.length,
    monthCount: monthEntries.length,
  }
}

export function readAiGrowthLibrary() {
  return readJson(LIBRARY_KEY, { items: [] })
}

export function saveAiGrowthLibraryItem(item) {
  const data = readAiGrowthLibrary()
  const nextItem = {
    id: item.id || `c-${Date.now()}`,
    createdAt: item.createdAt || new Date().toISOString(),
    status: item.status || 'draft',
    ...item,
  }
  writeJson(LIBRARY_KEY, { items: [nextItem, ...(data.items || [])].slice(0, 500) })
  window.dispatchEvent(new CustomEvent('bach:ai-growth-library'))
  return nextItem
}

export function readAiGrowthCalendar() {
  return readJson(CALENDAR_KEY, { posts: [] })
}

export function saveAiGrowthCalendarPost(post) {
  const data = readAiGrowthCalendar()
  const next = {
    id: post.id || `p-${Date.now()}`,
    status: post.status || 'planned',
    ...post,
  }
  const posts = [...(data.posts || [])]
  const idx = posts.findIndex((row) => row.id === next.id)
  if (idx >= 0) posts[idx] = next
  else posts.push(next)
  writeJson(CALENDAR_KEY, { posts })
  window.dispatchEvent(new CustomEvent('bach:ai-growth-calendar'))
  return next
}

export function readAiGrowthAutomations() {
  return readJson(AUTOMATION_KEY, { rules: [] })
}

export function saveAiGrowthAutomation(rule) {
  const data = readAiGrowthAutomations()
  const next = { id: rule.id || `r-${Date.now()}`, enabled: true, ...rule }
  const rules = [...(data.rules || [])]
  const idx = rules.findIndex((row) => row.id === next.id)
  if (idx >= 0) rules[idx] = next
  else rules.unshift(next)
  writeJson(AUTOMATION_KEY, { rules })
  return next
}

export function deleteAiGrowthAutomation(id) {
  const data = readAiGrowthAutomations()
  writeJson(AUTOMATION_KEY, { rules: (data.rules || []).filter((row) => row.id !== id) })
}
