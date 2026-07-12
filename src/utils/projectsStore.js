const STORAGE_KEY = 'erlenbox-projects'
export const PROJECTS_UPDATED_EVENT = 'bach:projects-updated'

function readProjects() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeProjects(projects) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects))
  window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT))
}

export function loadProjects() {
  return readProjects()
}

export function saveProjects(projects) {
  writeProjects(projects)
  return projects
}

export function upsertProject(project) {
  const list = readProjects()
  const index = list.findIndex((item) => item.id === project.id)
  const next = index >= 0
    ? list.map((item, i) => (i === index ? project : item))
    : [project, ...list]
  writeProjects(next)
  return project
}

export function softDeleteProject(projectId) {
  const list = readProjects()
  const project = list.find((item) => item.id === projectId)
  if (!project) return null
  writeProjects(list.filter((item) => item.id !== projectId))
  return project
}
