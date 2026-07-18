export const CHEQUE_STATUS = {
  PORTFOLIO: 'portfolio',
  SENT: 'sent',
  COLLECTED: 'collected',
  PAID: 'paid',
  RETURNED: 'returned',
  DELETED: 'deleted',
}

export const CHEQUE_STATUS_TABS = [
  { id: 'all', label: 'Tümü' },
  { id: 'portfolio', label: 'Portföy' },
  { id: 'sent', label: 'Gönderilen' },
  { id: 'collected', label: 'Tahsil Edilen' },
  { id: 'paid', label: 'Ödenen' },
  { id: 'returned', label: 'İade' },
  { id: 'deleted', label: 'Silinen' },
]

export const CHEQUE_STATUS_META = {
  [CHEQUE_STATUS.PORTFOLIO]: {
    label: 'Portföy',
    badgeClass: 'badge-blue',
  },
  [CHEQUE_STATUS.SENT]: {
    label: 'Gönderilen',
    badgeClass: 'badge-orange',
  },
  [CHEQUE_STATUS.COLLECTED]: {
    label: 'Tahsil Edildi',
    badgeClass: 'badge-green',
  },
  [CHEQUE_STATUS.PAID]: {
    label: 'Ödendi',
    badgeClass: 'badge-purple',
  },
  [CHEQUE_STATUS.RETURNED]: {
    label: 'İade',
    badgeClass: 'badge-gray',
  },
  [CHEQUE_STATUS.DELETED]: {
    label: 'Silindi',
    badgeClass: 'badge-red',
  },
}

export function resolveChequeStatus(detail = {}) {
  if (detail.deleted || detail.deletedAt) return CHEQUE_STATUS.DELETED
  if (detail.returned || detail.returnedAt) return CHEQUE_STATUS.RETURNED
  if (detail.collected || detail.chequeCollected) return CHEQUE_STATUS.COLLECTED
  if (detail.paid || detail.chequePaid) return CHEQUE_STATUS.PAID
  if (detail.sent || detail.sentAt || detail.direction === 'out') return CHEQUE_STATUS.SENT
  return CHEQUE_STATUS.PORTFOLIO
}

export function normalizeChequeDetail(detail = {}) {
  const status = resolveChequeStatus(detail)
  return {
    ...detail,
    collected: Boolean(detail.collected || detail.chequeCollected),
    paid: Boolean(detail.paid || detail.chequePaid),
    sent: Boolean(detail.sent || detail.sentAt || detail.direction === 'out'),
    returned: Boolean(detail.returned || detail.returnedAt),
    deleted: Boolean(detail.deleted || detail.deletedAt),
    status,
    statusLabel: CHEQUE_STATUS_META[status]?.label || 'Portföy',
    statusBadgeClass: CHEQUE_STATUS_META[status]?.badgeClass || 'badge-gray',
  }
}

export function filterChequesByStatus(details = [], statusTab = 'all') {
  if (!statusTab || statusTab === 'all') {
    return details.filter((detail) => resolveChequeStatus(detail) !== CHEQUE_STATUS.DELETED)
  }
  return details.filter((detail) => resolveChequeStatus(detail) === statusTab)
}

export function countChequesByStatus(details = []) {
  const counts = {
    all: 0,
    portfolio: 0,
    sent: 0,
    collected: 0,
    paid: 0,
    returned: 0,
    deleted: 0,
  }
  details.forEach((detail) => {
    const status = resolveChequeStatus(detail)
    counts[status] = (counts[status] || 0) + 1
    if (status !== CHEQUE_STATUS.DELETED) counts.all += 1
  })
  return counts
}

export function isChequeActionAllowed(detail = {}, action) {
  const status = resolveChequeStatus(detail)
  switch (action) {
    case 'collection':
      return status === CHEQUE_STATUS.PORTFOLIO || status === CHEQUE_STATUS.SENT
    case 'payment':
      return status === CHEQUE_STATUS.PORTFOLIO || status === CHEQUE_STATUS.SENT
    case 'send':
      return status === CHEQUE_STATUS.PORTFOLIO
    case 'return':
      return status === CHEQUE_STATUS.PORTFOLIO || status === CHEQUE_STATUS.SENT
    case 'edit':
      return status !== CHEQUE_STATUS.DELETED
    case 'delete':
      return status !== CHEQUE_STATUS.DELETED
    case 'restore':
      return status === CHEQUE_STATUS.DELETED || status === CHEQUE_STATUS.RETURNED
    default:
      return false
  }
}
