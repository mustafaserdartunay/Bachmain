import { useEffect, useState } from 'react'
import { FileText } from 'lucide-react'
import { getPlatformApiBase, getStoredSession, fetchCurrentUser } from '../utils/platformAuth'
import { APP_SURFACE_PANEL_CLASS } from '../utils/dashboardDesign'

const LAWYER_NOTICE =
  'Bu sözleşmeler yayına alınmadan önce KVKK, e-Ticaret ve Tüketici Hukuku alanında uzman bir avukat tarafından kontrol edilmelidir.'

/**
 * Blocks CRM usage until outstanding published legal versions are accepted.
 */
export default function LegalConsentGate({ user, onAccepted, children }) {
  const must = user?.legal?.mustAccept || user?.legal?.outstanding?.length > 0
  const [docs, setDocs] = useState(user?.legal?.outstanding || [])
  const [activeIdx, setActiveIdx] = useState(0)
  const [scrolled, setScrolled] = useState({})
  const [accepted, setAccepted] = useState({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setDocs(user?.legal?.outstanding || [])
    setActiveIdx(0)
    setAccepted({})
    setScrolled({})
  }, [user?.id, user?.legal?.mustAccept])

  if (!must || !docs.length) return children

  const active = docs[activeIdx]

  const onScroll = (e) => {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24 && active) {
      setScrolled((p) => ({ ...p, [active.type]: true }))
    }
  }

  const allOk = docs.every((d) => accepted[d.type])

  const submit = async () => {
    if (!allOk || busy) return
    setBusy(true)
    setError('')
    try {
      const base = getPlatformApiBase()
      const { token } = getStoredSession()
      const consents = docs.map((d) => ({
        type: d.type,
        version: d.version,
        accepted: true,
      }))
      const res = await fetch(`${base}/legal/consents`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          pack: 'app',
          context: 'app_reaccept',
          consents,
          userAgent: navigator.userAgent,
          language: navigator.language || 'tr',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Onay kaydı başarısız')
      const me = await fetchCurrentUser()
      onAccepted?.(me || { ...user, legal: { mustAccept: false, outstanding: [] } })
    } catch (err) {
      setError(err.message || 'Onay kaydı başarısız')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className={`${APP_SURFACE_PANEL_CLASS} w-full max-w-2xl p-6`}>
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 text-blue-300">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-black text-white">Güncel sözleşmeler</h1>
            <p className="mt-1 text-sm text-gray-400">
              Yeni sözleşme versiyonları yayınlandı. Uygulamayı kullanmadan önce kabul etmelisiniz.
            </p>
          </div>
        </div>
        <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
          {LAWYER_NOTICE}
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {docs.map((d, i) => (
            <button
              key={d.type}
              type="button"
              onClick={() => setActiveIdx(i)}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                accepted[d.type]
                  ? 'bg-emerald-500/20 text-emerald-200'
                  : i === activeIdx
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark-700 text-gray-400'
              }`}
            >
              {d.title}
            </button>
          ))}
        </div>
        {active ? (
          <>
            <div
              onScroll={onScroll}
              className="h-64 overflow-y-auto rounded-xl border border-dark-500/50 bg-dark-900/60 p-4 text-sm text-gray-300"
            >
              <p className="mb-2 font-bold text-white">
                {active.title} · v{active.version}
              </p>
              <p className="text-gray-400">
                Tam metin için{' '}
                <a
                  className="text-blue-300 underline"
                  href={`https://www.bachmain.com${active.path || ''}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  bachmain.com{active.path}
                </a>{' '}
                adresini ziyaret edin. Bu paneli sonuna kadar kaydırarak onay kutusunu açın.
              </p>
              <div className="mt-40 text-xs text-gray-500">— metin sonu —</div>
            </div>
            <label
              className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                scrolled[active.type]
                  ? 'cursor-pointer border-dark-500/50 text-white'
                  : 'cursor-not-allowed border-dark-600 text-gray-500'
              }`}
            >
              <input
                type="checkbox"
                disabled={!scrolled[active.type]}
                checked={Boolean(accepted[active.type])}
                onChange={() => setAccepted((p) => ({ ...p, [active.type]: !p[active.type] }))}
                className="mt-0.5"
              />
              Okudum ve kabul ediyorum
            </label>
          </>
        ) : null}
        {error ? <p className="mt-3 text-sm text-rose-400">{error}</p> : null}
        <button
          type="button"
          disabled={!allOk || busy}
          onClick={submit}
          className="btn-primary mt-5 h-[52px] w-full rounded-xl font-bold text-white disabled:opacity-40"
        >
          {busy ? 'Kaydediliyor…' : 'Kabul et ve devam et'}
        </button>
      </div>
    </div>
  )
}
