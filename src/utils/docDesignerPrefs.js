const FAV_KEY = 'bach-doc-template-favorites'
const RECENT_KEY = 'bach-doc-template-recent'

export function listFavoriteTemplateIds() {
  try {
    const raw = JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function toggleFavoriteTemplate(id) {
  const list = listFavoriteTemplateIds()
  const next = list.includes(id) ? list.filter((x) => x !== id) : [id, ...list].slice(0, 40)
  localStorage.setItem(FAV_KEY, JSON.stringify(next))
  return next
}

export function listRecentTemplates() {
  try {
    const raw = JSON.parse(localStorage.getItem(RECENT_KEY) || '[]')
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

export function pushRecentTemplate(entry) {
  const list = listRecentTemplates().filter((x) => x.id !== entry.id)
  list.unshift({ id: entry.id, name: entry.name, at: new Date().toISOString() })
  localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 20)))
  return list
}
