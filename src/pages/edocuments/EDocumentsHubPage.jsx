import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Inbox, Send, Settings, ShieldAlert, Wifi } from 'lucide-react'
import {
  AppPageBackLink,
  AppPageHeader,
  AppPagePanel,
  AppPageShell,
} from '../../components/Layout/AppPageLayout'
import SummaryMetrics from '../../components/Common/SummaryMetrics'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import { eDocumentsSubMenus } from '../../data/eDocumentsMenu'
import { useAuth } from '../../auth/AuthContext'
import { hasModule } from '../../utils/entitlements'
import { formatTL } from '../../utils/productPricing'
import { edocumentsApi } from '../../utils/edocumentsApi'
import {
  connectionStatusLabel,
  docField,
  EdocAlert,
  EDocumentsSubnav,
  formatEdocError,
} from './eDocumentShared'

export default function EDocumentsHubPage() {
  const { user } = useAuth()
  const allowed =
    hasModule(user?.entitlements, 'einvoice') || hasModule(user?.entitlements, 'earchive')
  const [connection, setConnection] = useState(null)
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [conn, list] = await Promise.all([
          edocumentsApi.connection(),
          edocumentsApi.list().catch(() => ({ rows: [] })),
        ])
        if (cancelled) return
        setConnection(conn.connection || null)
        setRows(list.rows || [])
      } catch (err) {
        if (!cancelled) {
          setError(formatEdocError(err))
          setConnection(null)
          setRows([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (allowed) void load()
    else setLoading(false)
    return () => {
      cancelled = true
    }
  }, [allowed])

  const stats = useMemo(() => {
    const incoming = rows.filter((row) => docField(row, 'direction', 'direction') === 'incoming')
    const outgoing = rows.filter((row) => docField(row, 'direction', 'direction') === 'outgoing')
    const drafts = rows.filter((row) => row.status === 'DRAFT')
    const errors = rows.filter((row) => row.status === 'ERROR' || row.status === 'REJECTED')
    const amount = outgoing.reduce((sum, row) => sum + (Number(row.amount) || 0), 0)
    return {
      incoming: incoming.length,
      outgoing: outgoing.length,
      drafts: drafts.length,
      errors: errors.length,
      amount,
    }
  }, [rows])

  if (!allowed) {
    return (
      <AppPageShell>
        <AppPageHeader
          title={<AppPageBackLink to="/" label="Güncel Durum" />}
          centerTitle="E-Belgeler"
          showBack={false}
        />
        <div
          className={`${APP_SURFACE_PANEL_CLASS} flex items-center gap-3 p-6 text-sm text-rose-200`}
        >
          <ShieldAlert className="h-5 w-5" />
          E-Fatura paketinizde etkin değil.
        </div>
      </AppPageShell>
    )
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title={<AppPageBackLink to="/" label="Güncel Durum" />}
        centerTitle="E-Belgeler"
        showBack={false}
        actions={
          <Link to="/e-belgeler/yeni" className={`${BTN_PRIMARY} px-3 text-xs`}>
            Yeni E-Fatura
          </Link>
        }
      />
      <EDocumentsSubnav />
      <div
        className={`${APP_SURFACE_PANEL_CLASS} flex flex-wrap items-center justify-between gap-3 px-4 py-3`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
            <Wifi className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-wide text-emerald-300">
              {connectionStatusLabel(connection)}
            </p>
            <p className="truncate text-[11px] font-semibold text-gray-500">
              {connection?.companyTitle || connection?.taxNumber
                ? `${connection.companyTitle || 'Şirket'} · ${connection.taxNumber || 'VKN yok'}`
                : 'API anahtarı tarayıcıya gönderilmez. Ayarlardan Nilvera key kaydedin.'}
            </p>
          </div>
        </div>
        <Link
          to="/e-belgeler/ayarlar"
          className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-extrabold tracking-wide text-blue-300"
        >
          E-Belge Ayarları
        </Link>
      </div>
      <EdocAlert>{error}</EdocAlert>
      <SummaryMetrics
        columns={4}
        items={[
          {
            title: 'Giden',
            value: loading ? '…' : stats.outgoing,
            icon: Send,
            tone: 'blue',
            valueTone: 'blue',
          },
          {
            title: 'Gelen',
            value: loading ? '…' : stats.incoming,
            icon: Inbox,
            tone: 'emerald',
            valueTone: 'emerald',
          },
          {
            title: 'Taslak',
            value: loading ? '…' : stats.drafts,
            icon: FileText,
            tone: 'orange',
            valueTone: 'orange',
          },
          {
            title: 'Giden tutar',
            value: loading ? '…' : formatTL(stats.amount),
            icon: FileText,
            tone: 'emerald',
            valueTone: 'emerald',
          },
        ]}
      />
      <AppPagePanel
        title="Modüller"
        description="e-Fatura ve e-Arşiv Bachmain üzerinden Nilvera API ile GİB’e iletilir."
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {eDocumentsSubMenus
            .filter((item) => item.path !== '/e-belgeler')
            .map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`${APP_SURFACE_PANEL_CLASS} flex items-center gap-3 p-4 text-sm font-semibold hover:border-emerald-500/30`}
              >
                {item.path.includes('gelen') ? (
                  <Inbox className="h-4 w-4 text-emerald-300" />
                ) : item.path.includes('giden') ? (
                  <Send className="h-4 w-4 text-blue-300" />
                ) : item.path.includes('ayar') ? (
                  <Settings className="h-4 w-4 text-gray-300" />
                ) : (
                  <FileText className="h-4 w-4 text-emerald-300" />
                )}
                {item.label}
              </Link>
            ))}
        </div>
        {stats.errors ? (
          <p className="mt-4 text-sm text-rose-300">
            {stats.errors} belgede hata veya red var. Taslaklar / iptallerden kontrol edin.
          </p>
        ) : null}
      </AppPagePanel>
    </AppPageShell>
  )
}
