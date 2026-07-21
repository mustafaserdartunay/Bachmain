import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Instagram, Link2Off, PlugZap } from 'lucide-react'
import { AppPageHeader, AppPagePanel, AppPageShell } from '../../components/Layout/AppPageLayout'
import { BTN_PRIMARY, BTN_SUCCESS } from '../../utils/buttonStyles'
import {
  INSTAGRAM_UPDATED_EVENT,
  connectInstagramDemo,
  disconnectInstagram,
  readInstagramConnection,
} from '../../growth/instagramStore'

export default function AiGrowthInstagramConnectPage() {
  const [conn, setConn] = useState(() => readInstagramConnection())
  const [username, setUsername] = useState(conn.username || '')
  const [displayName, setDisplayName] = useState(conn.displayName || '')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const sync = () => setConn(readInstagramConnection())
    window.addEventListener(INSTAGRAM_UPDATED_EVENT, sync)
    return () => window.removeEventListener(INSTAGRAM_UPDATED_EVENT, sync)
  }, [])

  function handleConnect(e) {
    e.preventDefault()
    setError('')
    try {
      const next = connectInstagramDemo({ username, displayName })
      setConn(next)
      setMessage(`@${next.username} bağlandı (demo).`)
    } catch (err) {
      setError(err.message || 'Bağlantı başarısız')
    }
  }

  function handleDisconnect() {
    setConn(disconnectInstagram())
    setUsername('')
    setDisplayName('')
    setMessage('Bağlantı kaldırıldı.')
  }

  return (
    <AppPageShell>
      <AppPageHeader
        title="Instagram Bağlantısı"
        backTo="/ai-buyume"
        backLabel="AI Growth"
        actions={
          <Link to="/ai-buyume/reel" className={`${BTN_PRIMARY} gap-2 px-3 text-xs`}>
            Reel örneğine geç
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <AppPagePanel title="Hesap bağla">
          <p className="mb-4 text-sm text-[var(--muted)]">
            Şimdilik demo bağlantı: kullanıcı adını kaydediyoruz. Gerçek Meta OAuth / Graph API
            yayını sonraki adımda eklenecek; akış aynı kalacak.
          </p>
          {conn.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3">
                <Instagram className="h-5 w-5 text-emerald-700" />
                <div>
                  <p className="text-sm font-semibold text-[var(--ink)]">@{conn.username}</p>
                  <p className="text-xs text-[var(--muted)]">
                    {conn.displayName} · bağlandı{' '}
                    {conn.connectedAt ? new Date(conn.connectedAt).toLocaleString('tr-TR') : '—'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="btn-ghost inline-flex items-center gap-2 !px-3 !py-2 text-xs font-bold"
              >
                <Link2Off className="h-4 w-4" /> Bağlantıyı kes
              </button>
            </div>
          ) : (
            <form onSubmit={handleConnect} className="space-y-3">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--muted)]">
                  Instagram kullanıcı adı
                </span>
                <input
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ornekmarka"
                  required
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-[var(--muted)]">Görünen ad</span>
                <input
                  className="form-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Örnek Marka"
                />
              </label>
              {error ? <p className="text-xs text-rose-400">{error}</p> : null}
              <button type="submit" className={`${BTN_SUCCESS} gap-2 px-4 text-xs`}>
                <PlugZap className="h-4 w-4" /> Instagram&apos;ı bağla (demo)
              </button>
            </form>
          )}
          {message ? (
            <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> {message}
            </p>
          ) : null}
        </AppPagePanel>

        <AppPagePanel title="Nasıl çalışır?">
          <ol className="list-decimal space-y-3 pl-5 text-sm text-[var(--ink)]">
            <li>Hesabı bağla (demo kullanıcı adı yeterli).</li>
            <li>
              <Link to="/ai-buyume/reel" className="font-semibold underline">
                Reel Örneği
              </Link>
              &apos;nde konu gir → senaryo + caption üret.
            </li>
            <li>Telefon önizlemesinde sahne sırasını gör.</li>
            <li>&quot;Örnek yayın&quot; ile taslağı kaydet (gerçek Instagram yüklemesi yok).</li>
          </ol>
          <p className="mt-4 text-xs text-[var(--muted)]">
            İleride: Meta Business Login → Page/IG Business hesabı → Reels Publishing API.
          </p>
        </AppPagePanel>
      </div>
    </AppPageShell>
  )
}
