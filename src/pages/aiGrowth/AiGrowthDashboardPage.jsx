import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3, BookOpen, Clapperboard, Eye, Megaphone, Search, Share2, Sparkles, Wallet,
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
import { AI_GROWTH_STUDIO_CONFIGS } from './studioConfigs'

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
  return to ? <Link to={to} className="block">{body}</Link> : body
}

export default function AiGrowthDashboardPage() {
  const [health, setHealth] = useState(null)
  const library = useMemo(() => readAiGrowthLibrary().items || [], [])
  const calendar = useMemo(() => readAiGrowthCalendar().posts || [], [])
  const usageSummary = useMemo(() => summarizeAiGrowthUsage(readAiGrowthUsage().entries || []), [])

  useEffect(() => {
    fetchAiGrowthHealth().then(setHealth).catch(() => setHealth({ hasApiKey: false }))
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const createdToday = library.filter((item) => String(item.createdAt || '').startsWith(today)).length
  const weekPosts = calendar.filter((post) => post.status !== 'done').length

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI Growth Center"
        actions={(
          <div className="flex flex-wrap gap-2">
            <Link to="/ai-buyume/icerik" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
              <Sparkles className="h-4 w-4" /> İçerik Üret
            </Link>
            <Link to="/ai-buyume/ayarlar" className="btn-ghost !px-3 !py-2 text-xs font-bold">Ayarlar</Link>
          </div>
        )}
      />

      <div className="glass-inset rounded-[22px] p-5">
        <p className="text-sm text-[var(--ink)]">
          BachMain AI Growth Center™ — işletmenizin AI pazarlama departmanı.
        </p>
        <p className="mt-1 text-xs text-[var(--muted)]">
          OpenAI bağlantısı: {health?.hasApiKey ? `Hazır (${health.source || 'env/ayar'})` : 'Tanımlı değil — Ayarlar > AI > OpenAI'}
          {health?.defaultModel ? ` · Varsayılan model: ${health.defaultModel}` : ''}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Sparkles} label="Bugün oluşturulan içerikler" value={createdToday} to="/ai-buyume/icerik" />
        <MetricCard icon={Share2} label="Bu hafta paylaşılacaklar" value={weekPosts} to="/ai-buyume/sosyal" />
        <MetricCard icon={Eye} label="Toplam sosyal medya hesabı" value="—" hint="Bağlantı sonraki sürüm" />
        <MetricCard icon={BookOpen} label="Toplam blog" value={library.filter((i) => i.type === 'blog_center').length} to="/ai-buyume/blog" />
        <MetricCard icon={Megaphone} label="Toplam reklam" value={library.filter((i) => i.type === 'ads_center').length} to="/ai-buyume/reklam" />
        <MetricCard icon={Clapperboard} label="Toplam video" value={library.filter((i) => i.type?.includes('video')).length} to="/ai-buyume/video" />
        <MetricCard icon={Search} label="SEO puanı" value="—" hint="SEO Merkezi ile hesapla" to="/ai-buyume/seo" />
        <MetricCard icon={BarChart3} label="Organik trafik tahmini" value="—" hint="Trend + SEO birleşik" to="/ai-buyume/trend" />
        <MetricCard icon={Search} label="Rakip analizi" value={library.filter((i) => i.type === 'competitor_analysis').length} to="/ai-buyume/rakip" />
        <MetricCard icon={Sparkles} label="Trend anahtar kelimeler" value={library.filter((i) => i.type === 'keyword_center').length} to="/ai-buyume/anahtar-kelime" />
        <MetricCard
          icon={Wallet}
          label="Toplam AI kullanım maliyeti"
          value={`$${usageSummary.monthCostUsd.toFixed(2)}`}
          hint={`Bu ay ${usageSummary.monthTokens} token`}
          to="/ai-buyume/ayarlar"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(AI_GROWTH_STUDIO_CONFIGS).slice(0, 9).map(([key, cfg]) => (
          <Link
            key={key}
            to={`/ai-buyume/${key === 'content' ? 'icerik' : key === 'ads' ? 'reklam' : key === 'competitor' ? 'rakip' : key === 'keywords' ? 'anahtar-kelime' : key === 'productPhoto' ? 'urun-fotografi' : key === 'videoScript' ? 'video-senaryosu' : key === 'design' ? 'tasarim' : key === 'visual' ? 'gorsel' : key}`}
            className="glass-inset rounded-2xl p-4 transition-transform hover:-translate-y-0.5"
          >
            <p className="text-sm font-semibold text-[var(--ink)]">{cfg.title}</p>
            <p className="mt-1 text-xs text-[var(--muted)]">{cfg.description}</p>
          </Link>
        ))}
      </div>
    </AppPageShell>
  )
}
