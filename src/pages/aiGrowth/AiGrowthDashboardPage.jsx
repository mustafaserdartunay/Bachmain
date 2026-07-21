import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clapperboard, Instagram, PlugZap, Sparkles } from 'lucide-react'
import { AppPageHeader, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import {
  INSTAGRAM_UPDATED_EVENT,
  listReelDrafts,
  readInstagramConnection,
} from '../../growth/instagramStore'

export default function AiGrowthDashboardPage() {
  const [conn, setConn] = useState(() => readInstagramConnection())
  const [draftCount, setDraftCount] = useState(() => listReelDrafts().length)

  useEffect(() => {
    const sync = () => {
      setConn(readInstagramConnection())
      setDraftCount(listReelDrafts().length)
    }
    window.addEventListener(INSTAGRAM_UPDATED_EVENT, sync)
    return () => window.removeEventListener(INSTAGRAM_UPDATED_EVENT, sync)
  }, [])

  return (
    <AppPageShell>
      <AppPageHeader
        title="AI Growth · Instagram"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/ai-buyume/instagram" className="btn-ghost !px-3 !py-2 text-xs font-bold">
              Hesap
            </Link>
            <Link to="/ai-buyume/reel" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
              <Clapperboard className="h-4 w-4" /> Reel örneği
            </Link>
          </div>
        }
      />

      <div className="relative overflow-hidden rounded-[28px] border border-[var(--border)] bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 px-6 py-10 text-white sm:px-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="relative max-w-xl">
          <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-200/80">
            <Instagram className="h-4 w-4" /> Instagram only
          </p>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Bağla · Reel üret · Örneği gör
          </h2>
          <p className="mt-3 text-sm text-white/70">
            AI Growth Center şimdilik yalnızca Instagram bağlantısı ve reel oluşturma örneği
            sunuyor. Diğer kanallar arşivde; istenince geri açılır.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {conn.connected ? (
              <Link to="/ai-buyume/reel" className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}>
                <Sparkles className="h-4 w-4" /> Reel örneğini aç
              </Link>
            ) : (
              <Link to="/ai-buyume/instagram" className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}>
                <PlugZap className="h-4 w-4" /> Instagram bağla
              </Link>
            )}
            <Link
              to="/ai-buyume/reel"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-4 py-2 text-xs font-bold text-white"
            >
              <Clapperboard className="h-4 w-4" /> Örnek akışa bak
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs font-semibold text-[var(--muted)]">Hesap</p>
          <p className="mt-2 text-lg font-bold text-[var(--ink)]">
            {conn.connected ? `@${conn.username}` : 'Bağlı değil'}
          </p>
          <Link to="/ai-buyume/instagram" className="mt-3 inline-block text-xs font-bold underline">
            {conn.connected ? 'Yönet' : 'Bağla'}
          </Link>
        </div>
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs font-semibold text-[var(--muted)]">Reel örnekleri</p>
          <p className="mt-2 text-lg font-bold text-[var(--ink)]">{draftCount}</p>
          <Link to="/ai-buyume/reel" className="mt-3 inline-block text-xs font-bold underline">
            Yeni örnek
          </Link>
        </div>
        <div className="glass-inset rounded-[22px] p-5">
          <p className="text-xs font-semibold text-[var(--muted)]">Mod</p>
          <p className="mt-2 text-lg font-bold text-[var(--ink)]">Demo yayın</p>
          <p className="mt-3 text-xs text-[var(--muted)]">Meta Graph API sonraki aşama</p>
        </div>
      </div>
    </AppPageShell>
  )
}
