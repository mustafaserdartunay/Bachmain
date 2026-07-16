const STORAGE_KEY = 'bach-process-workspace-prefs'

export function readProcessWorkspacePrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function getModuleViewPref(moduleId, fallback = 'kanban') {
  const prefs = readProcessWorkspacePrefs()
  const view = prefs?.[moduleId]?.view
  return typeof view === 'string' && view ? view : fallback
}

export function setModuleViewPref(moduleId, view) {
  try {
    const prefs = readProcessWorkspacePrefs()
    prefs[moduleId] = { ...(prefs[moduleId] || {}), view, updatedAt: new Date().toISOString() }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
    window.dispatchEvent(new CustomEvent('bach:process-workspace-prefs', { detail: { moduleId, view } }))
  } catch {
    // ignore
  }
}

export { STORAGE_KEY as PROCESS_WORKSPACE_PREFS_KEY }
