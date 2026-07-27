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

export function UserManagementPage() {
  const fetcher = useMemo(() => () => platformAdminApi.listUsers(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })
  const [busy, setBusy] = useState<BusyMap>({})
  const [flash, setFlash] = useState<{ ok: boolean; message: string } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PlatformUserRow | null>(null)

  const runAction = useCallback(
    async (userId: string, actionKey: string, fn: () => Promise<unknown>) => {
      setBusy((b) => ({ ...b, [userId]: actionKey }))
      setFlash(null)
      try {
        await fn()
        setFlash({ ok: true, message: `${actionKey} başarıyla uygulandı` })
        reload()
      } catch (err) {
        setFlash({
          ok: false,
          message:
            err instanceof Error
              ? err.message
              : 'İşlem başarısız (endpoint henüz hazır olmayabilir)',
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
            {row.status}
          </Badge>
        ),
      },
      {
        key: 'history',
        label: 'Geçmiş',
        render: (row) => (
          <Link
            to={`/musteriler/${row.companyId}`}
            className="inline-flex items-center gap-1 text-xs font-semibold text-bach-blue hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <History className="h-3.5 w-3.5" />
            Login history
          </Link>
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
                title="Force Logout"
                onClick={() =>
                  runAction(row.id, 'force-logout', () => platformAdminApi.forceLogout(row.id))
                }
              >
                <LogOut className="h-3.5 w-3.5" />
                {b === 'force-logout' ? '…' : 'Logout'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Suspend"
                onClick={() => runAction(row.id, 'suspend', () => platformAdminApi.suspend(row.id))}
              >
                <PauseCircle className="h-3.5 w-3.5" />
                Suspend
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Reset Password"
                onClick={() =>
                  runAction(row.id, 'reset-password', () => platformAdminApi.resetPassword(row.id))
                }
              >
                <KeyRound className="h-3.5 w-3.5" />
                Reset PW
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Reset Trial"
                onClick={() =>
                  runAction(row.id, 'reset-trial', () => platformAdminApi.resetTrial(row.id))
                }
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Trial
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled={disabled}
                title="Upgrade Plan"
                onClick={() =>
                  runAction(row.id, 'upgrade-plan', () =>
                    platformAdminApi.upgradePlan(row.id, 'Pro'),
                  )
                }
              >
                <ArrowUpCircle className="h-3.5 w-3.5" />
                Upgrade
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={disabled}
                title="Delete"
                onClick={() => setDeleteTarget(row)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
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
        <PageHeader title="User Management" subtitle="Şirket / kullanıcı operasyonları" />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error') return <ErrorState onRetry={reload} />

  const rows = data ?? []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <ConfirmDialog
        open={!!deleteTarget}
        title="Kullanıcı silinsin mi?"
        description={
          deleteTarget
            ? `${deleteTarget.user} (${deleteTarget.email}) kalıcı olarak silinecek.`
            : undefined
        }
        confirmLabel="Evet"
        cancelLabel="Hayır"
        tone="danger"
        busy={!!deleteTarget && busy[deleteTarget.id] === 'delete'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) return
          const target = deleteTarget
          setDeleteTarget(null)
          void runAction(target.id, 'delete', () => platformAdminApi.deleteUser(target.id))
        }}
      />
      <PageHeader
        title="User Management"
        subtitle="SUPER_ADMIN — Force logout, suspend, reset, upgrade · /v1/admin/users"
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
