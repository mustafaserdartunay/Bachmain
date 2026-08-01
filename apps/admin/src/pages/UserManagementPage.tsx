import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  History,
  KeyRound,
  LogOut,
  PauseCircle,
  RefreshCw,
  Trash2,
  ArrowUpCircle,
} from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DataTable } from '@/components/ui/DataTable'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { usePageState } from '@/hooks/usePageState'
import { platformAdminApi, type PlatformUserRow } from '@/services/platformAdminApi'
import { formatDateTime } from '@/lib/utils'
import type { BadgeVariant, TableColumn } from '@/types'

type BusyMap = Record<string, string | undefined>

type PendingAction =
  | { type: 'delete'; row: PlatformUserRow }
  | { type: 'suspend'; row: PlatformUserRow }
  | null

const STATUS_TR: Record<PlatformUserRow['status'], string> = {
  active: 'Aktif',
  trial: 'Deneme',
  suspended: 'Askıda',
  expired: 'Süresi Doldu',
}

const ACTION_TR: Record<string, string> = {
  'force-logout': 'Oturum kapatma',
  suspend: 'Askıya alma',
  'reset-password': 'Şifre sıfırlama',
  'reset-trial': 'Deneme yenileme',
  'upgrade-plan': 'Plan yükseltme',
  delete: 'Silme',
}

export function UserManagementPage() {
  const fetcher = useMemo(() => () => platformAdminApi.listUsers(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })
  const [busy, setBusy] = useState<BusyMap>({})
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, setPending] = useState<PendingAction>(null)

  const runAction = useCallback(
    async (userId: string, actionKey: string, fn: () => Promise<unknown>) => {
      setBusy((b) => ({ ...b, [userId]: actionKey }))
      setFlash(null)
      try {
        const res = (await fn()) as { message?: string; ok?: boolean } | void
        const label = ACTION_TR[actionKey] || actionKey
        setFlash({
          ok: true,
          message: (res && typeof res === 'object' && res.message) || `${label} başarıyla uygulandı`,
        })
        reload()
      } catch (err) {
        setFlash({
          ok: false,
          message: err instanceof Error ? err.message : 'İşlem başarısız',
        })
      } finally {
        setBusy((b) => ({ ...b, [userId]: undefined }))
      }
    },
    [reload],
  )

  const columns: TableColumn<PlatformUserRow>[] = useMemo(
    () => [
      {
        key: 'company',
        label: 'Şirket',
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-semibold text-text">{row.company}</p>
            <p className="text-xs text-text-subtle">{row.plan}</p>
          </div>
        ),
      },
      {
        key: 'user',
        label: 'Kullanıcı',
        sortable: true,
        render: (row) => (
          <div>
            <p className="font-medium text-text">{row.user}</p>
            <p className="text-xs text-text-subtle">{row.email}</p>
          </div>
        ),
      },
      {
        key: 'sessions',
        label: 'Oturum',
        render: (row) => <span className="tabular-nums">{row.sessions}</span>,
      },
      {
        key: 'devices',
        label: 'Cihaz',
        render: (row) => <span className="tabular-nums">{row.devices}</span>,
      },
      {
        key: 'mfaEnabled',
        label: 'MFA',
        render: (row) => (
          <Badge variant={row.mfaEnabled ? 'success' : 'warning'}>
            {row.mfaEnabled ? 'Aktif' : 'Kapalı'}
          </Badge>
        ),
      },
      {
        key: 'lastLogin',
        label: 'Son giriş',
        sortable: true,
        render: (row) => (
          <span className="text-xs">{row.lastLogin ? formatDateTime(row.lastLogin) : '—'}</span>
        ),
      },
      {
        key: 'status',
        label: 'Durum',
        render: (row) => (
          <Badge variant={(statusBadgeMap[row.status] ?? 'default') as BadgeVariant}>
            {STATUS_TR[row.status] || row.status}
          </Badge>
        ),
      },
      {
        key: 'history',
        label: 'Geçmiş',
        render: (row) =>
          row.companyId ? (
            <Link
              to={`/musteriler/${row.companyId}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-bach-blue hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <History className="h-3.5 w-3.5" />
              Giriş geçmişi
            </Link>
          ) : (
            <span className="text-xs text-text-subtle">—</span>
          ),
      },
      {
        key: 'actions',
        label: 'İşlemler',
        render: (row) => {
          const b = busy[row.id]
          const disabled = !!b
          return (
            <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Tüm oturumları kapat"
                onClick={() =>
                  void runAction(row.id, 'force-logout', () => platformAdminApi.forceLogout(row.id))
                }
              >
                <LogOut className="h-3.5 w-3.5" />
                {b === 'force-logout' ? '…' : 'Oturumu kapat'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled || row.status === 'suspended'}
                title="Hesabı askıya al"
                onClick={() => setPending({ type: 'suspend', row })}
              >
                <PauseCircle className="h-3.5 w-3.5" />
                Askıya al
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Şifre sıfırlama bağlantısı gönder"
                onClick={() =>
                  void runAction(row.id, 'reset-password', () =>
                    platformAdminApi.resetPassword(row.id),
                  )
                }
              >
                <KeyRound className="h-3.5 w-3.5" />
                {b === 'reset-password' ? '…' : 'Şifre sıfırla'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Deneme süresini 7 gün yenile"
                onClick={() =>
                  void runAction(row.id, 'reset-trial', () => platformAdminApi.resetTrial(row.id))
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {b === 'reset-trial' ? '…' : 'Deneme yenile'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Planı Pro’ya yükselt"
                onClick={() =>
                  void runAction(row.id, 'upgrade-plan', () =>
                    platformAdminApi.upgradePlan(row.id, 'Pro'),
                  )
                }
              >
                <ArrowUpCircle className="h-3.5 w-3.5" />
                {b === 'upgrade-plan' ? '…' : 'Plan yükselt'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={disabled}
                title="Kullanıcıyı sil"
                onClick={() => setPending({ type: 'delete', row })}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Sil
              </Button>
            </div>
          )
        },
      },
    ],
    [busy, runAction],
  )

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader title="Kullanıcı Yönetimi" subtitle="Şirket / kullanıcı operasyonları" />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error') return <ErrorState onRetry={reload} />

  const rows = data ?? []
  const pendingRow = pending?.row
  const confirmBusy =
    !!pendingRow &&
    ((pending?.type === 'delete' && busy[pendingRow.id] === 'delete') ||
      (pending?.type === 'suspend' && busy[pendingRow.id] === 'suspend'))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <ConfirmDialog
        open={pending?.type === 'delete'}
        title="Kullanıcı silinsin mi?"
        description={
          pendingRow
            ? `${pendingRow.user} (${pendingRow.email}) kalıcı olarak silinecek. Bu işlem geri alınamaz.`
            : undefined
        }
        confirmLabel="Evet"
        cancelLabel="Hayır"
        tone="danger"
        busy={confirmBusy && pending?.type === 'delete'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pendingRow || pending?.type !== 'delete') return
          const target = pendingRow
          void (async () => {
            setBusy((b) => ({ ...b, [target.id]: 'delete' }))
            setFlash(null)
            try {
              await platformAdminApi.deleteUser(target.id)
              setPending(null)
              setFlash({ ok: true, message: 'Kullanıcı silindi' })
              reload()
            } catch (err) {
              setFlash({
                ok: false,
                message: err instanceof Error ? err.message : 'Silme başarısız',
              })
            } finally {
              setBusy((b) => ({ ...b, [target.id]: undefined }))
            }
          })()
        }}
      />
      <ConfirmDialog
        open={pending?.type === 'suspend'}
        title="Hesap askıya alınsın mı?"
        description={
          pendingRow
            ? `${pendingRow.user} (${pendingRow.email}) giriş yapamayacak ve oturumları kapatılacak.`
            : undefined
        }
        confirmLabel="Evet"
        cancelLabel="Hayır"
        tone="danger"
        busy={confirmBusy && pending?.type === 'suspend'}
        onCancel={() => setPending(null)}
        onConfirm={() => {
          if (!pendingRow || pending?.type !== 'suspend') return
          const target = pendingRow
          setPending(null)
          void runAction(target.id, 'suspend', () => platformAdminApi.suspend(target.id))
        }}
      />
      <PageHeader
        title="Kullanıcı Yönetimi"
        subtitle="Oturum kapatma, askıya alma, şifre/deneme yenileme, plan yükseltme ve silme"
        actions={
          <Button variant="secondary" size="sm" onClick={reload}>
            <RefreshCw className="h-4 w-4" /> Yenile
          </Button>
        }
      />

      {flash && (
        <div
          className={`rounded-lg border px-4 py-2 text-sm ${
            flash.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {flash.message}
        </div>
      )}

      {rows.length === 0 ? (
        <EmptyState title="Kullanıcı yok" description="Platform kullanıcı kaydı bulunamadı." />
      ) : (
        <DataTable columns={columns} rows={rows} />
      )}
    </motion.div>
  )
}
