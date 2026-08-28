export const NOTEBOOK_CATEGORIES_KEY = 'bach-notebook-categories'
export const NOTEBOOK_CATEGORIES_EVENT = 'bach:notebook-categories-updated'

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
}

function readJson(key, fallback) {
  try {
    const saved = localStorage.getItem(key)
    if (!saved) return fallback
    const parsed = JSON.parse(saved)
    return parsed ?? fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
  window.dispatchEvent(new CustomEvent(NOTEBOOK_CATEGORIES_EVENT))
  window.dispatchEvent(new CustomEvent('bach:crm-updated'))
}

function normalizeCategory(category) {
  if (!category || typeof category !== 'object') return null
  const title = String(category.title || '').trim()
  if (!title) return null
  const notes = Array.isArray(category.notes)
    ? category.notes
        .filter((note) => note && String(note.content || '').trim())
        .map((note, index) => ({
          id: note.id || createId(`nb-note-${index}`),
          content: String(note.content || '').trim(),
          createdAt: note.createdAt || category.createdAt || new Date().toISOString(),
        }))
    : []
  const legacyContent = String(category.content || '').trim()
  if (!notes.length && legacyContent) {
    notes.push({
      id: createId('nb-note-legacy'),
      content: legacyContent,
      createdAt: category.createdAt || new Date().toISOString(),
    })
  }
  return {
    id: category.id || createId('nb-cat'),
    title,
    content: notes.map((note) => note.content).join('\n\n'),
    notes,
    createdAt: category.createdAt || new Date().toISOString(),
    updatedAt: category.updatedAt || category.createdAt || new Date().toISOString(),
    sortIndex: Number.isFinite(category.sortIndex) ? category.sortIndex : undefined,
  }
}

export function loadNotebookCategories() {
  const saved = readJson(NOTEBOOK_CATEGORIES_KEY, [])
  if (!Array.isArray(saved)) return []
  return saved.map(normalizeCategory).filter(Boolean)
}

export function saveNotebookCategories(categories) {
  const next = (Array.isArray(categories) ? categories : []).map(normalizeCategory).filter(Boolean)
  writeJson(NOTEBOOK_CATEGORIES_KEY, next)
  return next
}

export function sortNotebookCategories(categories = []) {
  const hasManualOrder = categories.some((item) => Number.isFinite(item?.sortIndex))
  return [...categories].sort((left, right) => {
    if (hasManualOrder) {
      const leftOrder = Number.isFinite(left.sortIndex) ? left.sortIndex : Number.MAX_SAFE_INTEGER
      const rightOrder = Number.isFinite(right.sortIndex)
        ? right.sortIndex
        : Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
    }
    const leftTime = Date.parse(left.updatedAt || left.createdAt || 0)
    const rightTime = Date.parse(right.updatedAt || right.createdAt || 0)
    return rightTime - leftTime
  })
}

export function upsertNotebookCategory(category) {
  const categories = loadNotebookCategories()
  const now = new Date().toISOString()
  const index = categories.findIndex((item) => item.id === category.id)

  if (index >= 0) {
    const merged = normalizeCategory({
      ...categories[index],
      ...category,
      updatedAt: now,
    })
    const next = categories.map((item) => (item.id === category.id ? merged : item))
    saveNotebookCategories(next)
    return merged
  }

  const created = normalizeCategory({
    ...category,
    id: category.id || createId('nb-cat'),
    title: String(category.title || 'Yeni Buton').trim() || 'Yeni Buton',
    createdAt: now,
    updatedAt: now,
  })
  const hasManualOrder = categories.some((item) => Number.isFinite(item.sortIndex))
  const next = hasManualOrder
    ? [{ ...created, sortIndex: -1 }, ...categories].map((item, sortIndex) => ({
        ...item,
        sortIndex,
      }))
    : [created, ...categories]
  saveNotebookCategories(next)
  return created
}

export function appendNotebookCategoryNote(categoryId, content) {
  const text = String(content || '').trim()
  if (!categoryId || !text) return null
  const categories = loadNotebookCategories()
  const index = categories.findIndex((item) => item.id === categoryId)
  if (index < 0) return null
  const now = new Date().toISOString()
  const note = {
    id: createId('nb-note'),
    content: text,
    createdAt: now,
  }
  const current = categories[index]
  const notes = [...(current.notes || []), note]
  const nextCategory = normalizeCategory({
    ...current,
    notes,
    updatedAt: now,
  })
  const next = categories.map((item) => (item.id === categoryId ? nextCategory : item))
  saveNotebookCategories(next)
  return nextCategory
}

export function deleteNotebookCategory(categoryId) {
  const categories = loadNotebookCategories()
  saveNotebookCategories(categories.filter((item) => item.id !== categoryId))
}

export function reorderNotebookCategories(orderedIds = []) {
  const categories = loadNotebookCategories()
  const byId = new Map(categories.map((item) => [item.id, item]))
  const next = []
  const seen = new Set()
  orderedIds.forEach((id, sortIndex) => {
    const item = byId.get(id)
    if (!item || seen.has(id)) return
    next.push({ ...item, sortIndex })
    seen.add(id)
  })
  categories.forEach((item) => {
    if (seen.has(item.id)) return
    next.push({ ...item, sortIndex: next.length })
  })
  saveNotebookCategories(next)
  return next
}

export function uniqueNotebookCategoryTitle(label, categories = loadNotebookCategories()) {
  const base = String(label || 'Yeni Buton').trim() || 'Yeni Buton'
  const used = new Set(
    categories.map((item) =>
      String(item.title || '')
        .trim()
        .toLocaleLowerCase('tr-TR'),
    ),
  )
  if (!used.has(base.toLocaleLowerCase('tr-TR'))) return base
  let index = 2
  while (used.has(`${base} ${index}`.toLocaleLowerCase('tr-TR'))) index += 1
  return `${base} ${index}`
}
