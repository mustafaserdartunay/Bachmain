export function todayForDateInput(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return localDate.toISOString().slice(0, 10)
}

export function formatCollectionDate(dateInput, timePart) {
  if (!dateInput) return undefined
  const [year, month, day] = dateInput.split('-')
  if (!year || !month || !day) return undefined
  if (timePart) return `${day}.${month}.${year} ${timePart}`
  const now = new Date()
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${day}.${month}.${year} ${hour}:${minute}`
}

export function formatCollectionDatePreserveTime(dateInput, existingDate) {
  const timePart = String(existingDate || '').includes(' ')
    ? String(existingDate).split(' ').slice(1).join(' ')
    : null
  return formatCollectionDate(dateInput, timePart)
}

export function emptyCollectionForm(accounts, optionLists = {}) {
  const cash = optionLists.cashAccount || []
  return {
    accountName: cash[0]?.label || accounts[0]?.name || '',
    method: 'Nakit',
    amount: '',
    transactionDate: todayForDateInput(),
    description: '',
    chequeNo: '',
    chequeBank: '',
    chequeBranch: '',
    chequeDueDate: '',
    chequeOwner: '',
  }
}

export function movementToForm(movement) {
  const datePart = String(movement?.date || '').split(' ')[0]
  const [day, month, year] = datePart.split('.')
  const transactionDate = year && month && day
    ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    : todayForDateInput()

  return {
    accountName: movement?.accountName || '',
    method: movement?.method || 'Nakit',
    amount: String(movement?.amount ?? ''),
    transactionDate,
    description: movement?.description || '',
    chequeNo: movement?.chequeNo || '',
    chequeBank: movement?.chequeBank || '',
    chequeBranch: movement?.chequeBranch || '',
    chequeDueDate: movement?.chequeDueDate || '',
    chequeOwner: movement?.chequeOwner || '',
  }
}

export function patchMovementForm(setter, field, value, lists) {
  if (field === 'method') {
    setter((current) => {
      const accountName = value === 'Nakit'
        ? (lists.cashAccount?.[0]?.label || '')
        : (lists.bankAccount?.[0]?.label || '')
      return { ...current, method: value, accountName }
    })
    return
  }
  setter((current) => ({ ...current, [field]: value }))
}

export function formatOpeningDisplayDate(dateInput) {
  if (!dateInput) return '01.06.2026'
  const [year, month, day] = dateInput.split('-')
  if (!year || !month || !day) return dateInput
  return `${day}.${month}.${year}`
}

export function openingBalanceToForm(customer) {
  const displayDate = customer?.openingBalanceDate || '01.06.2026'
  const datePart = String(displayDate).split(' ')[0]
  const [day, month, year] = datePart.split('.')
  const transactionDate = year && month && day
    ? `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
    : todayForDateInput()

  return {
    amount: String(Number(customer?.balance) || ''),
    transactionDate,
    description: customer?.openingBalanceDescription || `${customer?.company || ''} cari açılış bakiyesi`,
  }
}
