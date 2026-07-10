import { useEffect, useState } from 'react'
import { MessageSquare, Send, ShieldCheck, Users } from 'lucide-react'
import { readB2bTickets, replyB2bTicket } from '../utils/b2bPortalStore'
import { readTenantRegistry } from '../utils/userProfile'
import { BTN_PRIMARY } from '../utils/buttonStyles'

function formatStamp(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminControlPage() {
  const [registry, setRegistry] = useState(readTenantRegistry)
  const [tickets, setTickets] = useState(() => readB2bTickets())
  const [replyDrafts, setReplyDrafts] = useState({})

  useEffect(() => {
    function sync() {
      setRegistry(readTenantRegistry())
      setTickets(readB2bTickets())
    }
    window.addEventListener('erlenbox:user-profile-updated', sync)
    window.addEventListener('erlenbox:b2b-updated', sync)
    return () => {
      window.removeEventListener('erlenbox:user-profile-updated', sync)
      window.removeEventListener('erlenbox:b2b-updated', sync)
    }
  }, [])

  function submitReply(ticketId) {
    const message = replyDrafts[ticketId]?.trim()
    if (!message) return
    replyB2bTicket(ticketId, message)
    setReplyDrafts((current) => ({ ...current, [ticketId]: '' }))
    setTickets(readB2bTickets())
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <h1 className="text-2xl font-black uppercase tracking-wide text-purple-300">Yönetici Kontrol Paneli</h1>
        <p className="mt-2 text-xs font-semibold text-gray-500">Kayıtlı firmaların müşteri numaralarını görüntüleyerek destek verin.</p>
      </section>

      <section className="card overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-dark-500/45 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-purple-300">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-white">Kayıtlı Firmalar</h2>
              <p className="text-xs font-semibold text-gray-500">{registry.length} kayıt</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_180px_180px] border-b border-dark-500/45 px-5 py-3 text-[13px] font-black uppercase tracking-wider text-gray-500">
          <span>Müşteri No</span>
          <span>Kullanıcı</span>
          <span>Firma</span>
          <span>Kayıt</span>
          <span>Son Görülme</span>
        </div>

        {registry.length === 0 ? (
          <div className="px-5 py-10 text-center text-xs font-semibold text-gray-500">
            Henüz kayıtlı firma bulunmuyor. Kullanıcı profili oluşturulduğunda burada listelenir.
          </div>
        ) : (
          <div className="divide-y divide-dark-500/35">
            {registry.map((entry) => (
              <div key={entry.tenantCode} className="grid grid-cols-[140px_minmax(0,1fr)_minmax(0,1fr)_180px_180px] items-center px-5 py-4 text-sm">
                <span className="font-black text-blue-300">{entry.tenantCode}</span>
                <span className="truncate font-bold text-gray-200">{entry.displayName}</span>
                <span className="truncate text-xs font-semibold text-gray-500">{entry.companyName}</span>
                <span className="text-xs font-bold text-gray-500">{formatStamp(entry.registeredAt)}</span>
                <span className="text-xs font-bold text-gray-500">{formatStamp(entry.lastSeenAt)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-emerald-300">
            <MessageSquare className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-white">B2B Canlı Notlar</h2>
            <p className="text-xs font-semibold text-gray-500">{tickets.length} mesaj</p>
          </div>
        </div>
        {tickets.length === 0 ? (
          <p className="text-xs font-semibold text-gray-500">Henüz müşteri notu yok.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-2xl border border-dark-500/40 bg-dark-700/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-white">{ticket.customerName}</p>
                  <span className="text-[12px] font-black uppercase text-blue-300">{ticket.status}</span>
                </div>
                <p className="mt-2 text-xs text-gray-400">{ticket.message}</p>
                {(ticket.replies || []).map((reply) => (
                  <p key={reply.id} className="mt-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs text-gray-300">
                    <span className="font-black text-blue-300">{reply.author}: </span>{reply.message}
                  </p>
                ))}
                <div className="mt-3 flex gap-2">
                  <input
                    value={replyDrafts[ticket.id] || ''}
                    onChange={(e) => setReplyDrafts((current) => ({ ...current, [ticket.id]: e.target.value }))}
                    placeholder="Yanıt yaz..."
                    className="form-input flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(ticket.id)}
                    className={`${BTN_PRIMARY} gap-1 px-3 py-2 text-xs`}
                  >
                    <Send className="h-3.5 w-3.5" /> Yanıtla
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-dark-500/45 bg-dark-700/60 text-blue-300">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-black text-white">Destek Notu</h2>
            <p className="mt-1 text-xs font-semibold leading-5 text-gray-500">
              Müşteri destek görüşmelerinde kullanıcıdan müşteri numarasını isteyin. Bu kod her firma için benzersizdir ve otomatik oluşturulur.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
