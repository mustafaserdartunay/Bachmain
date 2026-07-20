import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { GitBranch, Play, Plus, Sparkles, Workflow } from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'
import { WORKFLOW_TEMPLATES } from '../workflow/catalog'
import { createWorkflowFromPrompt } from '../workflow/aiAssistant'
import { createLocalWorkflow, listLocalWorkflows } from '../workflow/localStore'
import { publishDomainEvent } from '../workflow/eventBus'

const SAMPLE_RULES = [
  { id: 'r1', when: 'Stok < 100', then: 'Satın Alma Talebi Aç', event: 'trigger.stock.low' },
  {
    id: 'r2',
    when: 'Teslim tarihi geçti',
    then: 'Kırmızı Uyarı',
    event: 'trigger.delivery.completed',
  },
  {
    id: 'r3',
    when: 'Paket süresi 7 gün',
    then: 'Mail + WhatsApp + Bildirim',
    event: 'trigger.package.expiring',
  },
]

export default function WorkflowHubPage() {
  const [rows, setRows] = useState(() => listLocalWorkflows())
  const [prompt, setPrompt] = useState('')
  const [assistantMsg, setAssistantMsg] = useState('')

  useEffect(() => {
    function refresh() {
      setRows(listLocalWorkflows())
    }
    window.addEventListener('bach:workflows-updated', refresh)
    return () => window.removeEventListener('bach:workflows-updated', refresh)
  }, [])

  const domains = useMemo(() => [...new Set(WORKFLOW_TEMPLATES.map((t) => t.domain))], [])

  function handleNew() {
    const row = createLocalWorkflow({ name: 'Yeni Workflow' })
    window.location.href = `/otomasyon/designer/${row.id}`
  }

  function handleAi() {
    if (!prompt.trim()) return
    const { workflow, template, confidence } = createWorkflowFromPrompt(prompt.trim())
    setAssistantMsg(
      `"${template.name}" şablonu seçildi (%${Math.round(confidence * 100)}). Designer açılıyor…`,
    )
    setTimeout(() => {
      window.location.href = `/otomasyon/designer/${workflow.id}`
    }, 600)
  }

  function fireSample(eventType) {
    const result = publishDomainEvent(eventType, { sample: true, at: new Date().toISOString() })
    setAssistantMsg(
      `Event: ${eventType} → ${result.matchedWorkflowIds.length} yayınlı workflow eşleşti`,
    )
  }

  return (
    <div className="w-full space-y-5 pb-8">
      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-blue-300">
              <Workflow className="h-5 w-5" />
              <h1 className="text-xl font-black uppercase tracking-wide">Workflow Engine</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Kod yazmadan süreç tasarlayın. Modüller Event Bus üzerinden konuşur; mevcut
              teklif/sipariş stage panelleri bozulmaz.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleNew}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-200"
            >
              <Plus className="h-4 w-4" />
              Yeni Workflow
            </button>
            <Link
              to="/otomasyon/designer"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2 text-xs font-black uppercase tracking-wide text-gray-200"
            >
              <GitBranch className="h-4 w-4" />
              Designer
            </Link>
          </div>
        </div>
      </section>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex items-center gap-2 text-violet-300">
          <Sparkles className="h-4 w-4" />
          <h2 className="text-sm font-black uppercase tracking-wide">AI Workflow Assistant</h2>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Örn: &quot;Almanya siparişleri için süreç oluştur.&quot;
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAi()
            }}
            placeholder="Süreci doğal dilde yazın…"
            className="min-w-0 flex-1 rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-400/40"
          />
          <button
            type="button"
            onClick={handleAi}
            className="rounded-xl border border-violet-500/40 bg-violet-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-violet-200"
          >
            Oluştur
          </button>
        </div>
        {assistantMsg ? (
          <p className="mt-2 text-xs font-semibold text-blue-300">{assistantMsg}</p>
        ) : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-300">
            Workflow&apos;larım
          </h2>
          <ul className="mt-3 space-y-2">
            {rows.length === 0 ? (
              <li className="text-xs text-gray-500">
                Henüz workflow yok. Şablon veya Designer ile başlayın.
              </li>
            ) : (
              rows.map((w) => (
                <li key={w.id}>
                  <Link
                    to={`/otomasyon/designer/${w.id}`}
                    className="flex items-center justify-between rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2.5 transition-colors hover:bg-dark-700/60"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{w.name}</div>
                      <div className="text-[11px] text-gray-500">
                        {w.status} · v{w.currentVersion}
                        {w.publishedVersion ? ` · yayında v${w.publishedVersion}` : ''}
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-300">Aç</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </section>

        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <h2 className="text-sm font-black uppercase tracking-wide text-gray-300">
            Business Rules (stub)
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            Kod yazmadan kural → event. WF-3&apos;te grafa derlenecek.
          </p>
          <ul className="mt-3 space-y-2">
            {SAMPLE_RULES.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-dark-500/40 bg-dark-800/50 px-3 py-2.5"
              >
                <div>
                  <div className="text-xs font-bold text-amber-200">{r.when}</div>
                  <div className="text-[11px] text-gray-400">→ {r.then}</div>
                </div>
                <button
                  type="button"
                  onClick={() => fireSample(r.event)}
                  className="inline-flex items-center gap-1 rounded-lg border border-dark-500/50 px-2 py-1 text-[10px] font-bold text-gray-300 hover:bg-dark-700"
                >
                  <Play className="h-3 w-3" />
                  Event
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-300">
          Template Library
        </h2>
        <div className="mt-2 flex flex-wrap gap-2">
          {domains.map((d) => (
            <span
              key={d}
              className="rounded-md bg-dark-700/80 px-2 py-0.5 text-[10px] font-bold text-gray-400"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {WORKFLOW_TEMPLATES.map((tpl) => (
            <Link
              key={tpl.id}
              to={`/otomasyon/designer?template=${tpl.id}`}
              className="rounded-xl border border-dark-500/40 bg-dark-800/40 p-4 transition-colors hover:border-blue-400/30 hover:bg-dark-700/50"
            >
              <div className="text-[10px] font-black uppercase tracking-wide text-blue-300/80">
                {tpl.domain}
              </div>
              <div className="mt-1 text-sm font-bold text-white">{tpl.name}</div>
              <p className="mt-1 text-[11px] text-gray-500">{tpl.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
