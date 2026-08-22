import { readUserProfile } from '../../utils/userProfile'

export function formatQuoteRecordWhen(value) {
  if (!value) return '—'
  try {
    return new Date(value).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return String(value)
  }
}

export function getQuoteCreatedSource(quote) {
  return quote?.activities?.[0]?.date || quote?.createdAt || ''
}

export function getQuotePreparedByLabel(quote = {}) {
  const profile = readUserProfile()
  return (
    quote.preparedBy ||
    quote.createdByName ||
    quote.contact ||
    profile?.displayName ||
    '—'
  )
}

export function getQuoteRestoredAtLabel(record, entryMeta = {}) {
  const restored =
    entryMeta.restoredAt ||
    entryMeta.restoredFromPurgeAt ||
    (record?.activities || []).find((activity) =>
      /geri yükl/i.test(String(activity?.text || '')),
    )?.date

  return restored ? formatQuoteRecordWhen(restored) : '—'
}

export default function QuoteRecordMetaPanel({
  quote,
  deletedAt,
  entryMeta = {},
  className = '',
}) {
  const createdLabel = formatQuoteRecordWhen(getQuoteCreatedSource(quote))
  const deletedLabel = deletedAt ? formatQuoteRecordWhen(deletedAt) : '—'
  const restoredLabel = getQuoteRestoredAtLabel(quote, entryMeta)
  const preparedBy = getQuotePreparedByLabel(quote)
  const deletedBy = entryMeta.deletedBy || '—'

  return (
    <div className={`quote-record-meta-panel space-y-1 px-2 py-2 ${className}`.trim()}>
      <p className="quote-record-meta-line">
        <span className="quote-record-meta-label">Oluşturulma</span>
        <span className="quote-record-meta-value tabular-nums">{createdLabel}</span>
      </p>
      <p className="quote-record-meta-line">
        <span className="quote-record-meta-label">Silinme</span>
        <span className="quote-record-meta-value tabular-nums">{deletedLabel}</span>
      </p>
      <p className="quote-record-meta-line">
        <span className="quote-record-meta-label">Geri alılma</span>
        <span className="quote-record-meta-value tabular-nums">{restoredLabel}</span>
      </p>
      <p className="quote-record-meta-line">
        <span className="quote-record-meta-label">Hazırlayan</span>
        <span className="quote-record-meta-value">{preparedBy}</span>
      </p>
      {deletedAt ? (
        <p className="quote-record-meta-line">
          <span className="quote-record-meta-label">Silen</span>
          <span className="quote-record-meta-value">{deletedBy}</span>
        </p>
      ) : null}
    </div>
  )
}
