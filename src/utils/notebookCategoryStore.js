export const NOTEBOOK_CATEGORIES_KEY = 'bach-notebook-categories'
export const NOTEBOOK_CATEGORIES_EVENT = 'bach:notebook-categories-updated'

export const NOTEBOOK_NOTE_URGENCIES = [
  { id: 'normal', label: 'Normal', color: 'bg-blue-500' },
  { id: 'acil', label: 'Acil', color: 'bg-rose-500' },
]

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

function normalizeUrgency(value) {
  return String(value || '').toLocaleLowerCase('tr-TR') === 'acil' ? 'acil' : 'normal'
}

function normalizeNote(note, index = 0, fallbackCreatedAt) {
  if (!note || !String(note.content || '').trim()) return null
  return {
    id: note.id || createId(`nb-note-${index}`),
    content: String(note.content || '').trim(),
    urgency: normalizeUrgency(note.urgency),
    createdAt: note.createdAt || fallbackCreatedAt || new Date().toISOString(),
    sortIndex: Number.isFinite(note.sortIndex) ? note.sortIndex : index,
  }
}

function normalizeCategory(category) {
  if (!category || typeof category !== 'object') return null
  const title = String(category.title || '').trim()
  if (!title) return null
  const createdAt = category.createdAt || new Date().toISOString()
  let notes = Array.isArray(category.notes)
    ? category.notes.map((note, index) => normalizeNote(note, index, createdAt)).filter(Boolean)
    : []
  const legacyContent = String(category.content || '').trim()
  if (!notes.length && legacyContent) {
    notes = [
      normalizeNote(
        { content: legacyContent, createdAt, urgency: 'normal', sortIndex: 0 },
        0,
        createdAt,
      ),
    ].filter(Boolean)
  }
  notes = sortNotebookNotes(notes)
  return {
    id: category.id || createId('nb-cat'),
    title,
    content: notes.map((note) => note.content).join('\n\n'),
    notes,
    createdAt,
    updatedAt: category.updatedAt || createdAt,
    sortIndex: Number.isFinite(category.sortIndex) ? category.sortIndex : undefined,
  }
}

export function sortNotebookNotes(notes = []) {
  const hasManualOrder = notes.some((note) => Number.isFinite(note?.sortIndex))
  return [...notes].sort((left, right) => {
    if (hasManualOrder) {
      const leftOrder = Number.isFinite(left.sortIndex) ? left.sortIndex : Number.MAX_SAFE_INTEGER
      const rightOrder = Number.isFinite(right.sortIndex)
        ? right.sortIndex
        : Number.MAX_SAFE_INTEGER
      if (leftOrder !== rightOrder) return leftOrder - rightOrder
    }
    return Date.parse(right.createdAt || 0) - Date.parse(left.createdAt || 0)
  })
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
    return (
      Date.parse(right.updatedAt || right.createdAt || 0) -
      Date.parse(left.updatedAt || left.createdAt || 0)
    )
  })
}

export function getNotebookCategory(categoryId) {
  return loadNotebookCategories().find((item) => item.id === categoryId) || null
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

export function appendNotebookCategoryNote(categoryId, content, urgency = 'normal') {
  const text = String(content || '').trim()
  if (!categoryId || !text) return null
  const categories = loadNotebookCategories()
  const index = categories.findIndex((item) => item.id === categoryId)
  if (index < 0) return null
  const now = new Date().toISOString()
  const current = categories[index]
  const notes = sortNotebookNotes(current.notes || [])
  const note = normalizeNote(
    {
      id: createId('nb-note'),
      content: text,
      urgency,
      createdAt: now,
      sortIndex: -1,
    },
    0,
    now,
  )
  const nextNotes = [note, ...notes].map((item, sortIndex) => ({ ...item, sortIndex }))
  const nextCategory = normalizeCategory({
    ...current,
    notes: nextNotes,
    updatedAt: now,
  })
  saveNotebookCategories(categories.map((item) => (item.id === categoryId ? nextCategory : item)))
  return nextCategory
}

export function updateNotebookCategoryNote(categoryId, noteId, patch = {}) {
  const categories = loadNotebookCategories()
  const index = categories.findIndex((item) => item.id === categoryId)
  if (index < 0) return null
  const current = categories[index]
  const notes = (current.notes || []).map((note) =>
    note.id === noteId
      ? normalizeNote(
          {
            ...note,
            ...patch,
            id: note.id,
          },
          note.sortIndex,
          note.createdAt,
        )
      : note,
  )
  const nextCategory = normalizeCategory({
    ...current,
    notes: notes.filter(Boolean),
    updatedAt: new Date().toISOString(),
  })
  saveNotebookCategories(categories.map((item) => (item.id === categoryId ? nextCategory : item)))
  return nextCategory
}

export function deleteNotebookCategoryNote(categoryId, noteId) {
  const categories = loadNotebookCategories()
  const index = categories.findIndex((item) => item.id === categoryId)
  if (index < 0) return null
  const current = categories[index]
  const nextCategory = normalizeCategory({
    ...current,
    notes: (current.notes || []).filter((note) => note.id !== noteId),
    updatedAt: new Date().toISOString(),
  })
  saveNotebookCategories(categories.map((item) => (item.id === categoryId ? nextCategory : item)))
  return nextCategory
}

export function reorderNotebookCategoryNotes(categoryId, orderedIds = []) {
  const categories = loadNotebookCategories()
  const index = categories.findIndex((item) => item.id === categoryId)
  if (index < 0) return null
  const current = categories[index]
  const byId = new Map((current.notes || []).map((note) => [note.id, note]))
  const nextNotes = []
  const seen = new Set()
  orderedIds.forEach((id, sortIndex) => {
    const note = byId.get(id)
    if (!note || seen.has(id)) return
    nextNotes.push({ ...note, sortIndex })
    seen.add(id)
  })
  ;(current.notes || []).forEach((note) => {
    if (seen.has(note.id)) return
    nextNotes.push({ ...note, sortIndex: nextNotes.length })
  })
  const nextCategory = normalizeCategory({
    ...current,
    notes: nextNotes,
    updatedAt: new Date().toISOString(),
  })
  saveNotebookCategories(categories.map((item) => (item.id === categoryId ? nextCategory : item)))
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
