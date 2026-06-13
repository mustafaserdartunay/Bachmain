import { Search } from 'lucide-react'
import ChannelBadge, { ChannelDot } from './ChannelBadge'
import { CHANNELS } from '../../omnichannel/schema'

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

const sentimentTone = {
  positive: 'border-l-emerald-500',
  negative: 'border-l-red-500',
  neutral: 'border-l-gray-500',
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelect,
  channelFilter,
  onChannelFilter,
  search,
  onSearch,
}) {
  return (
    <aside className="flex h-full flex-col border-r border-dark-500/45 bg-dark-800/60">
      <div className="border-b border-dark-500/45 p-3">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Konuşma ara..."
            className="form-input w-full pl-9 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onChannelFilter('all')}
            className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${channelFilter === 'all' ? 'bg-blue-500/20 text-blue-200' : 'text-gray-500 hover:text-gray-300'}`}
          >
            Tümü
          </button>
          {Object.values(CHANNELS).map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => onChannelFilter(channel.id)}
              className={`rounded-lg px-2 py-1 text-[10px] font-black uppercase ${channelFilter === channel.id ? `${channel.bg} ${channel.color}` : 'text-gray-500 hover:text-gray-300'}`}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-4 text-center text-xs text-gray-500">Konuşma bulunamadı</p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`flex w-full items-start gap-3 border-b border-dark-500/30 border-l-2 px-3 py-3 text-left transition-colors ${
                sentimentTone[conversation.sentiment] || sentimentTone.neutral
              } ${selectedId === conversation.id ? 'bg-blue-500/10' : 'hover:bg-dark-700/40'}`}
            >
              <div className="relative mt-0.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-dark-700 text-sm font-black text-gray-300">
                  {conversation.contactName?.slice(0, 1) || '?'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <ChannelDot channel={conversation.channel} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-bold text-gray-200">{conversation.contactName}</p>
                  <span className="shrink-0 text-[10px] font-semibold text-gray-500">{formatTime(conversation.lastMessageAt)}</span>
                </div>
                <p className="mt-0.5 truncate text-xs text-gray-500">{conversation.lastMessagePreview}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <ChannelBadge channel={conversation.channel} />
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </aside>
  )
}
