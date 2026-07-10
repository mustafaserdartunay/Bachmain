import { FileText, Mic, Paperclip } from 'lucide-react'
import ChannelBadge from './ChannelBadge'
import { APP_PANEL_TITLE_CLASS, APP_SUBLABEL_CLASS } from '../../utils/dashboardDesign'

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message }) {
  const isOut = message.direction === 'out'

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 ${
          isOut
            ? 'rounded-br-md bg-emerald-500/90 text-white shadow-sm'
            : 'glass-inset rounded-bl-md text-[var(--ink)]'
        }`}
      >
        {message.type === 'text' && (
          <p className="whitespace-pre-wrap text-xs leading-relaxed">{message.body}</p>
        )}
        {message.type === 'image' && message.mediaUrl && (
          <img src={message.mediaUrl} alt="" className="max-h-48 rounded-xl" />
        )}
        {message.type === 'file' && (
          <div className="flex items-center gap-2 rounded-xl bg-white/35 px-3 py-2">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-semibold">{message.mediaName || 'Dosya'}</span>
          </div>
        )}
        {message.type === 'audio' && (
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="text-xs">Sesli mesaj {message.duration ? `· ${message.duration}s` : ''}</span>
            {message.mediaUrl && <audio controls src={message.mediaUrl} className="h-8 max-w-[180px]" />}
          </div>
        )}
        <div className={`mt-1 flex items-center justify-end gap-1 text-[12px] ${isOut ? 'text-emerald-50/90' : 'text-[var(--muted)]'}`}>
          <span>{formatMessageTime(message.at)}</span>
          {isOut && <span>✓</span>}
        </div>
      </div>
    </div>
  )
}

export default function ChatThread({ conversation, messages }) {
  if (!conversation) {
    return (
      <div className="flex min-h-[16rem] flex-1 flex-col items-center justify-center px-6 text-center">
        <Paperclip className="mb-3 h-8 w-8 text-[var(--muted)]" />
        <p className="text-xs font-extrabold text-[var(--ink)]">Mesaj Merkezi</p>
        <p className="mt-1 max-w-xs text-[12px] font-semibold text-[var(--muted)]">
          Sol panelden bir konuşma seçin. Tüm kanallar tek ekranda.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-white/40 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/45 text-sm font-extrabold text-[var(--ink)]">
            {conversation.contactName?.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className={APP_PANEL_TITLE_CLASS}>{conversation.contactName}</p>
            <p className={APP_SUBLABEL_CLASS}>
              {conversation.contactPhone || conversation.contactEmail || conversation.contactHandle || '—'}
            </p>
          </div>
        </div>
        <ChannelBadge channel={conversation.channel} showLabel />
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}
