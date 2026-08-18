import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, RefreshCw } from 'lucide-react'
import { DataTable } from '@bachmain/ui'
import SearchInput from '../../components/Common/SearchInput'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { formatTL } from '../../utils/productPricing'
import { edocumentsApi, EDOC_STATUS_CLASS, EDOC_STATUS_LABEL } from '../../utils/edocumentsApi'
import { docField, EdocAlert, EDocumentsSubnav, formatEdocError } from './eDocumentShared'

const LIST_CELL = 'text-xs font-extrabold tracking-wide text-gray-300'

export default function EDocumentListPage({
  title,
  direction,
  documentType,
  status,
  statusIn,
  createTo = '/e-belgeler/yeni',
}) {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await edocumentsApi.list({
        ...(direction ? { direction } : {}),
        ...(documentType ? { documentType } : {}),
        ...(status && !statusIn ? { status } : {}),
      })
      let next = data.rows || []
      if (statusIn?.length) {
        next = next.filter((row) => statusIn.includes(row.status))
      }
      setRows(next)
    } catch (err) {
      setError(formatEdocError(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction, documentType, status, Array.isArray(statusIn) ? statusIn.join(',') : ''])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [
        docField(row, 'invoiceNumber', 'invoice_number'),
        docField(row, 'partyName', 'party_name'),
        row.uuid,
        row.status,
      ].some((v) =>
        String(v || '')
          .toLowerCase()
          .includes(q),
      ),
    )
  }, [rows, search])

  const stats = useMemo(() => {
    const total = filtered.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
    const errors = filtered.filter(
      (row) => row.status === 'ERROR' || row.status === 'REJECTED',
    ).length
    return { count: filtered.length, total, errors }
  }, [filtered])

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/e-belgeler" label="E-Belgeler" />}
        centerTitle={title}
        showBack={false}
        actions={
          <div className="flex gap-2">
            <button
              type="button"
              className={`${BTN_SUCCESS} px-3 text-xs`}
              onClick={() => void load()}
            >
              <RefreshCw className="mr-1 inline h-3.5 w-3.5" />
              Yenile
            </button>
            {direction !== 'incoming' ? (
              <Link to={createTo} className={`${BTN_PRIMARY} px-3 text-xs`}>
                Yeni E-Fatura
              </Link>
            ) : null}
          </div>
        }
      />
      <EDocumentsSubnav />
      <SummaryMetrics
        columns={4}
        items={[
          {
            title: 'Kayıt',
            value: loading ? '…' : stats.count,
            icon: FileText,
            tone: 'blue',
            valueTone: 'blue',
          },
          {
            title: 'Toplam',
            value: loading ? '…' : formatTL(stats.total),
            icon: FileText,
            tone: 'emerald',
            valueTone: 'emerald',
          },
          {
            title: 'Hata / red',
            value: loading ? '…' : stats.errors,
            icon: FileText,
            tone: 'red',
            valueTone: 'red',
          },
          {
            title: 'Tür',
            value:
              documentType ||
              (direction === 'incoming' ? 'Gelen' : statusIn ? 'İptal' : status || 'Tümü'),
            icon: FileText,
            tone: 'orange',
            valueTone: 'orange',
          },
        ]}
      />
      <AppPagePanel fill>
        <div className="mb-4 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Belge no, VKN, firma…"
          />
          <button
            type="button"
            className={`${BTN_SUCCESS} px-3 text-xs`}
            disabled={syncing}
            onClick={async () => {
              setSyncing(true)
              setError('')
              try {
                await edocumentsApi.sync()
                await load()
              } catch (err) {
                setError(formatEdocError(err))
              } finally {
                setSyncing(false)
              }
            }}
          >
            {syncing ? 'Çekiliyor…' : 'Nilvera’dan çek'}
          </button>
        </div>
        <EdocAlert>{error}</EdocAlert>
        {loading ? (
          <p className="mb-3 text-sm text-[var(--muted)]">Yükleniyor…</p>
        ) : (
          <DataTable
            emptyTitle="Belge bulunamadı"
            emptyDescription="Nilvera’dan çekin, yeni fatura oluşturun veya API anahtarını Ayarlar’dan kaydedin."
            data={filtered}
            getRowId={(row) => row.id}
            onRowClick={(row) => navigate(`/e-belgeler/${row.id}`)}
            getRowActions={(row) => [
              { id: 'open', label: 'Aç', onClick: () => navigate(`/e-belgeler/${row.id}`) },
            ]}
            columns={[
              {
                id: 'invoice',
                header: 'Belge No',
                accessorKey: 'invoice_number',
                cell: (row) => (
                  <span className={LIST_CELL}>
                    {docField(row, 'invoiceNumber', 'invoice_number') || '—'}
                  </span>
                ),
              },
              {
                id: 'date',
                header: 'Tarih',
                cell: (row) => (
                  <span className={LIST_CELL}>
                    {String(docField(row, 'issueDate', 'issue_date') || '').slice(0, 10) || '—'}
                  </span>
                ),
              },
              {
                id: 'party',
                header: 'Firma',
                cell: (row) => (
                  <span className={LIST_CELL}>
                    {docField(row, 'partyName', 'party_name') || '—'}
                  </span>
                ),
              },
              {
                id: 'vkn',
                header: 'VKN/TCKN',
                cell: (row) => (
                  <span className={LIST_CELL}>
                    {docField(row, 'partyTaxNumber', 'party_tax_number') || '—'}
                  </span>
                ),
              },
              {
                id: 'type',
                header: 'Tür',
                cell: (row) => (
                  <span className={LIST_CELL}>
                    {docField(row, 'documentType', 'document_type') || '—'}
                  </span>
                ),
              },
              {
                id: 'amount',
                header: 'Tutar',
                cell: (row) => (
                  <span className={LIST_CELL}>{formatTL(Number(row.amount) || 0)}</span>
                ),
              },
              {
                id: 'status',
                header: 'Durum',
                cell: (row) => (
                  <span
                    className={`text-xs font-extrabold ${EDOC_STATUS_CLASS[row.status] || 'text-gray-300'}`}
                  >
                    {EDOC_STATUS_LABEL[row.status] || row.status}
                  </span>
                ),
              },
              {
                id: 'uuid',
                header: 'UUID',
                cell: (row) => (
                  <span className={`${LIST_CELL} font-mono`}>
                    {String(row.uuid || '—').slice(0, 8)}
                  </span>
                ),
              },
            ]}
          />
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
