import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3,
  Eye,
  FileBarChart,
  Megaphone,
  Search,
  Share2,
  Sparkles,
  Target,
  UserPlus,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import {
  readAiGrowthCalendar,
  readAiGrowthLibrary,
  readAiGrowthUsage,
  summarizeAiGrowthUsage,
} from '../../utils/aiGrowthSettings'
import { fetchAiGrowthHealth } from '../../utils/aiGrowthApi'
import { ensureGrowthSeed, growthKpisLocal } from '../../growth/localStore'

function MetricCard({ icon: Icon, label, value, hint, to }) {
  const body = (
    <div className="glass-inset rounded-[22px] p-5 transition-transform duration-200 hover:-translate-y-0.5 hover:scale-[1.01]">
      <div className="mb-3 flex items-center gap-2 text-[var(--muted)]">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/40">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-xs font-semibold tracking-wide">{label}</span>
      </div>
      <p className="text-[28px] font-bold leading-none text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-2 text-xs text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

function money(n) {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(n)
}

export default function AiGrowthDashboardPage() {
  const [health, setHealth] = useState(null)
  const library = useMemo(() => readAiGrowthLibrary().items || [], [])
  const calendar = useMemo(() => readAiGrowthCalendar().posts || [], [])
  const usageSummary = useMemo(() => summarizeAiGrowthUsage(readAiGrowthUsage().entries || []), [])
  const kpis = useMemo(
    () => growthKpisLocal(library.length, calendar.filter((p) => p.status !== 'done').length),
    [library.length, calendar],
  )

  useEffect(() => {
    ensureGrowthSeed()
    fetchAiGrowthHealth()
      .then(setHealth)
      .catch(() => setHealth({ hasApiKey: false }))
  }, [])

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI Growth Center"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/ai-buyume/icerik" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
              <Sparkles className="h-4 w-4" /> İçerik Üret
            </Link>
            <Link to="/ai-buyume/lead" className="btn-ghost !px-3 !py-2 text-xs font-bold">
              Lead Center
            </Link>
            <Link
              to="/otomasyon"
              className="btn-ghost !px-3 !py-2 text-xs font-bold inline-flex gap-1"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link to="/ai-buyume/ayarlar" className="btn-ghost !px-3 !py-2 text-xs font-bold">
              Ayarlar
            </Link>
          </div>
        }
      />

      <div className="glass-inset rounded-[22px] p-5">
        <p className="text-sm text-[var(--ink)]">
          BachMain AI Growth Center™ — şirketi büyütür: SEO, içerik, reklam, sosyal, lead, funnel.
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          OpenAI:{' '}
          {health?.hasApiKey
            ? `Hazır (${health.source || 'env/ayar'})`
            : 'Tanımlı değil — Ayarlar > AI > OpenAI'}
          {health?.defaultModel ? ` · Model: ${health.defaultModel}` : ''} · AG-0 · Workflow / AIOS
          / Knowledge entegre
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Eye}
          label="Bugünkü ziyaretçi"
          value={kpis.visitorsToday}
          hint="AG-0 demo"
        />
        <MetricCard icon={UserPlus} label="Yeni lead" value={kpis.newLeads} to="/ai-buyume/lead" />
        <MetricCard icon={Users} label="Yeni müşteri" value={kpis.newCustomers} to="/musteriler" />
        <MetricCard icon={FileBarChart} label="Teklif" value={kpis.quotes} to="/teklifler" />
        <MetricCard icon={Target} label="Sipariş" value={kpis.orders} to="/siparisler" />
        <MetricCard icon={Wallet} label="Gelir" value={money(kpis.revenue)} />
        <MetricCard
          icon={Megaphone}
          label="Reklam harcaması"
          value={money(kpis.adSpend)}
          to="/ai-buyume/reklam"
        />
        <MetricCard icon={BarChart3} label="ROAS" value={kpis.roas.toFixed(1)} />
        <MetricCard icon={BarChart3} label="ROI" value={kpis.roi.toFixed(1)} />
        <MetricCard icon={Wallet} label="CAC" value={money(kpis.cac)} />
        <MetricCard icon={Wallet} label="LTV" value={money(kpis.ltv)} />
        <MetricCard icon={Search} label="SEO skoru" value={kpis.seoScore} to="/ai-buyume/seo" />
        <MetricCard
          icon={Sparkles}
          label="AI içerikleri"
          value={kpis.aiContents}
          to="/ai-buyume/icerik"
        />
        <MetricCard
          icon={Share2}
          label="Sosyal paylaşımlar"
          value={kpis.socialPosts}
          to="/ai-buyume/sosyal"
        />
        <MetricCard icon={UserPlus} label="Sıcak lead" value={kpis.hotLeads} to="/ai-buyume/lead" />
        <MetricCard
          icon={Wallet}
          label="AI maliyet (ay)"
          value={`$${usageSummary.monthCostUsd.toFixed(2)}`}
          hint={`${usageSummary.monthTokens} token`}
          to="/ai-buyume/ayarlar"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: '/ai-buyume/seo', t: 'SEO Center' },
          { to: '/ai-buyume/kampanya', t: 'Campaign Center' },
          { to: '/ai-buyume/funnel', t: 'Funnels' },
          { to: '/ai-buyume/raporlar', t: 'Growth Reports' },
          { to: '/ai-buyume/ai-studio', t: 'AI Studio' },
          { to: '/ai-buyume/otomasyon', t: 'Automation' },
          { to: '/aios', t: 'AIOS' },
          { to: '/bilgi-merkezi', t: 'Knowledge' },
        ].map((x) => (
          <Link
            key={x.to}
            to={x.to}
            className="glass-inset rounded-2xl p-4 text-sm font-semibold transition-transform hover:-translate-y-0.5"
          >
            {x.t}
          </Link>
        ))}
      </div>
    </AppPageShell>
  )
}
