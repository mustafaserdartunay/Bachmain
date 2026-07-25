import { CheckCircle2, Link2, RefreshCw, Settings2 } from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../../utils/dashboardDesign'
import { formatRelativeTr } from '../../integrations/connectionStore'
import { IntegrationBrandIcon, integrationBrandBg } from './brandIcons'

function StatusPill({ connected }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${
        connected
          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          : 'border-white/10 bg-white/5 text-[var(--muted)]'
      }`}
    >
      {connected ? <CheckCircle2 className="h-3 w-3" /> : null}
      {connected ? 'Bağlı' : 'Bağlı Değil'}
    </span>
  )
}

export default function PlatformConnectionCard({
  platform,
  connection,
  onConnect,
  onManage,
  compact = false,
}) {
  const connected = Boolean(connection?.connected)
  const coming = platform.status === 'coming'

  return (
    <article
      className={`${APP_SURFACE_PANEL_CLASS} flex flex-col gap-3 p-4 transition-shadow hover:shadow-[0_8px_28px_rgba(0,0,0,0.12)]`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${integrationBrandBg(platform.brandKey)}`}
        >
          <IntegrationBrandIcon brandKey={platform.brandKey} className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-[var(--ink)]">{platform.title}</h3>
            <StatusPill connected={connected} />
            {platform.status === 'beta' ? (
              <span className="rounded-md border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-black uppercase text-amber-700">
                Beta
              </span>
            ) : null}
          </div>
          {!connected && !compact ? (
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">{platform.summary}</p>
          ) : null}
        </div>
      </div>

      {connected ? (
        <dl className="grid grid-cols-1 gap-1.5 text-[11px]">
          {connection.accountLabel ? (
            <div className="flex justify-between gap-2">
              <dt className="font-semibold text-[var(--muted)]">Hesap</dt>
              <dd className="truncate font-bold text-[var(--ink)]">{connection.accountLabel}</dd>
            </div>
          ) : null}
          {connection.businessName && connection.businessName !== connection.accountLabel ? (
            <div className="flex justify-between gap-2">
              <dt className="font-semibold text-[var(--muted)]">İşletme</dt>
              <dd className="truncate font-bold text-[var(--ink)]">{connection.businessName}</dd>
            </div>
          ) : null}
          {connection.phoneNumber ? (
            <div className="flex justify-between gap-2">
              <dt className="font-semibold text-[var(--muted)]">Telefon</dt>
              <dd className="font-bold tabular-nums text-[var(--ink)]">{connection.phoneNumber}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-[var(--muted)]">Son Senkron</dt>
            <dd className="font-bold text-[var(--ink)]">
              {formatRelativeTr(connection.lastSyncAt)}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="font-semibold text-[var(--muted)]">Webhook</dt>
            <dd
              className={`font-bold ${
                connection.webhookStatus === 'active' ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {connection.webhookStatus === 'active' ? 'Aktif' : 'Hata'}
            </dd>
          </div>
        </dl>
      ) : null}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {connected ? (
          <button
            type="button"
            onClick={() => onManage?.(platform)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-[var(--ink)] transition-colors hover:bg-white/10"
          >
            <Settings2 className="h-3.5 w-3.5" />
            Yönet
          </button>
        ) : (
          <button
            type="button"
            disabled={coming}
            onClick={() => onConnect?.(platform)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-emerald-800 transition-colors hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-40 dark:text-emerald-200"
          >
            <Link2 className="h-3.5 w-3.5" />
            {coming ? 'Yakında' : `${platform.title} Bağla`}
          </button>
        )}
        {connected ? (
          <button
            type="button"
            onClick={() => onManage?.(platform, 'sync')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-[11px] font-black uppercase tracking-wide text-[var(--muted)] hover:text-[var(--ink)]"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Senkron
          </button>
        ) : null}
      </div>
    </article>
  )
}
