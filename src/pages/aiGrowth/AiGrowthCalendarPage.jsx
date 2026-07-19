import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import { readAiGrowthCalendar, saveAiGrowthCalendarPost } from '../../utils/aiGrowthSettings'

export default function AiGrowthCalendarPage() {
  const [posts, setPosts] = useState(() => readAiGrowthCalendar().posts || [])
  const [draft, setDraft] = useState({
    title: '',
    platform: 'Instagram',
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    status: 'planned',
  })

  const grouped = useMemo(() => {
    const map = {}
    for (const post of posts) {
      const key = post.date || 'plansız'
      if (!map[key]) map[key] = []
      map[key].push(post)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [posts])

  function addPost(event) {
    event.preventDefault()
    const saved = saveAiGrowthCalendarPost(draft)
    setPosts(readAiGrowthCalendar().posts || [])
    setDraft((c) => ({ ...c, title: '' }))
    return saved
  }

  function updateStatus(id, status) {
    const current = posts.find((p) => p.id === id)
    if (!current) return
    saveAiGrowthCalendarPost({ ...current, status })
    setPosts(readAiGrowthCalendar().posts || [])
  }

  function onDragStart(event, id) {
    event.dataTransfer.setData('text/post-id', id)
  }

  function onDrop(event, date) {
    event.preventDefault()
    const id = event.dataTransfer.getData('text/post-id')
    const current = posts.find((p) => p.id === id)
    if (!current) return
    saveAiGrowthCalendarPost({ ...current, date })
    setPosts(readAiGrowthCalendar().posts || [])
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Sosyal Medya Takvimi"
        backTo="/ai-buyume"
        actions={(
          <Link to="/ai-buyume/sosyal/studio" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>İçerik paketi üret</Link>
        )}
      />
      <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
        <AppPagePanel title="Yeni plan">
          <form onSubmit={addPost} className="space-y-3">
            <input className="form-input" placeholder="Gönderi başlığı" value={draft.title} onChange={(e) => setDraft((c) => ({ ...c, title: e.target.value }))} required />
            <select className="form-input" value={draft.platform} onChange={(e) => setDraft((c) => ({ ...c, platform: e.target.value }))}>
              {['Instagram', 'LinkedIn', 'Facebook', 'X', 'TikTok'].map((p) => <option key={p}>{p}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input type="date" className="form-input" value={draft.date} onChange={(e) => setDraft((c) => ({ ...c, date: e.target.value }))} />
              <input type="time" className="form-input" value={draft.time} onChange={(e) => setDraft((c) => ({ ...c, time: e.target.value }))} />
            </div>
            <button type="submit" className={`${BTN_PRIMARY} gap-2 px-4 text-xs`}>
              <Plus className="h-4 w-4" /> Planla
            </button>
          </form>
        </AppPagePanel>

        <AppPagePanel title="Takvim">
          <div className="space-y-4">
            {grouped.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Henüz plan yok. Sürükle-bırak için önce gönderi ekleyin.</p>
            ) : grouped.map(([date, rows]) => (
              <div
                key={date}
                className="rounded-2xl border border-dashed border-dark-500/50 p-3"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, date)}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--muted)]">{date}</p>
                <div className="space-y-2">
                  {rows.map((post) => (
                    <div
                      key={post.id}
                      draggable
                      onDragStart={(e) => onDragStart(e, post.id)}
                      className="flex items-center justify-between gap-3 rounded-xl bg-dark-800/50 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-semibold">{post.title}</p>
                        <p className="text-[11px] text-[var(--muted)]">{post.platform} · {post.time}</p>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" className={`${BTN_SUCCESS} !h-8 !min-h-8 px-2 text-[10px]`} onClick={() => updateStatus(post.id, 'approved')}>Onayla</button>
                        <button type="button" className="btn-ghost !px-2 !py-1 text-[10px]" onClick={() => updateStatus(post.id, 'done')}>Yayınlandı</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
