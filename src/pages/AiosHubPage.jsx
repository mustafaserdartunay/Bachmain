import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bot, ShieldAlert, Sparkles, Wrench, Workflow } from 'lucide-react'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

const AGENTS = [
  'AI CEO',
  'AI Operasyon Direktörü',
  'AI Satış Müdürü',
  'AI CRM Uzmanı',
  'AI Üretim Planlama Uzmanı',
  'AI Kalite Uzmanı',
  'AI Depo Uzmanı',
  'AI Lojistik Planlama Uzmanı',
  'AI Satın Alma Uzmanı',
  'AI Muhasebe Uzmanı',
  'AI Finans Analisti',
  'AI İnsan Kaynakları Uzmanı',
  'AI Pazarlama Müdürü',
  'AI SEO Uzmanı',
  'AI Sosyal Medya Uzmanı',
  'AI Reklam Uzmanı',
  'AI Tasarım Asistanı',
  'AI Belge Asistanı',
  'AI Raporlama Uzmanı',
  'AI Destek Uzmanı',
  'AI Veri Analisti',
  'AI Çeviri Uzmanı',
  'AI Müşteri İletişim Uzmanı',
]

const APPROVAL_TOOLS = [
  'Sipariş iptali',
  'Fatura iptali',
  'Toplu fiyat güncelleme',
  'Stok silme',
  'Kullanıcı silme',
  'Paket değiştirme',
  'Yetki yükseltme',
  'Toplu veri aktarımı',
]

export default function AiosHubPage() {
  const [prompt, setPrompt] = useState('')
  const [reply, setReply] = useState('')

  const agentPreview = useMemo(() => AGENTS.slice(0, 8), [])

  function handleAsk() {
    if (!prompt.trim()) return
    setReply(
      'AIOS-0: İstek gateway üzerinden işlenecek (Browser → API → AI Gateway). ' +
        'Canlı model çağrısı için oturumlu /v1/aios/gateway/chat kullanılır. ' +
        `Özet: "${prompt.trim().slice(0, 120)}"`,
    )
  }

  return (
    <div className="w-full space-y-5 pb-8">
      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-300">
              <Sparkles className="h-5 w-5" />
              <h1 className="text-xl font-black uppercase tracking-wide">AI Operating System</h1>
            </div>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Çok ajanlı, yetkilendirilmiş çalışma katmanı. Sohbet botu değil — analiz, öneri, plan,
              otomasyon ve insan onaylı işlemler. Frontend modele doğrudan bağlanmaz.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/otomasyon"
              className="inline-flex items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 py-2 text-xs font-black uppercase tracking-wide text-blue-200"
            >
              <Workflow className="h-4 w-4" />
              Workflow Engine
            </Link>
          </div>
        </div>
      </section>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <h2 className="text-sm font-black uppercase tracking-wide text-gray-300">
          Hızlı soru (gateway yolu)
        </h2>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk()
            }}
            placeholder="Örn: Bu haftanın satış özetini çıkar"
            className="min-w-0 flex-1 rounded-xl border border-dark-500/50 bg-dark-800 px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-400/40"
          />
          <button
            type="button"
            onClick={handleAsk}
            className="rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-emerald-200"
          >
            Gönder
          </button>
        </div>
        {reply ? <p className="mt-2 text-xs font-semibold text-blue-300">{reply}</p> : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <div className="flex items-center gap-2 text-gray-300">
            <Bot className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase tracking-wide">Agent Manager</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {AGENTS.length} standart ajan · kayıt genişletilebilir
          </p>
          <ul className="mt-3 space-y-1.5">
            {agentPreview.map((name) => (
              <li
                key={name}
                className="rounded-lg border border-dark-500/40 bg-dark-800/50 px-3 py-2 text-sm font-semibold text-white"
              >
                {name}
              </li>
            ))}
            <li className="text-xs text-gray-500">+ {AGENTS.length - agentPreview.length} daha…</li>
          </ul>
        </section>

        <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
          <div className="flex items-center gap-2 text-amber-300">
            <ShieldAlert className="h-4 w-4" />
            <h2 className="text-sm font-black uppercase tracking-wide">Human Approval</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">Varsayılan insan onayı gerektiren işlemler</p>
          <ul className="mt-3 space-y-1.5">
            {APPROVAL_TOOLS.map((t) => (
              <li
                key={t}
                className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs font-semibold text-amber-100"
              >
                {t}
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className={`${APP_SURFACE_PANEL_CLASS} p-5`}>
        <div className="flex items-center gap-2 text-gray-300">
          <Wrench className="h-4 w-4" />
          <h2 className="text-sm font-black uppercase tracking-wide">Kurallar</h2>
        </div>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-gray-400">
          <li>AI doğrudan veritabanına yazmaz — Tools + yetki + audit.</li>
          <li>Şifre, API anahtarı, kart, IBAN, JWT ve secret’lar maskelenir / modele gitmez.</li>
          <li>Yeni agent eklemek çekirdek kodu değiştirmeden katalog kaydı ile yapılır.</li>
          <li>Platform paneli: Yönetim → AI Control Center (`/ai-yonetimi`).</li>
        </ul>
      </section>
    </div>
  )
}
