function formatListDateFallback(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export function formatListDateParts(value) {
  if (!value) return { date: '', time: '' }
  const raw = String(value).trim()
  const trMatch = raw.match(/^(\d{2}\.\d{2}\.\d{4})(?:[, ]+\s*(\d{1,2}:\d{2}))/)
  if (trMatch) {
    const [hours, minutes] = (trMatch[2] || '').split(':')
    return {
      date: trMatch[1],
      time: hours && minutes ? `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}` : '',
    }
  }

  try {
    const d = new Date(raw)
    if (!Number.isNaN(d.getTime())) {
      return {
        date: d.toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        time: d.toLocaleTimeString('tr-TR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      }
    }
  } catch {
    /* ignore */
  }

  return { date: formatListDateFallback(raw), time: '' }
}

/** Liste hücresi ile aynı: `16.07.2026 01:40` */
export function formatQuoteDisplayWhen(value) {
  const { date, time } = formatListDateParts(value)
  if (!date) return '—'
  return [date, time].filter(Boolean).join(' ')
}

export function getQuoteCreatedSource(quote) {
  return quote?.activities?.[0]?.date || quote?.createdAt || ''
}
