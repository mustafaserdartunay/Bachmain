import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY } from '../../utils/buttonStyles'
import {
  deleteAiGrowthAutomation,
  readAiGrowthAutomations,
  saveAiGrowthAutomation,
} from '../../utils/aiGrowthSettings'
import { publishDomainEvent } from '../../workflow/eventBus'

export default function AiGrowthAutomationPage() {
  const [rules, setRules] = useState(() => readAiGrowthAutomations().rules || [])
  const [draft, setDraft] = useState({
    title: 'Her Pazartesi Instagram paylaş',
    cadence: 'Her Pazartesi',
    time: '09:00',
    action: 'Instagram paylaş',
  })

  function addRule(event) {
    event.preventDefault()
    saveAiGrowthAutomation(draft)
    setRules(readAiGrowthAutomations().rules || [])
    publishDomainEvent(
      'trigger.growth.content.published',
      { automation: draft.title, action: draft.action },
      { source: 'growth' },
    )
  }

  function removeRule(id) {
    deleteAiGrowthAutomation(id)
    setRules(readAiGrowthAutomations().rules || [])
  }

  return (
    <AppPageShell>
      <AppPageHeader title="Otomasyon" backTo="/ai-buyume" backLabel="AI Büyüme" />
      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Kural ekle">
          <form onSubmit={addRule} className="space-y-3">
            <input
              className="form-input"
              value={draft.title}
              onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))}
            />
            <select
              className="form-input"
              value={draft.cadence}
              onChange={(e) => setDraft((c) => ({ ...c, cadence: e.target.value }))}
            >
              {['Her gün', 'Her Pazartesi', 'Her Cuma', 'Her ay'].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
            <input
              type="time"
              className="form-input"
              value={draft.time}
              onChange={(e) => setDraft((c) => ({ ...c, time: e.target.value }))}
            />
            <select
              className="form-input"
              value={draft.action}
              onChange={(e) => setDraft((c) => ({ ...c, action: e.target.value }))}
            >
              {['Instagram paylaş', 'Blog yaz', 'LinkedIn paylaş', 'Newsletter hazırla'].map(
                (o) => (
                  <option key={o}>{o}</option>
                ),
              )}
            </select>
            <button type="submit" className={`${BTN_PRIMARY} gap-2 px-4 text-xs`}>
              <Plus className="h-4 w-4" /> Kuralı kaydet
            </button>
          </form>
        </AppPagePanel>
        <AppPagePanel title="Aktif kurallar">
          <div className="space-y-2">
            {rules.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Henüz kural yok.</p>
            ) : null}
            {rules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between rounded-xl border border-dark-500/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-semibold">{rule.title}</p>
                  <p className="text-[11px] text-[var(--muted)]">
                    {rule.cadence} · {rule.time} · {rule.action}
                  </p>
                </div>
                <button type="button" onClick={() => removeRule(rule.id)} className="text-rose-300">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
