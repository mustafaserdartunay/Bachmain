import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bot, Library, Mic, ShieldAlert, Sparkles, Workflow } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../components/Layout/AppPageLayout'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { aiosSubMenus } from '../data/aiosMenu'
import { publishDomainEvent } from '../workflow/eventBus'
import { gatewayChatClient } from '../aios/api'
import {
  AIOS_UPDATED_EVENT,
  COMMAND_SAMPLES,
  ORCHESTRATOR_CHAINS,
  PROVIDERS_SEED,
  aiosOverviewLocal,
  clearMemoryLocal,
  decideApprovalLocal,
  ensureAiosSeed,
  listAgentsLocal,
  listApprovalsLocal,
  listChatLocal,
  listMemoryLocal,
  listPromptsLocal,
  listRunsLocal,
  listTasksLocal,
  toggleAgentLocal,
  usageLocal,
} from '../aios/localStore'

function Kpi({ label, value, hint }) {
  return (
    <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
      <p className="text-[11px] font-bold uppercase text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-black tabular-nums text-[var(--ink)]">{value}</p>
      {hint ? <p className="mt-1 text-[10px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
}

function DeepLinkCard({ to, title, desc }) {
  return (
    <Link
      to={to}
      className={`${APP_SURFACE_PANEL_CLASS} block p-4 transition hover:-translate-y-0.5`}
    >
      <p className="text-sm font-black uppercase text-[var(--ink)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{desc}</p>
    </Link>
  )
}

export default function AiosHubPage() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'home'
  const [msg, setMsg] = useState('')
  const [tick, setTick] = useState(0)
  const [prompt, setPrompt] = useState('')
  const [agentId, setAgentId] = useState('ai.ceo')
  const [busy, setBusy] = useState(false)

  const overview = useMemo(() => aiosOverviewLocal(), [tick])
  const agents = useMemo(() => listAgentsLocal(), [tick])
  const prompts = useMemo(() => listPromptsLocal(), [tick])
  const memory = useMemo(() => listMemoryLocal(), [tick])
  const approvals = useMemo(() => listApprovalsLocal(), [tick])
  const runs = useMemo(() => listRunsLocal(), [tick])
  const tasks = useMemo(() => listTasksLocal(), [tick])
  const chat = useMemo(() => listChatLocal(), [tick])
  const usage = useMemo(() => usageLocal(), [tick])

  useEffect(() => {
    ensureAiosSeed()
    const fn = () => setTick((n) => n + 1)
    window.addEventListener(AIOS_UPDATED_EVENT, fn)
    return () => window.removeEventListener(AIOS_UPDATED_EVENT, fn)
  }, [])

  function setTab(id) {
    const next = new URLSearchParams(params)
    if (id === 'home') next.delete('tab')
    else next.set('tab', id)
    setParams(next, { replace: true })
  }

  function flash(t) {
    setMsg(t)
    setTimeout(() => setMsg(''), 2200)
  }

  async function handleAsk(text) {
    const q = (text || prompt).trim()
    if (!q || busy) return
    setBusy(true)
    try {
      const result = await gatewayChatClient({
        agentId,
        messages: [{ role: 'user', content: q }],
      })
      publishDomainEvent('trigger.aios.chat.completed', {
        agentId,
        stub: Boolean(result.stub),
        source: result.source,
      })
      setPrompt('')
      setTick((n) => n + 1)
      flash(result.source === 'api' ? 'Gateway yanıtı alındı' : 'Yerel stub yanıtı')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI Operating System"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/ai-otonom"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Bot className="h-4 w-4" /> Otonom
            </Link>
            <Link
              to="/ai-organizasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Bot className="h-4 w-4" /> Org
            </Link>
            <Link
              to="/"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Sparkles className="h-4 w-4" /> Command
            </Link>
            <Link
              to="/otomasyon"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Workflow className="h-4 w-4" /> Workflow
            </Link>
            <Link
              to="/bilgi-merkezi"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Library className="h-4 w-4" /> Knowledge
            </Link>
            <Link
              to="/ai-buyume"
              className="inline-flex min-h-11 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase"
            >
              <Sparkles className="h-4 w-4" /> Growth
            </Link>
          </div>
        }
      />

      <div className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
        <div className="flex flex-wrap items-start gap-3">
          <Bot className="mt-0.5 h-5 w-5 text-emerald-600" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--ink)]">
              BachMain Enterprise AI Brain — şirketin dijital çalışanı. Sohbet değil; analiz, komut,
              ajan orkestrasyonu, belge, tahmin ve insan onaylı işlem. Browser modele bağlanmaz; AI
              Gateway (OpenAI + provider-agnostic stubs) kullanılır.
            </p>
            {msg ? <p className="mt-2 text-xs font-bold text-emerald-600">{msg}</p> : null}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {aiosSubMenus.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`min-h-10 rounded-xl border px-2.5 text-[11px] font-black uppercase ${
              tab === t.id
                ? 'border-[var(--ink)]/20 bg-white/55 text-[var(--ink)]'
                : 'border-dark-500/30 text-[var(--muted)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'home' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi label="Ajan" value={`${overview.agentsOn}/${overview.agents}`} />
            <Kpi label="Onay bekleyen" value={overview.pendingApprovals} />
            <Kpi label="Memory" value={overview.memoryItems} />
            <Kpi label="Maliyet (USD)" value={overview.costUsd} hint="yerel + gateway" />
          </div>

          <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
            <h2 className="text-sm font-black uppercase text-[var(--ink)]">AI Home</h2>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Yaz · komut seç · dosya/ses/görsel yükleme niyeti (AIOS-1+). Canlı çağrı:
              /v1/aios/gateway/chat
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <select
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="min-h-11 rounded-xl border bg-transparent px-3 text-xs font-bold"
              >
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
              <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAsk()
                }}
                placeholder="Örn: Ali firmasına teklif oluştur"
                className="min-h-11 min-w-[220px] flex-1 rounded-xl border bg-transparent px-3 text-sm"
              />
              <button
                type="button"
                disabled={busy}
                onClick={() => handleAsk()}
                className="min-h-11 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
              >
                {busy ? '…' : 'Gönder'}
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {COMMAND_SAMPLES.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleAsk(c)}
                  className="rounded-lg border px-2 py-1 text-[10px] font-bold text-[var(--muted)]"
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="mt-4 max-h-64 space-y-2 overflow-auto">
              {chat.length === 0 ? (
                <p className="text-xs text-[var(--muted)]">Henüz sohbet yok.</p>
              ) : (
                chat
                  .slice(-12)
                  .reverse()
                  .map((m) => (
                    <div key={m.id} className="rounded-xl border px-3 py-2 text-xs">
                      <span className="font-black uppercase text-[var(--muted)]">{m.role}</span>
                      <p className="mt-1 text-[var(--ink)]">{m.content}</p>
                    </div>
                  ))
              )}
            </div>
          </section>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DeepLinkCard
              to="/bilgi-merkezi"
              title="Knowledge / RAG"
              desc="Şirket belgeleri önce okunur."
            />
            <DeepLinkCard
              to="/belge-merkezi"
              title="Document Platform"
              desc="Teklif, fatura, PDF."
            />
            <DeepLinkCard to="/analitik?tab=ai" title="AI Analytics" desc="Dashboard içgörüleri." />
          </div>
        </>
      )}

      {tab === 'organization' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Enterprise Organization</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Dijital işgücü katmanı — CEO / C-Suite / Directors. Peer chat yok; Orchestrator +
            Explainable AI.
          </p>
          <Link
            to="/ai-organizasyon"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
          >
            Organizasyon şemasını aç →
          </Link>
        </section>
      )}

      {tab === 'autonomous' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Autonomous Company</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Self-driving Control Tower — izleme, risk, öneri, simülasyon, sabah/akşam rapor.
          </p>
          <Link
            to="/ai-otonom"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
          >
            Control Tower’ı aç →
          </Link>
        </section>
      )}

      {tab === 'app-builder' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI App Builder</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Low-code NL → modül / form / workflow iskeleti · Plugin publish.
          </p>
          <Link
            to="/ai-uygulama"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
          >
            App Center’ı aç →
          </Link>
        </section>
      )}

      {tab === 'agents' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Agents ({agents.length})</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">{a.name}</p>
                  <p className="text-[10px] uppercase text-[var(--muted)]">{a.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    toggleAgentLocal(a.id)
                    setTick((n) => n + 1)
                    flash(a.enabled ? 'Ajan pasif' : 'Ajan aktif')
                  }}
                  className={`rounded-lg border px-2 py-1 text-[10px] font-black uppercase ${
                    a.enabled ? 'text-emerald-700' : 'text-[var(--muted)]'
                  }`}
                >
                  {a.enabled ? 'ON' : 'OFF'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'orchestrator' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Agent Orchestrator</h2>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Çok ajanlı zincirler — gerçek runtime AIOS-1+.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {ORCHESTRATOR_CHAINS.map((c) => (
              <div key={c.id} className="rounded-xl border p-3">
                <p className="text-sm font-black text-[var(--ink)]">{c.name}</p>
                <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs text-[var(--muted)]">
                  {c.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'memory' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-black uppercase">AI Memory</h2>
            <button
              type="button"
              onClick={() => {
                clearMemoryLocal()
                setTick((n) => n + 1)
                flash('Memory temizlendi')
              }}
              className="rounded-xl border px-3 py-2 text-[10px] font-black uppercase"
            >
              Temizle
            </button>
          </div>
          <ul className="mt-3 space-y-2">
            {memory.map((m) => (
              <li key={m.id} className="rounded-xl border px-3 py-2 text-xs">
                <span className="font-black uppercase text-[var(--muted)]">
                  {m.scope} · {m.key}
                </span>
                <p className="mt-1 text-[var(--ink)]">{m.value}</p>
              </li>
            ))}
            {memory.length === 0 ? <p className="text-xs text-[var(--muted)]">Kayıt yok.</p> : null}
          </ul>
        </section>
      )}

      {tab === 'knowledge' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DeepLinkCard
            to="/bilgi-merkezi"
            title="Knowledge Center"
            desc="RAG · PDF · Excel · prosedürler."
          />
          <DeepLinkCard
            to="/bilgi-merkezi?tab=rag"
            title="RAG Engine"
            desc="Önce şirket bilgisi, sonra cevap."
          />
        </div>
      )}

      {tab === 'prompts' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Prompt Studio</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {prompts.map((p) => (
              <li key={p.id} className="rounded-xl border p-3">
                <p className="text-[10px] font-black uppercase text-[var(--muted)]">{p.domain}</p>
                <p className="mt-1 text-sm font-bold text-[var(--ink)]">{p.title}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">{p.body}</p>
                <button
                  type="button"
                  className="mt-2 text-[10px] font-black uppercase text-emerald-700"
                  onClick={() => {
                    setTab('home')
                    setPrompt(p.body)
                    flash('Prompt AI Home’a taşındı')
                  }}
                >
                  Kullan
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'automation' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DeepLinkCard
            to="/otomasyon"
            title="Workflow Engine"
            desc="AI tetikleyici · karar · öneri."
          />
          <DeepLinkCard
            to="/platform?tab=automation"
            title="Platform Automation"
            desc="Job / queue / scheduler."
          />
        </div>
      )}

      {tab === 'tasks' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Tasks</h2>
          <ul className="mt-3 space-y-2">
            {tasks.map((t) => (
              <li key={t.id} className="flex justify-between rounded-xl border px-3 py-2 text-xs">
                <span className="font-bold text-[var(--ink)]">{t.title}</span>
                <span className="uppercase text-[var(--muted)]">{t.status}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/gorevler"
            className="mt-3 inline-block text-xs font-black uppercase text-emerald-700"
          >
            Görevler SoT →
          </Link>
        </section>
      )}

      {tab === 'documents' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DeepLinkCard
            to="/belge-merkezi"
            title="Document Platform"
            desc="Invoice · packing · teklif · sözleşme."
          />
          <DeepLinkCard
            to="/belge-merkezi?tab=ai-designer"
            title="AI Designer"
            desc="Belge AI tasarımcısı."
          />
        </div>
      )}

      {tab === 'analytics' && (
        <DeepLinkCard
          to="/analitik?tab=ai"
          title="AI Analytics"
          desc="Dashboard okuma · risk · açıklama."
        />
      )}

      {tab === 'forecast' && (
        <DeepLinkCard
          to="/analitik?tab=forecast"
          title="AI Forecast"
          desc="Satış · üretim · nakit · kapasite."
        />
      )}

      {tab === 'vision' && (
        <DeepLinkCard
          to="/ai-buyume/gorsel"
          title="AI Vision"
          desc="Görsel stüdyo · OCR / kalite AIOS-4."
        />
      )}

      {tab === 'voice' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase">AI Voice</h2>
          </div>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Sesle ERP — header asistanı ve /api/voice/* (Growth/Voice SoT). Gateway birleştirmesi
            AIOS-3.
          </p>
        </section>
      )}

      {tab === 'translate' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Translation</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            TR · EN · DE · FR · ES · IT · AR — anlık çeviri AIOS-4; WF `ai.translate` node mevcut.
          </p>
          <Link
            to="/otomasyon"
            className="mt-3 inline-block text-xs font-black uppercase text-emerald-700"
          >
            Workflow çeviri node →
          </Link>
        </section>
      )}

      {tab === 'models' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Model Center</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDERS_SEED.map((p) => (
              <li key={p.id} className="rounded-xl border p-3">
                <p className="text-sm font-black text-[var(--ink)]">{p.label}</p>
                <p className="mt-1 text-[10px] uppercase text-[var(--muted)]">
                  {p.configured ? 'Yapılandırılmış / hazır' : 'Stub · anahtar bekleniyor'}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">{p.models.join(', ')}</p>
              </li>
            ))}
          </ul>
          <Link
            to="/ayarlar/ai/openai"
            className="mt-3 inline-block text-xs font-black uppercase text-emerald-700"
          >
            OpenAI ayarları →
          </Link>
        </section>
      )}

      {tab === 'usage' && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Token in" value={usage.tokensIn} />
          <Kpi label="Token out" value={usage.tokensOut} />
          <Kpi label="Cost USD" value={usage.costUsd} />
          <Kpi label="Runs" value={usage.runs} />
        </div>
      )}

      {tab === 'permissions' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <div className="flex items-center gap-2 text-amber-700">
            <ShieldAlert className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase">AI Permissions</h2>
          </div>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--muted)]">
            <li>AI izinsiz silme / ödeme / fatura / stok mutasyonu yapamaz.</li>
            <li>RBAC · ABAC · field/row security domain API üzerinden uygulanır.</li>
            <li>Yetkisiz veri gateway yanıtına eklenmez.</li>
            <li>Riskli tool → Human Approval kuyruğu.</li>
          </ul>
        </section>
      )}

      {tab === 'approvals' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">Human Approval</h2>
          <ul className="mt-3 space-y-2">
            {approvals.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2"
              >
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">{a.label}</p>
                  <p className="text-[10px] uppercase text-[var(--muted)]">
                    {a.toolId} · {a.status} · {a.risk}
                  </p>
                </div>
                {a.status === 'pending' ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded-lg border px-2 py-1 text-[10px] font-black uppercase text-emerald-700"
                      onClick={() => {
                        decideApprovalLocal(a.id, 'approve')
                        setTick((n) => n + 1)
                        flash('Onaylandı')
                      }}
                    >
                      Onayla
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border px-2 py-1 text-[10px] font-black uppercase text-rose-600"
                      onClick={() => {
                        decideApprovalLocal(a.id, 'reject')
                        setTick((n) => n + 1)
                        flash('Reddedildi')
                      }}
                    >
                      Reddet
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === 'audit' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Monitoring / Audit</h2>
          <ul className="mt-3 space-y-2">
            {runs.length === 0 ? (
              <p className="text-xs text-[var(--muted)]">Henüz run yok — chat gönderin.</p>
            ) : (
              runs.map((r) => (
                <li key={r.id} className="rounded-xl border px-3 py-2 text-xs">
                  <span className="font-black text-[var(--ink)]">{r.agentId}</span>
                  <span className="ml-2 text-[var(--muted)]">
                    {r.provider}/{r.model} · {r.tokens} tok · ${r.costUsd}
                    {r.stub ? ' · stub' : ''}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      )}

      {tab === 'marketplace' && (
        <section className={`${APP_SURFACE_PANEL_CLASS} p-4`}>
          <h2 className="text-sm font-black uppercase">AI Marketplace</h2>
          <p className="mt-2 text-xs text-[var(--muted)]">
            Hazır ajan paketleri · prompt paketleri · sektör paketleri — merkezi hub.
          </p>
          <Link
            to="/marketplace?tab=agents"
            className="mt-3 inline-flex min-h-11 items-center rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 text-xs font-black uppercase text-emerald-800"
          >
            BachMain Marketplace →
          </Link>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {['Sales Pack', 'MES Pack', 'Commerce Pack'].map((pack) => (
              <div key={pack} className="rounded-xl border p-3 text-sm font-bold text-[var(--ink)]">
                {pack}
              </div>
            ))}
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <DeepLinkCard to="/ayarlar/ai" title="AI Settings" desc="Şirket AI ayarları." />
          <DeepLinkCard to="/ayarlar/ai/openai" title="OpenAI" desc="Sunucu anahtarı · model." />
          <DeepLinkCard
            to="/platform?tab=ai"
            title="Platform AI Gateway"
            desc="Çekirdek bağlantı."
          />
          <DeepLinkCard to="/hesap/lisans" title="License / Limits" desc="AI kullanım limitleri." />
        </div>
      )}
    </AppPageShell>
  )
}
