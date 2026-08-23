import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  CheckCheck,
  Paperclip,
  Pencil,
  Pin,
  Reply,
  Send,
  Star,
  Trash2,
  Users,
} from 'lucide-react'
import { TEAM_HUB_FIELD_CLASS } from '../../utils/themeMode'
import { useUcc } from '../../ucc/useUcc'

function StatusTicks({ status }) {
  if (status === 'read') return <CheckCheck className="h-3 w-3 text-sky-500" />
  if (status === 'delivered') return <CheckCheck className="h-3 w-3 text-[var(--muted)]" />
  return <Check className="h-3 w-3 text-[var(--muted)]" />
}

export default function UccChatPane() {
  const ucc = useUcc()
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [editing, setEditing] = useState(null)
  const [groupTitle, setGroupTitle] = useState('')
  const bottomRef = useRef(null)
  const fileRef = useRef(null)
  const active = useMemo(
    () => ucc.conversations.find((item) => item.id === ucc.conversationId),
    [ucc.conversations, ucc.conversationId],
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [ucc.messages.length, ucc.conversationId])

  async function onSend(event) {
    event?.preventDefault?.()
    if (editing) {
      await ucc.edit(editing.id, draft)
      setEditing(null)
      setDraft('')
      return
    }
    if (!draft.trim()) return
    await ucc.send({ body: draft, replyToId: replyTo?.id })
    setDraft('')
    setReplyTo(null)
  }

  async function onFile(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    await ucc.send({
      body: '',
      file: { name: file.name, mime: file.type, size: file.size, dataUrl },
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/40 px-2 py-1.5">
        {ucc.conversations.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => ucc.selectConversation(item.id)}
            className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-bold ${
              item.id === ucc.conversationId
                ? 'bg-white/90 text-[var(--ink)]'
                : 'bg-white/40 text-[var(--muted)]'
            }`}
          >
            {item.title}
            {item.unread ? ` · ${item.unread}` : ''}
          </button>
        ))}
      </div>
      <div className="flex shrink-0 gap-1 overflow-x-auto px-2 py-1.5">
        {ucc.roster
          .filter((row) => row.id !== ucc.me?.id)
          .map((peer) => (
            <button
              key={peer.id}
              type="button"
              onClick={() => ucc.openDm(peer)}
              className="shrink-0 rounded-lg bg-white/50 px-2 py-1 text-[10px] font-bold"
            >
              {peer.name}
            </button>
          ))}
      </div>
      <form
        className="flex gap-1 px-2 pb-1"
        onSubmit={(event) => {
          event.preventDefault()
          if (!groupTitle.trim()) return
          ucc.createGroup({ title: groupTitle, memberIds: [] })
          setGroupTitle('')
        }}
      >
        <input
          value={groupTitle}
          onChange={(event) => setGroupTitle(event.target.value)}
          placeholder="Yeni grup"
          className={`${TEAM_HUB_FIELD_CLASS} !h-8 min-w-0 flex-1 !rounded-full !text-[11px]`}
        />
        <button
          type="submit"
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70"
          title="Grup"
        >
          <Users className="h-3.5 w-3.5" />
        </button>
      </form>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        {ucc.messages.length === 0 ? (
          <p className="px-2 py-6 text-center text-[12px] font-semibold text-[var(--muted)]">
            Henüz mesaj yok.
          </p>
        ) : (
          ucc.messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-[14px] px-2.5 py-2 ${message.mine ? 'bg-sky-50/80' : 'bg-white/65'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-[11px] font-extrabold">{message.authorName}</p>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--muted)]">
                  {new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {message.mine ? <StatusTicks status={message.status} /> : null}
                  {message.starred ? (
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ) : null}
                  {active?.pinnedMessageId === message.id ? (
                    <Pin className="h-3 w-3 text-sky-600" />
                  ) : null}
                </span>
              </div>
              {message.deletedAt ? (
                <p className="mt-1 text-[12px] italic text-[var(--muted)]">Mesaj silindi</p>
              ) : (
                <>
                  {message.body ? (
                    <p className="mt-1 whitespace-pre-wrap text-[12px] font-semibold">
                      {message.body}
                    </p>
                  ) : null}
                  {message.file?.dataUrl ? (
                    <a
                      href={message.file.dataUrl}
                      download={message.file.name}
                      className="mt-1 block text-[11px] font-bold text-sky-700"
                    >
                      {message.file.name}
                    </a>
                  ) : null}
                  <div className="mt-1 flex gap-1">
                    <button type="button" onClick={() => setReplyTo(message)} title="Yanıtla">
                      <Reply className="h-3.5 w-3.5 text-[var(--muted)]" />
                    </button>
                    <button type="button" onClick={() => ucc.star(message.id)} title="Yıldız">
                      <Star className="h-3.5 w-3.5 text-[var(--muted)]" />
                    </button>
                    <button type="button" onClick={() => ucc.pin(message.id)} title="Sabitle">
                      <Pin className="h-3.5 w-3.5 text-[var(--muted)]" />
                    </button>
                    {message.mine ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(message)
                            setDraft(message.body || '')
                          }}
                          title="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5 text-[var(--muted)]" />
                        </button>
                        <button type="button" onClick={() => ucc.remove(message.id)} title="Sil">
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </button>
                      </>
                    ) : null}
                  </div>
                </>
              )}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      {replyTo ? (
        <p className="px-3 text-[10px] font-bold text-[var(--muted)]">
          Yanıt: {(replyTo.body || 'dosya').slice(0, 48)}
          <button type="button" className="ml-2" onClick={() => setReplyTo(null)}>
            vazgeç
          </button>
        </p>
      ) : null}
      <form onSubmit={onSend} className="flex items-center gap-2 border-t border-white/50 p-2.5">
        <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white/70"
          title="Dosya"
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={editing ? 'Mesajı düzenle...' : 'Mesaj yaz...'}
          className={`${TEAM_HUB_FIELD_CLASS} min-w-0 flex-1 !rounded-full`}
        />
        <button
          type="submit"
          disabled={!draft.trim() && !editing}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-white disabled:opacity-50"
          aria-label="Gönder"
        >
          <Send className="h-3.5 w-3.5" strokeWidth={2.25} />
        </button>
      </form>
    </div>
  )
}
