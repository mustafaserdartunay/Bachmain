import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Headphones, LifeBuoy, Send, X } from 'lucide-react'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { submitSupportTicket } from '../../utils/platformAuth'
import { ensureUserProfile } from '../../utils/userProfile'
import { readCompanySettings } from '../../utils/companySettings'

const CATEGORIES = [
  { id: 'not', label: 'Not' },
  { id: 'sikayet', label: 'Şikayet' },
  { id: 'destek', label: 'Destek' },
  { id: 'talep', label: 'Talep' },
  { id: 'bilgi', label: 'Bilgi' },
]

export default function HeaderSupport() {
  const { open, setOpen, toggle } = useHeaderPopover('support')
  const [category, setCategory] = useState('destek')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'end',
    matchWidth: false,
    width: 380,
    offset: 8,
  })

  const profile = useMemo(() => ensureUserProfile(), [open])
  const companyName = useMemo(() => readCompanySettings().companyName || profile.companyName || '', [open, profile.companyName])

  async function handleSubmit(event) {
    event.preventDefault()
    const trimmed = message.trim()
    if (!trimmed) {
      setFeedback({ tone: 'error', text: 'Lütfen mesajınızı yazın.' })
      return
    }
    setSending(true)
    setFeedback(null)
    try {
      const result = await submitSupportTicket({
        category,
        subject: subject.trim(),
        message: trimmed,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        companyName,
        tenantCode: profile.tenantCode,
      })
      setSubject('')
      setMessage('')
      setCategory('destek')
      setFeedback({
        tone: 'success',
        text: result?.ticket?.id
          ? `Talebiniz alındı (#${result.ticket.id}). Destek ekibi dönüş yapacak.`
          : 'Talebiniz alındı. Destek ekibi dönüş yapacak.',
      })
    } catch (error) {
      setFeedback({
        tone: 'error',
        text: error?.message || 'Gönderilemedi. Lütfen tekrar deneyin.',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        data-header-popover-trigger="support"
        onClick={() => {
          toggle()
          setFeedback(null)
        }}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label="Destek"
        title="Destek"
        aria-expanded={open}
      >
        <span className="icon-wrap">
          <LifeBuoy className="h-4 w-4 shrink-0" />
        </span>
      </button>

      {open
        ? createPortal(
            <div
              ref={menuRef}
              style={
                menuStyle ?? {
                  position: 'fixed',
                  visibility: 'hidden',
                  pointerEvents: 'none',
                  zIndex: 10000,
                }
              }
              className="app-header-dropdown header-popover-panel overflow-hidden"
              data-header-popover="support"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="header-popover-head !px-3 !py-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                    Destek
                  </p>
                  <p className="text-[11px] font-normal text-[var(--muted)]">
                    Not, şikayet, talep ve bilgi
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="glass-sidebar-toggle glass-sidebar-collapse flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                  aria-label="Destek penceresini kapat"
                  title="Kapat"
                >
                  <X className="h-4 w-4" strokeWidth={2.25} />
                </button>
              </div>

              <form className="space-y-3 p-3" onSubmit={handleSubmit}>
                <div>
                  <p className="mb-1.5 text-[11px] font-semibold text-[var(--muted)]">Konu başlığı</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((item) => {
                      const active = category === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setCategory(item.id)}
                          className={`rounded-lg border px-2.5 py-1 text-[12px] font-semibold transition ${
                            active
                              ? 'border-[#2563eb]/40 bg-[#2563eb]/10 text-[#2563eb]'
                              : 'border-[rgba(140,145,165,0.2)] bg-transparent text-[var(--muted)] hover:border-[#2563eb]/30'
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">
                    Kısa konu (isteğe bağlı)
                  </span>
                  <input
                    type="text"
                    value={subject}
                    onChange={(event) => setSubject(event.target.value)}
                    maxLength={120}
                    placeholder="Örn. Üretim ekranı hatası"
                    className="form-input !h-9 w-full !min-h-9 !px-2.5 text-[13px]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-[11px] font-semibold text-[var(--muted)]">
                    Mesajınız
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    maxLength={4000}
                    placeholder="Detayları yazın…"
                    className="form-input w-full resize-y !px-2.5 !py-2 text-[13px] leading-snug"
                    required
                  />
                </label>

                {feedback ? (
                  <p
                    className={`rounded-lg px-2.5 py-2 text-[12px] font-semibold ${
                      feedback.tone === 'success'
                        ? 'bg-emerald-500/10 text-emerald-700'
                        : 'bg-rose-500/10 text-rose-700'
                    }`}
                  >
                    {feedback.text}
                  </p>
                ) : (
                  <p className="flex items-start gap-1.5 text-[11px] text-[var(--muted)]">
                    <Headphones className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Talebiniz yonetim.bachmain.com Destek sayfasına ve destek@bachmain.com adresine iletilir.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#60a5fa] via-[#2563eb] to-[#1d4ed8] text-[13px] font-bold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
                >
                  <Send className="h-4 w-4" strokeWidth={2.25} />
                  {sending ? 'Gönderiliyor…' : 'Gönder'}
                </button>
              </form>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
