import { FileText, Mic, Paperclip } from 'lucide-react'
import ChannelBadge from './ChannelBadge'

function formatMessageTime(value) {
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function MessageBubble({ message }) {
  const isOut = message.direction === 'out'

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
          isOut
            ? 'rounded-br-md bg-emerald-600/90 text-white'
            : 'rounded-bl-md border border-dark-500/40 bg-dark-700/80 text-gray-100'
        }`}
      >
        {message.type === 'text' && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>
        )}
        {message.type === 'image' && message.mediaUrl && (
          <img src={message.mediaUrl} alt="" className="max-h-48 rounded-xl" />
        )}
        {message.type === 'file' && (
          <div className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2">
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
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isOut ? 'text-emerald-100/80' : 'text-gray-500'}`}>
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
      <div className="flex h-full flex-col items-center justify-center bg-[#0b141a]/40 text-center">
        <Paperclip className="mb-3 h-10 w-10 text-gray-600" />
        <p className="text-sm font-bold text-gray-400">Omnichannel Communication Center</p>
        <p className="mt-1 max-w-xs text-xs text-gray-500">Sol panelden bir konuşma seçin. Tüm kanallar tek ekranda.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZG9kIj48ZyBmaWxsPSIjMTAyMDMwIiBmaWxsLW9wYWNpdHk9IjAuMyI+PHBhdGggZD0iTTM2IDM0djItaDJ2LTJoLTJ6bTAtNHYyaDJ2LTJoLTJ6bTAgMTBoMnYtMmgtMnYyem0xMC0xMGgtMnYyaDJ2LTJ6bS0xMC0yaDJ2LTJoLTJ6bTAgMTBoMnYtMmgtMnYyem0xMC0xMGgtMnYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-dark-900/95">
      <div className="flex items-center justify-between border-b border-dark-500/45 bg-dark-800/90 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700 text-sm font-black text-gray-300">
            {conversation.contactName?.slice(0, 1)}
          </div>
          <div>
            <p className="text-sm font-black text-white">{conversation.contactName}</p>
            <p className="text-[11px] text-gray-500">
              {conversation.contactPhone || conversation.contactEmail || conversation.contactHandle || '—'}
            </p>
          </div>
        </div>
        <ChannelBadge channel={conversation.channel} showLabel />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
      </div>
    </div>
  )
}
