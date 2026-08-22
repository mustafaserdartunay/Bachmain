import { formatQuoteDisplayWhen, getQuoteCreatedSource } from '../../utils/quoteListDateFormat'
import { getQuotePreparedByLabel } from '../../utils/quotePreparedBy'

export function getQuoteRestoredAtLabel(record, entryMeta = {}) {
  const restored =
    entryMeta.lastRestoredAt ||
    entryMeta.restoredAt ||
    entryMeta.restoredFromPurgeAt ||
    record?.lastRestoredFromDeletedAt ||
    (record?.activities || []).find((activity) => /geri yükl/i.test(String(activity?.text || '')))
      ?.date

  return restored ? formatQuoteDisplayWhen(restored) : '—'
}

export default function QuoteRecordMetaPanel({ quote, deletedAt, entryMeta = {}, className = '' }) {
  const createdLabel = formatQuoteDisplayWhen(getQuoteCreatedSource(quote))
  const deletedLabel = deletedAt ? formatQuoteDisplayWhen(deletedAt) : '—'
  const restoredLabel = getQuoteRestoredAtLabel(quote, entryMeta)
  const preparedBy = getQuotePreparedByLabel(quote)
  const deletedBy = entryMeta.deletedBy || '—'

  return (
    <div className={`quote-record-meta-panel space-y-1 px-2 py-2 ${className}`.trim()}>
      <p className="quote-record-meta-line">
        <span className="quote-record-meta-label">Oluşturulma</span>
        <span className="quote-record-meta-value tabular-nums">{createdLabel}</span>
      </p>
      {deletedAt ? (
        <p className="quote-record-meta-line">
          <span className="quote-record-meta-label">Silinme</span>
          <span className="quote-record-meta-value tabular-nums">{deletedLabel}</span>
        </p>
      ) : null}
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
