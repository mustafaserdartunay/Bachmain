import SearchInput from '../Common/SearchInput'
import ChannelBadge, { ChannelDot } from './ChannelBadge'
import { CHANNELS } from '../../omnichannel/schema'
import { AppPanelDot } from '../Layout/AppPageLayout'
import {
  APP_METRIC_ROW_CLASS,
  APP_OMNI_CHIP_ACTIVE_CLASS,
  APP_OMNI_CHIP_CLASS,
  APP_OMNI_COLUMN_CLASS,
  APP_OMNI_EMPTY_CLASS,
  APP_PANEL_TITLE_CLASS,
  APP_SUBLABEL_CLASS,
} from '../../utils/dashboardDesign'

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  const now = new Date()
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

const sentimentBorder = {
  positive: 'border-l-emerald-500',
  negative: 'border-l-rose-500',
  neutral: 'border-l-transparent',
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
    <aside className={APP_OMNI_COLUMN_CLASS}>
      <div className="shrink-0 border-b border-white/40 px-3 py-3">
        <div className="mb-2.5 flex items-center gap-2">
          <AppPanelDot color="blue" />
          <h2 className={APP_PANEL_TITLE_CLASS}>Konuşmalar</h2>
        </div>
        <SearchInput
          wrapperClassName="mb-3"
          size="sm"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Konuşma ara..."
        />
        <div className="flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onChannelFilter('all')}
            className={channelFilter === 'all' ? APP_OMNI_CHIP_ACTIVE_CLASS : APP_OMNI_CHIP_CLASS}
          >
            Tümü
          </button>
          {Object.values(CHANNELS).map((channel) => (
            <button
              key={channel.id}
              type="button"
              onClick={() => onChannelFilter(channel.id)}
              className={channelFilter === channel.id ? APP_OMNI_CHIP_ACTIVE_CLASS : APP_OMNI_CHIP_CLASS}
            >
              {channel.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {conversations.length === 0 ? (
          <p className={APP_OMNI_EMPTY_CLASS}>Konuşma bulunamadı</p>
        ) : (
          conversations.map((conversation) => (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelect(conversation.id)}
              className={`${APP_METRIC_ROW_CLASS} !min-h-[3.5rem] !items-start gap-2.5 border-l-2 py-2 ${
                sentimentBorder[conversation.sentiment] || sentimentBorder.neutral
              } ${selectedId === conversation.id ? '!bg-white/55' : ''}`}
            >
              <div className="relative mt-0.5 shrink-0">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/45 text-sm font-extrabold text-[var(--ink)]">
                  {conversation.contactName?.slice(0, 1) || '?'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5">
                  <ChannelDot channel={conversation.channel} />
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-extrabold text-[var(--ink)]">{conversation.contactName}</p>
                  <span className={`shrink-0 ${APP_SUBLABEL_CLASS}`}>{formatTime(conversation.lastMessageAt)}</span>
                </div>
                <p className={`mt-0.5 truncate ${APP_SUBLABEL_CLASS}`}>{conversation.lastMessagePreview}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <ChannelBadge channel={conversation.channel} />
                  {conversation.unreadCount > 0 && (
                    <span className="rounded-full bg-emerald-500 px-1.5 py-0.5 text-[11px] font-black text-white">
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
