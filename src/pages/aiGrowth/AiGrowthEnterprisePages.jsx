import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Bot,
  FileBarChart,
  GitBranch,
  MessageSquare,
  Smartphone,
  Target,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import { publishDomainEvent } from '../../workflow/eventBus'
import { aiGrowthStudioExtras } from '../../data/aiGrowthMenu'
import {
  GROWTH_UPDATED_EVENT,
  addCampaignLocal,
  addLeadLocal,
  addSmsLocal,
  ensureGrowthSeed,
  listCampaignsLocal,
  listFunnelsLocal,
  listLeadsLocal,
  listSmsLocal,
  scoreLeadLocal,
} from '../../growth/localStore'

function Shell({ title, children, actions }) {
  return (
    <AppPageShell>
      <AppPageHeader title={title} backTo="/ai-buyume" actions={actions} />
      {children}
    </AppPageShell>
  )
}

export function AiGrowthLeadCenterPage() {
  const [leads, setLeads] = useState([])
  const [draft, setDraft] = useState({
    name: '',
    email: '',
    companyName: '',
    source: 'web_form',
    message: '',
  })

  function refresh() {
    setLeads(listLeadsLocal())
  }

  useEffect(() => {
    ensureGrowthSeed()
    refresh()
    const fn = () => refresh()
    window.addEventListener(GROWTH_UPDATED_EVENT, fn)
    return () => window.removeEventListener(GROWTH_UPDATED_EVENT, fn)
  }, [])

  function addLead(e) {
    e.preventDefault()
    const lead = addLeadLocal(draft)
    publishDomainEvent(
      'trigger.growth.lead.created',
      { leadId: lead.id, source: lead.source },
      {
        source: 'growth',
      },
    )
    setDraft({ name: '', email: '', companyName: '', source: 'web_form', message: '' })
    refresh()
  }

  function score(id) {
    const lead = scoreLeadLocal(id)
    if (!lead) return
    publishDomainEvent(
      'trigger.growth.lead.scored',
      { leadId: lead.id, score: lead.score, temperature: lead.temperature },
      { source: 'growth' },
    )
    refresh()
  }

  return (
    <Shell
      title="Lead Center"
      actions={
        <Link to="/musteriler" className="btn-ghost !px-3 !py-2 text-xs font-bold">
          CRM Müşteriler
        </Link>
      }
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Lead ekle">
          <form onSubmit={addLead} className="space-y-3">
            <input
              className="form-input"
              placeholder="Ad"
              value={draft.name}
              onChange={(e) => setDraft((c) => ({ ...c, name: e.target.value }))}
              required
            />
            <input
              className="form-input"
              placeholder="E-posta"
              value={draft.email}
              onChange={(e) => setDraft((c) => ({ ...c, email: e.target.value }))}
            />
            <input
              className="form-input"
              placeholder="Firma"
              value={draft.companyName}
              onChange={(e) => setDraft((c) => ({ ...c, companyName: e.target.value }))}
            />
            <select
              className="form-input"
              value={draft.source}
              onChange={(e) => setDraft((c) => ({ ...c, source: e.target.value }))}
            >
              {[
                'web_form',
                'qr',
                'ocr',
                'phone',
                'whatsapp',
                'instagram',
                'facebook',
                'linkedin',
                'api',
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <textarea
              className="form-input min-h-[80px]"
              placeholder="Mesaj"
              value={draft.message}
              onChange={(e) => setDraft((c) => ({ ...c, message: e.target.value }))}
            />
            <button type="submit" className={`${BTN_PRIMARY} gap-2 px-4 text-xs`}>
              <UserPlus className="h-4 w-4" /> Havuz a ekle
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Tek havuz">
          <div className="space-y-2">
            {leads.map((l) => (
              <div
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dark-500/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {l.name} · {l.source}
                  </p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {l.email || '—'} · {l.companyName || '—'} · skor {l.score} · {l.temperature}
                    {l.estimatedRevenue ? ` · ~${l.estimatedRevenue} ₺` : ''}
                  </p>
                </div>
                {l.status !== 'scored' ? (
                  <button
                    type="button"
                    onClick={() => score(l.id)}
                    className="rounded-lg border border-emerald-400/40 px-2 py-1 text-[10px] font-black uppercase text-emerald-200"
                  >
                    AI Skor
                  </button>
                ) : (
                  <span className="text-[10px] font-bold uppercase text-emerald-300">
                    {l.temperature}
                  </span>
                )}
              </div>
            ))}
          </div>
        </AppPagePanel>
      </div>
    </Shell>
  )
}

export function AiGrowthFunnelPage() {
  const [funnels, setFunnels] = useState([])
  useEffect(() => {
    ensureGrowthSeed()
    setFunnels(listFunnelsLocal())
  }, [])

  return (
    <Shell title="Funnel Builder">
      <AppPagePanel title="Satış hunisi (AG-0)">
        <p className="mb-4 text-sm text-[var(--muted)]">
          Lead → Mail → Teklif → Sipariş → Tahsilat → Sadakat. Görsel canvas AG-3.
        </p>
        {funnels.map((f) => (
          <div key={f.id} className="space-y-3">
            <p className="text-sm font-bold">{f.name}</p>
            <div className="flex flex-wrap items-center gap-2">
              {f.stages.map((st, i) => (
                <div key={st.id} className="flex items-center gap-2">
                  <div className="rounded-xl border border-dark-500/40 bg-white/30 px-3 py-2 text-center">
                    <p className="text-[10px] font-bold uppercase text-[var(--muted)]">
                      {st.label}
                    </p>
                    <p className="text-lg font-black">{st.count ?? 0}</p>
                  </div>
                  {i < f.stages.length - 1 ? (
                    <GitBranch className="h-4 w-4 rotate-90 text-[var(--muted)]" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </AppPagePanel>
    </Shell>
  )
}

export function AiGrowthCampaignPage() {
  const [rows, setRows] = useState([])
  const [name, setName] = useState('')

  useEffect(() => {
    ensureGrowthSeed()
    setRows(listCampaignsLocal())
  }, [])

  function add(e) {
    e.preventDefault()
    if (!name.trim()) return
    const row = addCampaignLocal(name.trim(), 'multi')
    publishDomainEvent(
      'trigger.growth.campaign.created',
      { campaignId: row.id },
      { source: 'growth' },
    )
    setName('')
    setRows(listCampaignsLocal())
  }

  return (
    <Shell title="Campaign Center">
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Kampanya">
          <form onSubmit={add} className="flex gap-2">
            <input
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kampanya adı"
            />
            <button type="submit" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
              <Target className="h-4 w-4" /> Ekle
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Liste">
          {rows.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Henüz kampanya yok.</p>
          ) : (
            rows.map((r) => (
              <div key={r.id} className="rounded-xl border border-dark-500/40 px-3 py-2 text-sm">
                {r.name} · {r.channel} · {r.status}
              </div>
            ))
          )}
        </AppPagePanel>
      </div>
    </Shell>
  )
}

export function AiGrowthSmsPage() {
  const [rows, setRows] = useState([])
  const [title, setTitle] = useState('')

  useEffect(() => {
    ensureGrowthSeed()
    setRows(listSmsLocal())
  }, [])

  function add(e) {
    e.preventDefault()
    if (!title.trim()) return
    addSmsLocal(title.trim())
    setTitle('')
    setRows(listSmsLocal())
  }

  return (
    <Shell title="SMS Marketing">
      <AppPagePanel title="SMS kampanyası (AG-0 stub)">
        <form onSubmit={add} className="mb-4 flex gap-2">
          <input
            className="form-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Kampanya başlığı"
          />
          <button type="submit" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
            <Smartphone className="h-4 w-4" /> Kaydet
          </button>
        </form>
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-dark-500/40 px-3 py-2 text-sm">
            {r.title} · {r.status}
          </div>
        ))}
      </AppPagePanel>
    </Shell>
  )
}

export function AiGrowthCrmMarketingPage() {
  return (
    <Shell title="CRM Marketing">
      <AppPagePanel title="CRM ile büyüme">
        <p className="text-sm text-[var(--muted)]">
          Segment, teklif takip, yeniden etkileşim. Lead Center skorları CRM müşterisine bağlanır
          (AG-1).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/ai-buyume/lead" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
            <UserPlus className="h-4 w-4" /> Lead Center
          </Link>
          <Link to="/musteriler" className="btn-ghost !px-3 !py-2 text-xs font-bold">
            <Users className="h-4 w-4" /> Müşteriler
          </Link>
          <Link to="/teklifler" className="btn-ghost !px-3 !py-2 text-xs font-bold">
            Teklifler
          </Link>
        </div>
      </AppPagePanel>
    </Shell>
  )
}

export function AiGrowthReportsPage() {
  return (
    <Shell title="Growth Reports">
      <AppPagePanel title="Raporlar (AG-0)">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Haftalık / aylık / yıllık — SEO, reklam, lead, satış, AI.
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {['Haftalık Özet', 'Aylık SEO', 'Reklam ROAS', 'Lead Dönüşüm', 'AI Kullanım'].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2 rounded-xl border border-dark-500/40 px-3 py-3 text-sm font-semibold"
            >
              <FileBarChart className="h-4 w-4 text-amber-500" />
              {t}
              <span className="ml-auto text-[10px] uppercase text-[var(--muted)]">stub</span>
            </div>
          ))}
        </div>
      </AppPagePanel>
    </Shell>
  )
}

export function AiGrowthAiStudioHubPage() {
  return (
    <Shell
      title="AI Studio"
      actions={
        <Link to="/aios" className="btn-ghost !px-3 !py-2 text-xs font-bold gap-2 inline-flex">
          <Workflow className="h-4 w-4" /> AIOS
        </Link>
      }
    >
      <AppPagePanel title="Stüdyolar ve ajanlar">
        <p className="mb-3 text-sm text-[var(--muted)]">
          Manuel veya AI destekli. Gateway yolu: AIOS. Growth OpenAI proxy korunur.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {aiGrowthStudioExtras.map((x) => (
            <Link
              key={x.path}
              to={x.path}
              className="rounded-xl border border-dark-500/40 px-3 py-3 text-sm font-semibold hover:bg-white/20"
            >
              <Bot className="mb-1 h-4 w-4 text-violet-500" />
              {x.label}
            </Link>
          ))}
        </div>
      </AppPagePanel>
    </Shell>
  )
}

export function AiGrowthSmsShortcutIcon() {
  return <MessageSquare className="h-4 w-4" />
}
