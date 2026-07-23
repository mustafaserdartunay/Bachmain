import { useState } from 'react'
import { Bot, Loader2, Network, Sparkles } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_SUCCESS } from '../../utils/buttonStyles'
import { runAiGrowthGenerate } from '../../utils/aiGrowthApi'

const AGENTS = [
  { id: 'seo', name: 'SEO Agent', role: 'Teknik SEO ve içerik otoritesi' },
  { id: 'marketing', name: 'Marketing Agent', role: 'Kampanya stratejisi' },
  { id: 'copywriter', name: 'Copywriter Agent', role: 'Satış copywriting' },
  { id: 'designer', name: 'Designer Agent', role: 'Kreatif brief' },
  { id: 'sales', name: 'Sales Agent', role: 'Satış konuşma akışı' },
  { id: 'email', name: 'Email Agent', role: 'Lifecycle e-posta' },
  { id: 'social', name: 'Social Media Agent', role: 'Sosyal plan' },
  { id: 'success', name: 'Customer Success Agent', role: 'Retansiyon & NPS' },
]

export default function AiGrowthAgentsPage() {
  const [brief, setBrief] = useState('Q3 büyüme kampanyası için kanal planı')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')

  async function runCouncil() {
    setLoading(true)
    setError('')
    try {
      const data = await runAiGrowthGenerate({
        feature: 'agent_council',
        userPrompt: `Aşağıdaki ajanlar koordineli çalışsın ve tek bir yürütme planı üretsin:
${AGENTS.map((a) => `- ${a.name}: ${a.role}`).join('\n')}

Brief: ${brief}

Çıktı formatı:
1) Ortak hedef
2) Her ajanın görevi (madde)
3) Zaman çizelgesi (7/14/30 gün)
4) Riskler
5) KPI'lar`,
      })
      setOutput(data.content || '')
    } catch (err) {
      setError(err.message || 'Ajan çalıştırması başarısız')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader title="AI Ajanları" backTo="/ai-buyume" backLabel="AI Büyüme" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {AGENTS.map((agent) => (
          <div key={agent.id} className="glass-inset rounded-2xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Bot className="h-4 w-4 text-blue-400" />
              <p className="text-sm font-semibold">{agent.name}</p>
            </div>
            <p className="text-xs text-[var(--muted)]">{agent.role}</p>
          </div>
        ))}
      </div>

      <AppPagePanel title="Koordineli çalışma">
        <div className="space-y-3">
          <textarea
            className="form-input min-h-24"
            value={brief}
            onChange={(e) => setBrief(e.target.value)}
          />
          <button
            type="button"
            disabled={loading}
            onClick={runCouncil}
            className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Network className="h-4 w-4" />
            )}
            Ajan konseyini çalıştır
          </button>
          {error ? <p className="text-xs text-rose-300">{error}</p> : null}
          <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-dark-500/40 bg-dark-800/40 p-4 text-sm">
            {output || 'Ajan çıktısı burada.'}
          </pre>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}

export function AiGrowthAssistantPage() {
  const [message, setMessage] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)

  async function send() {
    if (!message.trim()) return
    const userMsg = message.trim()
    setMessage('')
    setHistory((h) => [...h, { role: 'user', content: userMsg }])
    setLoading(true)
    try {
      const data = await runAiGrowthGenerate({
        feature: 'ai_assistant',
        userPrompt: userMsg,
      })
      setHistory((h) => [...h, { role: 'assistant', content: data.content || '' }])
    } catch (err) {
      setHistory((h) => [...h, { role: 'assistant', content: err.message || 'Hata' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppPageShell>
      <AppPageHeader title="AI Asistan" backTo="/ai-buyume" backLabel="AI Büyüme" />
      <AppPagePanel title="Sohbet">
        <div className="mb-3 max-h-[26rem] space-y-2 overflow-auto">
          {history.map((row, idx) => (
            <div
              key={`${row.role}-${idx}`}
              className={`rounded-xl px-3 py-2 text-sm ${row.role === 'user' ? 'bg-blue-500/15' : 'bg-dark-800/50'}`}
            >
              <p className="mb-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                {row.role === 'user' ? 'Siz' : 'Asistan'}
              </p>
              <pre className="whitespace-pre-wrap font-sans">{row.content}</pre>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            className="form-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Büyüme asistanına sorun…"
            onKeyDown={(e) => {
              if (e.key === 'Enter') send()
            }}
          />
          <button
            type="button"
            disabled={loading}
            onClick={send}
            className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Gönder
          </button>
        </div>
      </AppPagePanel>
    </AppPageShell>
  )
}
