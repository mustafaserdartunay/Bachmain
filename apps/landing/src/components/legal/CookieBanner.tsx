'use client'

import { useEffect, useState } from 'react'
import { Cookie, Settings2, X } from 'lucide-react'
import { getYonetimApiBase } from '../../utils/platformApi'
import { LAWYER_NOTICE } from '../../legal/catalog'

const STORAGE_KEY = 'bachmain_cookie_prefs_v1'

type Prefs = {
  necessary: true
  preferences: boolean
  statistics: boolean
  marketing: boolean
  savedAt?: string
}

const DEFAULT: Prefs = {
  necessary: true,
  preferences: false,
  statistics: false,
  marketing: false,
}

function readLocal(): Prefs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return { ...DEFAULT, ...JSON.parse(raw), necessary: true }
  } catch {
    return null
  }
}

function writeLocal(prefs: Prefs) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...prefs, necessary: true, savedAt: new Date().toISOString() }),
  )
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [openPrefs, setOpenPrefs] = useState(false)
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT)

  useEffect(() => {
    const existing = readLocal()
    if (existing?.savedAt) {
      setPrefs(existing)
      setVisible(false)
      return
    }
    setVisible(true)
  }, [])

  const persist = async (next: Prefs) => {
    const final = { ...next, necessary: true as const }
    writeLocal(final)
    setPrefs(final)
    setVisible(false)
    setOpenPrefs(false)
    try {
      const base = getYonetimApiBase().replace(/\/$/, '')
      await fetch(`${base}/legal/cookies`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...final,
          visitorId: localStorage.getItem('bachmain_vid') || undefined,
          userAgent: navigator.userAgent,
          language: navigator.language,
        }),
      })
    } catch {
      /* offline ok — local preference still stored */
    }
  }

  if (!visible) {
    return (
      <button
        type="button"
        onClick={() => {
          setVisible(true)
          setOpenPrefs(true)
        }}
        className="fixed bottom-4 left-4 z-[90] inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-lg print:hidden"
        aria-label="Çerez ayarları"
      >
        <Cookie className="h-4 w-4" />
        Çerezler
      </button>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[100] p-4 print:hidden sm:p-6">
      <div className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Cookie className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Çerez tercihleri</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Zorunlu çerezler site güvenliği için gereklidir. Tercihler, istatistik ve pazarlama
                çerezleri için onayınızı yönetebilirsiniz.{' '}
                <a href="/cerez-politikasi" className="font-semibold text-blue-600 hover:underline">
                  Çerez Politikası
                </a>
              </p>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
            onClick={() => setVisible(false)}
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {openPrefs ? (
          <div className="mt-4 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm">
            {(
              [
                ['necessary', 'Zorunlu', true],
                ['preferences', 'Tercihler', false],
                ['statistics', 'İstatistik', false],
                ['marketing', 'Pazarlama', false],
              ] as const
            ).map(([key, label, locked]) => (
              <label key={key} className="flex items-center justify-between gap-3">
                <span className="font-semibold text-slate-800">{label}</span>
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blue-600"
                  checked={Boolean(prefs[key])}
                  disabled={locked}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, [key]: e.target.checked, necessary: true }))
                  }
                />
              </label>
            ))}
            <p className="text-[11px] text-amber-800">{LAWYER_NOTICE}</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              persist({ necessary: true, preferences: true, statistics: true, marketing: true })
            }
            className="btn-primary inline-flex h-11 items-center rounded-xl px-4 text-sm font-bold text-white"
          >
            Tümünü kabul et
          </button>
          <button
            type="button"
            onClick={() => persist(DEFAULT)}
            className="inline-flex h-11 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800"
          >
            Yalnızca zorunlu
          </button>
          <button
            type="button"
            onClick={() => (openPrefs ? persist(prefs) : setOpenPrefs(true))}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-800"
          >
            <Settings2 className="h-4 w-4" />
            {openPrefs ? 'Tercihleri kaydet' : 'Ayarları yönet'}
          </button>
        </div>
      </div>
    </div>
  )
}
