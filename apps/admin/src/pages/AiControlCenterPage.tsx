import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Bot,
  Brain,
  Clock,
  Coins,
  KeyRound,
  Library,
  ScrollText,
  Settings,
  ShieldAlert,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { MetricCard, PageHeader } from '@/components/ui/MetricCard'
import { MetricSkeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/ErrorState'
import { usePageState } from '@/hooks/usePageState'
import { platformAdminApi, type AiosOverview } from '@/services/platformAdminApi'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard', icon: Activity },
  { id: 'agents', label: 'Agent Manager', icon: Bot },
  { id: 'models', label: 'Model Manager', icon: KeyRound },
  { id: 'prompts', label: 'Prompt Library', icon: Library },
  { id: 'tools', label: 'Tool Library', icon: Wrench },
  { id: 'memory', label: 'Memory', icon: Brain },
  { id: 'knowledge', label: 'Knowledge Base', icon: Library },
  { id: 'usage', label: 'Usage', icon: Activity },
  { id: 'costs', label: 'Costs', icon: Coins },
  { id: 'logs', label: 'Logs', icon: ScrollText },
  { id: 'approvals', label: 'Approvals', icon: ShieldAlert },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'alerts', label: 'Alerts', icon: Clock },
  { id: 'settings', label: 'Settings', icon: Settings },
] as const

export function AiControlCenterPage() {
  const [section, setSection] = useState<(typeof SECTIONS)[number]['id']>('dashboard')
  const fetcher = useMemo(() => () => platformAdminApi.getAiosOverview(), [])
  const { status, data, reload } = usePageState({ fetcher, delay: 0 })

  if (status === 'loading') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="AI Control Center"
          subtitle="AIOS · kurumsal yapay zeka işletim sistemi"
        />
        <MetricSkeleton />
      </div>
    )
  }

  if (status === 'error' || !data) return <ErrorState onRetry={reload} />

  const overview = data as AiosOverview

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Control Center"
        subtitle="Gateway · Multi-Agent · Tools · Human Approval · Audit"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Agent"
          value={String(overview.agentsTotal)}
          change="Standart kayıt"
          trend="neutral"
        />
        <MetricCard
          label="Araç"
          value={String(overview.toolsTotal)}
          change="Tool library"
          trend="neutral"
        />
        <MetricCard
          label="Provider"
          value={`${overview.providersConfigured}/${overview.providers.length}`}
          change="Yapılandırılmış"
          trend={overview.providersConfigured > 0 ? 'up' : 'neutral'}
        />
        <MetricCard label="Onay kuyruğu" value="—" change="Tenant bazlı" trend="neutral" />
      </div>

      <div className="flex flex-wrap gap-2">
        {SECTIONS.map((s) => {
          const Icon = s.icon
          const active = section === s.id
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setSection(s.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? 'border-bach-navy/30 bg-bach-navy/10 text-bach-navy'
                  : 'border-border bg-white text-text-muted hover:bg-surface-muted'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {s.label}
            </button>
          )
        })}
      </div>

      {section === 'dashboard' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="h-4 w-4" />
                Mimari
              </CardTitle>
            </CardHeader>
            <div className="space-y-2 px-6 pb-6 text-sm text-text-muted">
              <p>Browser → Backend API → AI Gateway → Model Provider → Audit</p>
              <p>Frontend modele doğrudan bağlanmaz. AI DB’ye yazmaz; Tools + onay.</p>
              <Badge variant={overview.mock ? 'warning' : 'success'}>
                {overview.mock ? 'Mock / offline overview' : 'Live API'}
              </Badge>
            </div>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Model Providers</CardTitle>
            </CardHeader>
            <ul className="space-y-2 px-6 pb-6">
              {overview.providers.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium text-text">{p.label}</span>
                  <Badge variant={p.configured ? 'success' : 'warning'}>
                    {p.configured ? 'Hazır' : 'Stub'}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {section === 'agents' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Agent Manager · {overview.agents?.length || 0}
            </CardTitle>
          </CardHeader>
          <div className="max-h-[28rem] space-y-2 overflow-y-auto px-6 pb-6">
            {(overview.agents || []).map((a) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border bg-surface-muted/40 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-text">{a.name}</div>
                  <Badge variant="success">ready</Badge>
                </div>
                <div className="mt-0.5 text-xs text-text-muted">
                  {a.role} · {a.defaultProvider}/{a.defaultModel} · limit ${a.costLimitUsd}
                </div>
                <div className="mt-1 text-[11px] text-text-subtle">{a.modules.join(' · ')}</div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {section === 'tools' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tool Library</CardTitle>
          </CardHeader>
          <div className="max-h-[28rem] space-y-2 overflow-y-auto px-6 pb-6">
            {(overview.tools || []).map((t) => (
              <div key={t.id} className="rounded-xl border border-border px-3 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{t.label}</span>
                  {t.requiresHumanApproval ? (
                    <Badge variant="warning">İnsan onayı</Badge>
                  ) : (
                    <Badge variant="default">Araç</Badge>
                  )}
                </div>
                <p className="text-xs text-text-muted">{t.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {section === 'models' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Model Manager</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 text-sm text-text-muted">
            Görev bazlı model seçimi AIOS-3’te tamamlanacak. Şu an OpenAI canlı; diğerleri adapter
            stub.
            <ul className="mt-3 space-y-2">
              {overview.providers.map((p) => (
                <li key={p.id} className="rounded-lg border border-border px-3 py-2">
                  <div className="font-semibold text-text">{p.label}</div>
                  <div className="text-xs">{(p.models || []).join(', ')}</div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {!['dashboard', 'agents', 'tools', 'models'].includes(section) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {SECTIONS.find((s) => s.id === section)?.label}
            </CardTitle>
          </CardHeader>
          <div className="px-6 pb-6 text-sm text-text-muted">
            AIOS-0 iskeleti hazır. Bu bölüm tenant API (`/v1/aios/*`) ve sonraki fazlarda
            doldurulacak. Prompt Library, Memory, Costs, Approvals ve Automation uçları platform
            API’de tanımlı.
          </div>
        </Card>
      )}
    </div>
  )
}
