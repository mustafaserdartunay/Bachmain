import { useMemo } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/ui/MetricCard'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, statusBadgeMap } from '@/components/ui/Badge'
import { usePageState } from '@/hooks/usePageState'
import { DetailSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { EmptyState } from '@/components/ui/EmptyState'
import { getModuleById } from '@/data/modules'
import { modulesApi } from '@/services/api'
import { formatDate } from '@/lib/utils'
import type { BadgeVariant } from '@/types'

interface ModuleDetailPageProps {
  moduleId: string
}

export function ModuleDetailPage({ moduleId }: ModuleDetailPageProps) {
  const { id, itemId } = useParams()
  const recordId = id ?? itemId
  const navigate = useNavigate()
  const config = getModuleById(moduleId)

  const fetcher = useMemo(
    () => async () => {
      if (!config || !recordId) throw new Error('Kayıt bulunamadı')
      if (moduleId === 'customers') {
        const { customersApi } = await import('@/services/api')
        const customer = await customersApi.get(recordId)
        return { config, row: { id: customer.id, company: customer.company, contact: customer.contact, city: customer.city, plan: customer.plan, mrr: `₺${customer.mrr}`, status: customer.status, licenseExpiry: customer.licenseExpiry } }
      }
      const row = await modulesApi.get(moduleId, recordId)
      return { config, row }
    },
    [config, recordId, moduleId],
  )

  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  if (!config) return <EmptyState title="Modül bulunamadı" />

  if (status === 'loading') return <DetailSkeleton />
  if (status === 'error') return <ErrorState onRetry={reload} title="Kayıt bulunamadı" description="İstenen kayıt bulunamadı veya silinmiş olabilir." />
  if (!data) return null

  const { row } = data
  const titleKey = config.columns[0]?.key ?? 'id'
  const title = String(row[titleKey] ?? recordId)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <PageHeader
        title={title}
        subtitle={`${config.singularName} detayı`}
        breadcrumbs={[
          { label: config.title, href: config.path },
          { label: title },
        ]}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => navigate(config.path)}>
              <ArrowLeft className="h-4 w-4" /> Geri
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(`${config.path}/${recordId}/duzenle`)}>
              <Pencil className="h-4 w-4" /> Düzenle
            </Button>
            <Button variant="danger" size="sm">
              <Trash2 className="h-4 w-4" /> Sil
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" padding="lg">
          <CardHeader>
            <CardTitle className="text-base">Genel Bilgiler</CardTitle>
          </CardHeader>
          <dl className="grid gap-4 sm:grid-cols-2">
            {config.columns.map((col) => {
              const val = String(row[col.key] ?? '—')
              const isStatus = col.key === 'status' || col.key === 'priority'
              return (
                <div key={col.key}>
                  <dt className="text-xs font-medium text-text-subtle">{col.label}</dt>
                  <dd className="mt-1 text-sm font-semibold text-text">
                    {isStatus ? (
                      <Badge variant={(statusBadgeMap[val.toLowerCase()] ?? 'default') as BadgeVariant}>{val}</Badge>
                    ) : val}
                  </dd>
                </div>
              )
            })}
          </dl>
        </Card>

        <Card padding="lg">
          <CardHeader>
            <CardTitle className="text-base">Meta</CardTitle>
          </CardHeader>
          <dl className="space-y-3">
            <div>
              <dt className="text-xs text-text-subtle">Kayıt ID</dt>
              <dd className="text-sm font-mono text-text">{recordId}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Modül</dt>
              <dd className="text-sm text-text">{config.title}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-subtle">Son Güncelleme</dt>
              <dd className="text-sm text-text">{formatDate(new Date())}</dd>
            </div>
          </dl>
        </Card>
      </div>

      <Card padding="lg">
        <CardHeader>
          <CardTitle className="text-base">İlişkili Kayıtlar</CardTitle>
        </CardHeader>
        <p className="text-sm text-text-muted">
          Bu kayıtla ilişkili diğer modül kayıtlarına{' '}
          <Link to="/musteriler" className="font-medium text-bach-blue hover:underline">Müşteri Yönetimi</Link>
          {' '}veya{' '}
          <Link to="/destek" className="font-medium text-bach-blue hover:underline">Destek</Link>
          {' '}modüllerinden erişebilirsiniz.
        </p>
      </Card>
    </motion.div>
  )
}
