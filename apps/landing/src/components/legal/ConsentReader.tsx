'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronRight, FileText } from 'lucide-react'
import { LAWYER_NOTICE, type LegalDocType } from '../../legal/catalog'
import { getYonetimApiBase } from '../../utils/platformApi'

export type ConsentItem = {
  type: LegalDocType | string
  version: string
  accepted: boolean
  title?: string
}

type Doc = {
  type: string
  slug: string
  title: string
  version: string
  bodyHtml: string
  bodyMarkdown?: string
  path: string
}

type Props = {
  pack: 'purchase' | 'demo' | 'register' | 'app'
  token?: string
  email?: string
  title?: string
  confirmLabel?: string
  onComplete: (consents: ConsentItem[]) => void | Promise<void>
  onBack?: () => void
  /** When false, only validates UI and returns consents to parent (parent persists). */
  persist?: boolean
  documents?: Doc[]
}

function markdownToHtml(md: string) {
  const lines = String(md || '').split(/\r?\n/)
  const out: string[] = []
  let para: string[] = []
  const flush = () => {
    if (!para.length) return
    out.push(`<p>${escapeHtml(para.join(' ').trim())}</p>`)
    para = []
  }
  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flush()
      continue
    }
    if (line.startsWith('# ')) {
      flush()
      out.push(`<h1>${escapeHtml(line.slice(2))}</h1>`)
      continue
    }
    if (line.startsWith('## ')) {
      flush()
      out.push(`<h2>${escapeHtml(line.slice(3))}</h2>`)
      continue
    }
    para.push(line.trim())
  }
  flush()
  return out.join('\n')
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export default function ConsentReader({
  pack,
  token,
  email,
  title = 'Sözleşmeler',
  confirmLabel = 'Ödemeye Geç',
  onComplete,
  onBack,
  documents: preload,
  persist = true,
}: Props) {
  const [docs, setDocs] = useState<Doc[]>(preload || [])
  const [activeIdx, setActiveIdx] = useState(0)
  const [accepted, setAccepted] = useState<Record<string, boolean>>({})
  const [scrolled, setScrolled] = useState<Record<string, boolean>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!preload?.length)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (preload?.length) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const base = getYonetimApiBase().replace(/\/$/, '')
        const res = await fetch(`${base}/legal/pack?pack=${encodeURIComponent(pack)}`, {
          credentials: 'include',
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Sözleşmeler yüklenemedi')
        if (cancelled) return
        const list = (data.documents || []).map((d: Doc) => ({
          ...d,
          bodyHtml: d.bodyHtml || markdownToHtml(d.bodyMarkdown || ''),
        }))
        if (!list.length) throw new Error('empty')
        setDocs(list)
      } catch {
        // Static fallback for offline / first deploy
        const { getStaticLegalDoc } = await import('../../legal/staticDocs')
        const { CONSENT_PACKS: packs } = await import('../../legal/catalog')
        const types = packs[pack] || []
        const list = types
          .map((t) => getStaticLegalDoc(t))
          .filter(Boolean)
          .map((d) => ({
            type: d!.type,
            slug: d!.slug,
            title: d!.title,
            version: d!.version,
            bodyHtml: d!.bodyHtml,
            path: `/${d!.slug}`,
          }))
        if (!cancelled) {
          if (!list.length) setError('Sözleşmeler yüklenemedi')
          else setDocs(list as Doc[])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [pack, preload])

  const active = docs[activeIdx] || null

  const onScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el || !active) return
    const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24
    if (nearBottom) {
      setScrolled((prev) => ({ ...prev, [active.type]: true }))
    }
  }, [active])

  useEffect(() => {
    const el = scrollRef.current
    if (!el || !active) return
    el.scrollTop = 0
    // Short docs: mark scrolled if content fits
    requestAnimationFrame(() => {
      if (el.scrollHeight <= el.clientHeight + 8) {
        setScrolled((prev) => ({ ...prev, [active.type]: true }))
      }
    })
  }, [active?.type])

  const allAccepted = useMemo(
    () => docs.length > 0 && docs.every((d) => accepted[d.type]),
    [docs, accepted],
  )

  const toggleAccept = () => {
    if (!active || !scrolled[active.type]) return
    setAccepted((prev) => ({ ...prev, [active.type]: !prev[active.type] }))
  }

  const submit = async () => {
    if (!allAccepted || busy) return
    setBusy(true)
    setError('')
    try {
      const consents: ConsentItem[] = docs.map((d) => ({
        type: d.type,
        version: d.version,
        accepted: true,
        title: d.title,
      }))
      if (persist) {
        const base = getYonetimApiBase().replace(/\/$/, '')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (token) headers.Authorization = `Bearer ${token}`
        const res = await fetch(`${base}/legal/consents`, {
          method: 'POST',
          credentials: 'include',
          headers,
          body: JSON.stringify({
            pack,
            context: pack,
            email,
            consents,
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
            language: typeof navigator !== 'undefined' ? navigator.language : 'tr',
          }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.message || 'Onay kaydı başarısız')
      }
      await onComplete(consents)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onay kaydı başarısız')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Sözleşmeler yükleniyor…
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <FileText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-600">
              Devam etmek için her sözleşmeyi sonuna kadar okuyup kabul edin.
            </p>
          </div>
        </div>

        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-950">
          {LAWYER_NOTICE}
        </p>

        <ol className="mb-4 flex flex-wrap gap-2">
          {docs.map((d, i) => {
            const done = accepted[d.type]
            const current = i === activeIdx
            return (
              <li key={d.type}>
                <button
                  type="button"
                  onClick={() => setActiveIdx(i)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    done
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                      : current
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {done ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
                  {d.title}
                </button>
              </li>
            )
          })}
        </ol>

        {active ? (
          <>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">{active.title}</h3>
              <span className="text-xs font-semibold tabular-nums text-slate-500">
                v{active.version}
              </span>
            </div>
            <div
              ref={scrollRef}
              onScroll={onScroll}
              className="h-[min(52vh,420px)] overflow-y-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-relaxed text-slate-700 [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-extrabold [&_h2]:mt-5 [&_h2]:text-sm [&_h2]:font-bold"
              dangerouslySetInnerHTML={{ __html: active.bodyHtml }}
            />
            <label
              className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                scrolled[active.type]
                  ? 'cursor-pointer border-slate-200 bg-white'
                  : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-blue-600"
                disabled={!scrolled[active.type]}
                checked={Boolean(accepted[active.type])}
                onChange={toggleAccept}
              />
              <span>
                {scrolled[active.type]
                  ? 'Okudum ve kabul ediyorum'
                  : 'Onay kutusu için metni sonuna kadar kaydırın'}
              </span>
            </label>
          </>
        ) : null}

        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="btn-cancel inline-flex h-[52px] items-center rounded-xl px-5 text-sm font-bold text-white"
            >
              Geri
            </button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
            {activeIdx < docs.length - 1 ? (
              <button
                type="button"
                disabled={!accepted[active?.type || '']}
                onClick={() => setActiveIdx((i) => Math.min(i + 1, docs.length - 1))}
                className="inline-flex h-[52px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-slate-800 disabled:opacity-40"
              >
                Sonraki
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              disabled={!allAccepted || busy}
              onClick={submit}
              className="btn-primary inline-flex h-[52px] items-center rounded-xl px-6 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {busy ? 'Kaydediliyor…' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
