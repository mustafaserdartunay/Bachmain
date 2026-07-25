import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { OAUTH_PROVIDERS } from '../../integrations/catalog'
import { connectPlatform } from '../../integrations/connectionStore'
import { IntegrationBrandIcon, integrationBrandBg } from './brandIcons'

const STEPS = [
  { id: 'intro', label: 'Tanıtım' },
  { id: 'oauth', label: 'OAuth' },
  { id: 'account', label: 'Hesap' },
  { id: 'verify', label: 'Doğrulama' },
  { id: 'done', label: 'Tamam' },
]

export default function ConnectionWizard({ platform, open, onClose, onComplete }) {
  const [step, setStep] = useState(0)
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [oauthBusy, setOauthBusy] = useState(false)
  const [verifyBusy, setVerifyBusy] = useState(false)
  const [verifyOk, setVerifyOk] = useState(false)
  const [progress, setProgress] = useState(0)

  const provider = OAUTH_PROVIDERS[platform?.oauthProvider] || OAUTH_PROVIDERS.custom
  const accounts = useMemo(() => platform?.demoAccounts || [], [platform])

  useEffect(() => {
    if (!open) return
    setStep(0)
    setSelectedAccount(null)
    setOauthBusy(false)
    setVerifyBusy(false)
    setVerifyOk(false)
    setProgress(0)
  }, [open, platform?.id])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !platform) return null

  async function runOauth() {
    setOauthBusy(true)
    // SaaS: real Meta/Google/Microsoft redirects will plug in here.
    // For now simulate official OAuth round-trip without exposing API keys.
    await new Promise((r) => setTimeout(r, 1400))
    setOauthBusy(false)
    setStep(2)
    if (accounts.length === 1) setSelectedAccount(accounts[0].id)
    else if (accounts.length === 0) setSelectedAccount('default')
  }

  async function runVerify() {
    const account = accounts.find((a) => a.id === selectedAccount) || accounts[0]
    if (!account && accounts.length) return
    setVerifyBusy(true)
    setVerifyOk(false)
    await new Promise((r) => setTimeout(r, 900))
    setVerifyOk(true)
    await new Promise((r) => setTimeout(r, 500))
    setVerifyBusy(false)
    setStep(4)
    const row = connectPlatform({
      platformId: platform.id,
      accountId: account?.id || `acc_${platform.id}`,
      accountLabel: account?.label || platform.title,
      accountMeta: account?.meta || '',
      extras: {
        phoneNumber: platform.id === 'whatsapp' ? account?.label : undefined,
        businessName: account?.meta || platform.title,
        followerCount: platform.id === 'instagram' ? 12400 : undefined,
      },
    })
    let p = 0
    const timer = setInterval(() => {
      p += 8
      setProgress(Math.min(100, p))
      if (p >= 100) {
        clearInterval(timer)
        onComplete?.(row)
      }
    }, 80)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${platform.title} bağlantı sihirbazı`}
        className="relative flex max-h-[min(92dvh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-[var(--ds-bg,var(--app-bg))] shadow-2xl"
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-2xl ${integrationBrandBg(platform.brandKey)}`}
            >
              <IntegrationBrandIcon brandKey={platform.brandKey} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
                Bağlantı Sihirbazı
              </p>
              <h2 className="text-base font-black text-[var(--ink)]">{platform.title}</h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--muted)] hover:bg-white/10 hover:text-[var(--ink)]"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-white/5 px-4 py-2">
          {STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${
                i === step
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                  : i < step
                    ? 'text-emerald-600/70'
                    : 'text-[var(--muted)]'
              }`}
            >
              {i + 1}. {s.label}
            </span>
          ))}
        </nav>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {step === 0 ? (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-[var(--muted)]">{platform.summary}</p>
              <div>
                <p className="text-[11px] font-black uppercase text-[var(--muted)]">
                  İstenen izinler
                </p>
                <ul className="mt-2 space-y-1.5">
                  {platform.permissions.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-[var(--ink)]">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-[var(--muted)]">
                Tahmini süre:{' '}
                <strong className="text-[var(--ink)]">~{provider.durationSec} sn</strong>. API
                anahtarı veya webhook URL girmeniz gerekmez — BachMain yönetir.
              </p>
            </div>
          ) : null}

          {step === 1 ? (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              {oauthBusy ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                  <p className="text-sm font-bold text-[var(--ink)]">
                    {provider.label} giriş ekranına yönlendiriliyorsunuz…
                  </p>
                  <p className="max-w-sm text-xs text-[var(--muted)]">
                    İzinleri onayladıktan sonra otomatik olarak BachMain’e döneceksiniz.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-[var(--muted)]">
                    Resmi <strong className="text-[var(--ink)]">{provider.label}</strong> OAuth
                    ekranına gideceksiniz. Hiçbir teknik bilgi girmeniz gerekmez.
                  </p>
                  <button
                    type="button"
                    onClick={runOauth}
                    className="rounded-2xl border border-emerald-500/40 bg-emerald-500/20 px-5 py-3 text-xs font-black uppercase tracking-wide text-emerald-900 dark:text-emerald-100"
                  >
                    {provider.label} ile devam et
                  </button>
                </>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--muted)]">
                Birden fazla hesap bulundu. Hangisini bağlamak istiyorsunuz?
              </p>
              <div className="space-y-2">
                {(accounts.length
                  ? accounts
                  : [{ id: 'default', label: platform.title, meta: 'Varsayılan' }]
                ).map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => setSelectedAccount(acc.id)}
                    className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-colors ${
                      selectedAccount === acc.id
                        ? 'border-emerald-500/50 bg-emerald-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <span>
                      <span className="block text-sm font-black text-[var(--ink)]">
                        {acc.label}
                      </span>
                      {acc.meta ? (
                        <span className="text-[11px] text-[var(--muted)]">{acc.meta}</span>
                      ) : null}
                    </span>
                    {selectedAccount === acc.id ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              {verifyBusy && !verifyOk ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-sky-500" />
                  <p className="text-sm font-bold">API · Webhook · Token test ediliyor…</p>
                </>
              ) : null}
              {verifyOk ? (
                <>
                  <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                  <p className="text-sm font-black text-emerald-700 dark:text-emerald-300">
                    Doğrulama başarılı
                  </p>
                </>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-4 py-6 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
              <h3 className="text-lg font-black text-[var(--ink)]">Tebrikler</h3>
              <p className="text-sm text-[var(--muted)]">
                {platform.title} hesabınız başarıyla bağlandı. İlk senkronizasyon başlatılıyor.
              </p>
              <div className="mx-auto h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-100"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--muted)] hover:text-[var(--ink)]"
          >
            Vazgeç
          </button>
          <div className="flex gap-2">
            {step === 0 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-2xl bg-[var(--ink)] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[var(--ds-bg,#fff)]"
              >
                Devam
              </button>
            ) : null}
            {step === 2 ? (
              <button
                type="button"
                disabled={!selectedAccount && accounts.length > 1}
                onClick={() => {
                  setStep(3)
                  runVerify()
                }}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white disabled:opacity-40"
              >
                Seç ve doğrula
              </button>
            ) : null}
            {step === 4 && progress >= 100 ? (
              <button
                type="button"
                onClick={onClose}
                className="rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-black uppercase tracking-wide text-white"
              >
                Bitir
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}
