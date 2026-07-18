export const PROJECT_STATUS = {
  PLANNING: 'Planlama',
  DESIGN: 'Tasarım',
  PRODUCTION: 'Üretim',
  WAITING: 'Beklemede',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
}

export const PROJECT_STATUS_OPTIONS = [
  PROJECT_STATUS.PLANNING,
  PROJECT_STATUS.DESIGN,
  PROJECT_STATUS.PRODUCTION,
  PROJECT_STATUS.WAITING,
  PROJECT_STATUS.COMPLETED,
  PROJECT_STATUS.CANCELLED,
]

export const PROJECT_STATUS_STYLES = {
  [PROJECT_STATUS.PLANNING]: 'badge-blue',
  [PROJECT_STATUS.DESIGN]: 'badge-purple',
  [PROJECT_STATUS.PRODUCTION]: 'badge-orange',
  [PROJECT_STATUS.WAITING]: 'badge-gray',
  [PROJECT_STATUS.COMPLETED]: 'badge-green',
  [PROJECT_STATUS.CANCELLED]: 'badge-red',
}

export function isCompletedStatus(status) {
  return status === PROJECT_STATUS.COMPLETED
}

export function isCancelledStatus(status) {
  return status === PROJECT_STATUS.CANCELLED
}

export function isOngoingStatus(status) {
  return !isCompletedStatus(status) && !isCancelledStatus(status)
}

export function filterProjectsByScope(projects, scope = 'all') {
  if (scope === 'ongoing') return projects.filter((item) => isOngoingStatus(item.status))
  if (scope === 'completed') return projects.filter((item) => isCompletedStatus(item.status))
  if (scope === 'cancelled') return projects.filter((item) => isCancelledStatus(item.status))
  return projects
}
