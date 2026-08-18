import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { formatTL } from '../../utils/productPricing'
import {
  downloadBase64File,
  edocumentsApi,
  EDOC_STATUS_CLASS,
  EDOC_STATUS_LABEL,
} from '../../utils/edocumentsApi'
import { docField, EdocAlert, EDocumentsSubnav, formatEdocError } from './eDocumentShared'

export default function EDocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [documentRow, setDocumentRow] = useState(null)
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  async function load() {
    setError('')
    setLoading(true)
    try {
      const data = await edocumentsApi.get(id)
      setDocumentRow(data.document || null)
      setEvents(data.events || [])
      if (!data.document) setError('E-belge bulunamadı')
    } catch (err) {
      setError(formatEdocError(err))
      setDocumentRow(null)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await edocumentsApi.confirm(id)
      await load()
    } catch (err) {
      setError(formatEdocError(err))
    } finally {
      setBusy(false)
    }
  }

  async function download(kind) {
    setBusy(true)
    setError('')
    try {
      const file = await edocumentsApi.file(id, kind)
      downloadBase64File(file)
    } catch (err) {
      setError(formatEdocError(err))
    } finally {
      setBusy(false)
    }
  }

  const status = docField(documentRow, 'status', 'status')
  const canSend = status === 'DRAFT' || status === 'ERROR'
  let payload = null
  try {
    const meta = documentRow?.metadata || documentRow?.meta
    const obj = typeof meta === 'string' ? JSON.parse(meta) : meta
    payload = obj?.payload || null
  } catch {
    payload = null
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/e-belgeler" label="E-Belgeler" />}
        centerTitle={docField(documentRow, 'invoiceNumber', 'invoice_number') || 'E-Belge'}
        showBack={false}
      />
      <EDocumentsSubnav />
      <AppPagePanel title="Belge detayı">
        <EdocAlert>{error}</EdocAlert>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Belge yükleniyor…</p>
        ) : !documentRow ? (
          <p className="text-sm text-[var(--muted)]">Belge bulunamadı.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              <p>
                Durum:{' '}
                <span className={`font-black ${EDOC_STATUS_CLASS[status] || 'text-gray-300'}`}>
                  {EDOC_STATUS_LABEL[status] || status}
                </span>
              </p>
              <p>Tür: {docField(documentRow, 'documentType', 'document_type') || '—'}</p>
              <p>Yön: {docField(documentRow, 'direction', 'direction') || '—'}</p>
              <p>Firma: {docField(documentRow, 'partyName', 'party_name') || '—'}</p>
              <p>VKN: {docField(documentRow, 'partyTaxNumber', 'party_tax_number') || '—'}</p>
              <p>Tutar: {formatTL(Number(docField(documentRow, 'amount', 'amount')) || 0)}</p>
              <p>KDV: {formatTL(Number(docField(documentRow, 'taxAmount', 'tax_amount')) || 0)}</p>
              <p>
                Tarih:{' '}
                {String(docField(documentRow, 'issueDate', 'issue_date') || '').slice(0, 10) || '—'}
              </p>
              <p className="font-mono sm:col-span-2">
                UUID: {docField(documentRow, 'uuid', 'uuid') || '—'}
              </p>
            </div>
            {Array.isArray(payload?.lines) && payload.lines.length ? (
              <div className="mt-6">
                <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-500">
                  Kalemler (Bachmain)
                </p>
                <ul className="space-y-1 text-sm">
                  {payload.lines.map((line, index) => (
                    <li key={`${line.name}-${index}`}>
                      {line.name} · {line.quantity} × {formatTL(Number(line.price) || 0)} · KDV %
                      {line.kdvPercent}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-2">
              {canSend ? (
                <button
                  type="button"
                  className={`${BTN_PRIMARY} px-4 text-xs`}
                  disabled={busy}
                  onClick={() => void confirm()}
                >
                  Gönder
                </button>
              ) : null}
              <button
                type="button"
                className={`${BTN_SUCCESS} px-4 text-xs`}
                disabled={busy}
                onClick={() => void download('pdf')}
              >
                Resmî PDF
              </button>
              <button
                type="button"
                className={`${BTN_SUCCESS} px-4 text-xs`}
                disabled={busy}
                onClick={() => void download('xml')}
              >
                XML
              </button>
              <button
                type="button"
                className="text-xs font-bold text-gray-400"
                onClick={() => navigate('/e-belgeler')}
              >
                Listeye dön
              </button>
            </div>
            <div className="mt-8">
              <p className="mb-2 text-xs font-black uppercase tracking-wide text-gray-500">
                Olaylar
              </p>
              {events.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Kayıt yok.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {events.map((event) => (
                    <li key={event.id} className="rounded-xl border border-dark-500/40 px-3 py-2">
                      <span className="font-semibold">{event.eventType || event.event_type}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {String(event.createdAt || event.created_at || '')
                          .replace('T', ' ')
                          .slice(0, 19)}
                      </span>
                      {event.errorMessage || event.error_message ? (
                        <p className="mt-1 text-rose-300">
                          {event.errorMessage || event.error_message}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
