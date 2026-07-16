/**
 * Normalized process item shape shared by all workspace views.
 * @typedef {object} ProcessItem
 * @property {string} id
 * @property {string} title
 * @property {string} [stageId]
 * @property {string} [status]
 * @property {string} [kind]
 * @property {string} [company]
 * @property {string} [customer]
 * @property {string} [assignee]
 * @property {string[]} [tags]
 * @property {string} [priority]
 * @property {string} [dueDate] ISO date
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {number} [progress] 0-100
 * @property {number} [fileCount]
 * @property {number} [commentCount]
 * @property {string} [createdAt]
 * @property {object} [raw] original record
 */

export function createEmptyFilters() {
  return {
    company: '',
    branch: '',
    warehouse: '',
    assignee: '',
    status: '',
    tag: '',
    dateFrom: '',
    dateTo: '',
    priority: '',
    customer: '',
    firm: '',
    search: '',
  }
}

export function filterProcessItems(items = [], filters = createEmptyFilters()) {
  const q = String(filters.search || '').trim().toLowerCase()
  return items.filter((item) => {
    if (filters.assignee && item.assignee !== filters.assignee) return false
    if (filters.status && item.stageId !== filters.status && item.status !== filters.status) return false
    if (filters.priority && item.priority !== filters.priority) return false
    if (filters.customer && !String(item.customer || '').toLowerCase().includes(String(filters.customer).toLowerCase())) return false
    if (filters.firm && !String(item.company || '').toLowerCase().includes(String(filters.firm).toLowerCase())) return false
    if (filters.tag && !(item.tags || []).some((t) => String(t).toLowerCase().includes(String(filters.tag).toLowerCase()))) return false
    if (filters.dateFrom && item.dueDate && item.dueDate < filters.dateFrom) return false
    if (filters.dateTo && item.dueDate && item.dueDate > filters.dateTo) return false
    if (!q) return true
    const hay = [item.title, item.customer, item.company, item.assignee, ...(item.tags || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}
