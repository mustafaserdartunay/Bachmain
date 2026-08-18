import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataTable } from '@bachmain/ui'
import SearchInput from '../../components/Common/SearchInput'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import { formatTL } from '../../utils/productPricing'
import { edocumentsApi, EDOC_STATUS_CLASS, EDOC_STATUS_LABEL } from '../../utils/edocumentsApi'
import { docField, EdocAlert, EDocumentsSubnav, formatEdocError } from './eDocumentShared'

const LIST_CELL = 'text-xs font-extrabold tracking-wide text-gray-300'

export default function EDocumentSearchPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function run(query) {
    setLoading(true)
    setError('')
    try {
      const data = await edocumentsApi.list({ search: String(query || '').trim() })
      setRows(data.rows || [])
    } catch (err) {
      setError(formatEdocError(err))
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void run('')
  }, [])

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/e-belgeler" label="E-Belgeler" />}
        centerTitle="Belge Sorgulama"
        showBack={false}
      />
      <EDocumentsSubnav />
      <AppPagePanel
        title="Sorgula"
        description="Belge no, UUID, VKN veya firma adı ile Bachmain kaydında arayın."
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void run(search)
            }}
            placeholder="Belge no, UUID, VKN, firma…"
          />
          <button
            type="button"
            className={`${BTN_SUCCESS} px-3 text-xs`}
            onClick={() => void run(search)}
          >
            Sorgula
          </button>
        </div>
        <EdocAlert>{error}</EdocAlert>
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Yükleniyor…</p>
        ) : (
          <DataTable
            emptyTitle="Sonuç yok"
            emptyDescription="Nilvera / Bachmain kayıtlarında eşleşme arayın."
            data={rows}
            getRowId={(row) => row.id}
            onRowClick={(row) => navigate(`/e-belgeler/${row.id}`)}
            columns={[
              {
                id: 'invoice',
                header: 'Belge No',
                cell: (row) => (
                  <span className={LIST_CELL}>
                    {docField(row, 'invoiceNumber', 'invoice_number') || '—'}
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
                cell: (row) => <span className={`${LIST_CELL} font-mono`}>{row.uuid || '—'}</span>,
              },
            ]}
          />
        )}
      </AppPagePanel>
    </AppPageShell>
  )
}
