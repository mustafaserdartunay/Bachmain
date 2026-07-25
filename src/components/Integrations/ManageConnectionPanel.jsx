import { useState } from 'react'
import {
  FileText,
  Link2Off,
  MessageSquare,
  RefreshCw,
  ShieldAlert,
  Unplug,
  Webhook,
} from 'lucide-react'
import {
  disconnectPlatform,
  formatRelativeTr,
  listLogs,
  refreshToken,
  sendTestMessage,
  syncPlatform,
  testWebhook,
} from '../../integrations/connectionStore'

export default function ManageConnectionPanel({ platform, connection, onClose, onChanged }) {
  const [flash, setFlash] = useState('')
  const logs = listLogs({ platformId: platform.id, limit: 8 })

  function flashMsg(t) {
    setFlash(t)
    setTimeout(() => setFlash(''), 2200)
  }

  function run(fn, okMsg) {
    const result = fn(platform.id)
    if (result?.error) {
      flashMsg('Önce bağlantı gerekli')
      return
    }
    onChanged?.()
    flashMsg(okMsg)
  }

  if (!connection?.connected) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--muted)]">
        Bu platform bağlı değil.
        <button type="button" className="ml-2 font-bold text-[var(--ink)]" onClick={onClose}>
          Kapat
        </button>
      </div>
    )
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[var(--glass-bg,rgba(255,255,255,0.06))] p-4 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wide text-[var(--ink)]">
            {platform.title} · Yönet
          </h3>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Token ve webhook BachMain tarafından yönetilir — anahtar kopyalamanız gerekmez.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 px-3 py-1.5 text-[10px] font-black uppercase text-[var(--muted)]"
        >
          Kapat
        </button>
      </div>

      {flash ? (
        <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {flash}
        </p>
      ) : null}

      <dl className="mt-4 grid gap-2 sm:grid-cols-2 text-[11px]">
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="font-semibold text-[var(--muted)]">Durum</dt>
          <dd className="mt-0.5 font-black text-emerald-600">Bağlı</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="font-semibold text-[var(--muted)]">Son Senkron</dt>
          <dd className="mt-0.5 font-black text-[var(--ink)]">
            {formatRelativeTr(connection.lastSyncAt)}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="font-semibold text-[var(--muted)]">Webhook</dt>
          <dd className="mt-0.5 font-black text-[var(--ink)]">
            {connection.webhookStatus === 'active' ? 'Aktif' : 'Hata'}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="font-semibold text-[var(--muted)]">Token süresi</dt>
          <dd className="mt-0.5 font-black text-[var(--ink)]">
            {connection.tokenExpiresAt
              ? new Date(connection.tokenExpiresAt).toLocaleDateString('tr-TR')
              : '—'}
          </dd>
        </div>
        {connection.accountLabel ? (
          <div className="rounded-xl border border-white/10 px-3 py-2 sm:col-span-2">
            <dt className="font-semibold text-[var(--muted)]">Hesap</dt>
            <dd className="mt-0.5 font-black text-[var(--ink)]">{connection.accountLabel}</dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-wrap gap-2">
        <Action
          icon={RefreshCw}
          label="Yenile"
          onClick={() => run(refreshToken, 'Token yenilendi')}
        />
        <Action
          icon={RefreshCw}
          label="Senkronize Et"
          onClick={() => run(syncPlatform, 'Senkron tamam')}
        />
        <Action
          icon={Webhook}
          label="Webhook Testi"
          onClick={() => {
            const r = testWebhook(platform.id)
            onChanged?.()
            flashMsg(r?.ok ? 'Webhook OK' : 'Webhook hata')
          }}
        />
        <Action
          icon={MessageSquare}
          label="Test Mesajı"
          onClick={() => run(sendTestMessage, 'Test mesajı gönderildi')}
        />
        <Action
          icon={Unplug}
          label="Bağlantıyı Kes"
          danger
          onClick={() => {
            disconnectPlatform(platform.id)
            onChanged?.()
            flashMsg('Bağlantı kesildi')
            onClose?.()
          }}
        />
      </div>

      <div className="mt-5">
        <h4 className="flex items-center gap-1.5 text-[11px] font-black uppercase text-[var(--muted)]">
          <FileText className="h-3.5 w-3.5" />
          Son loglar
        </h4>
        <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-[11px]">
          {logs.length === 0 ? (
            <li className="text-[var(--muted)]">Log yok</li>
          ) : (
            logs.map((log) => (
              <li
                key={log.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-white/5 px-2 py-1.5"
              >
                <span className="min-w-0">
                  <span className="font-bold text-[var(--ink)]">{log.action}</span>
                  <span className="ml-2 text-[var(--muted)]">{log.detail}</span>
                </span>
                <span className={log.success ? 'text-emerald-600' : 'text-rose-600'}>
                  {log.httpCode}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      <p className="mt-3 flex items-start gap-2 text-[10px] text-[var(--muted)]">
        <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        OAuth token’lar şifreli saklanır; tenant izolasyonu geçerlidir. Ham secret UI’da
        gösterilmez.
      </p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-[var(--muted)]">
        <Link2Off className="h-3 w-3" />
        API Key / Webhook URL müşteriye sorulmaz.
      </p>
    </section>
  )
}

function Action({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[10px] font-black uppercase tracking-wide ${
        danger
          ? 'border-rose-500/40 text-rose-600 hover:bg-rose-500/10'
          : 'border-white/10 text-[var(--ink)] hover:bg-white/10'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}
