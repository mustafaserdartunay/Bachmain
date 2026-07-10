import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { getChannelUnreadCounts } from '../../omnichannel/store'
import {
  SOCIAL_BRAND_BACKGROUNDS,
  SOCIAL_BRAND_ICONS,
} from './SocialBrandIcons'

export const SOCIAL_DOCK_CHANNELS = [
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'pinterest', label: 'Pinterest' },
  { id: 'x', label: 'X' },
  { id: 'email', label: 'Mail' },
]

function SocialCountBadge({ count }) {
  if (!count) return null
  return (
    <span className="social-dock-badge absolute -bottom-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-black leading-none text-white ring-2 ring-white shadow-[0_0_10px_rgba(255,59,48,0.65)]">
      {count > 99 ? '99+' : count}
    </span>
  )
}

function SocialDockButton({ channel, count, onNavigate }) {
  const Icon = SOCIAL_BRAND_ICONS[channel.id]
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const kanal = searchParams.get('kanal')
  const isActive = location.pathname === '/mesajlar' && kanal === channel.id

  return (
    <Link
      to={`/mesajlar?kanal=${channel.id}`}
      onClick={onNavigate}
      title={`${channel.label}${count ? ` · ${count} yeni mesaj` : ''}`}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-2xl transition-transform hover:scale-105 ${
        isActive ? 'ring-2 ring-white/90 ring-offset-2 ring-offset-[#eef0f4]' : ''
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-[14px] shadow-lg ${SOCIAL_BRAND_BACKGROUNDS[channel.id]}`}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <SocialCountBadge count={count} />
    </Link>
  )
}

export default function SocialDock({ className = '', onNavigate }) {
  const [counts, setCounts] = useState(() => getChannelUnreadCounts())

  useEffect(() => {
    function refresh() {
      setCounts(getChannelUnreadCounts())
    }
    refresh()
    window.addEventListener('bach:omni-updated', refresh)
    return () => window.removeEventListener('bach:omni-updated', refresh)
  }, [])

  return (
    <aside className={`social-dock ${className}`}>
      <div className="social-dock-inner flex h-full flex-col items-center gap-2.5 py-4">
        {SOCIAL_DOCK_CHANNELS.map((channel) => (
          <SocialDockButton
            key={channel.id}
            channel={channel}
            count={counts[channel.id] || 0}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </aside>
  )
}

export function SocialDockMobileRow({ onNavigate }) {
  const [counts, setCounts] = useState(() => getChannelUnreadCounts())

  useEffect(() => {
    function refresh() {
      setCounts(getChannelUnreadCounts())
    }
    refresh()
    window.addEventListener('bach:omni-updated', refresh)
    return () => window.removeEventListener('bach:omni-updated', refresh)
  }, [])

  return (
    <div className="mb-3 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {SOCIAL_DOCK_CHANNELS.map((channel) => {
        const Icon = SOCIAL_BRAND_ICONS[channel.id]
        const count = counts[channel.id] || 0
        return (
          <Link
            key={channel.id}
            to={`/mesajlar?kanal=${channel.id}`}
            onClick={onNavigate}
            title={channel.label}
            className="relative shrink-0"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl shadow ${SOCIAL_BRAND_BACKGROUNDS[channel.id]}`}>
              <Icon className="h-4 w-4" />
            </span>
            <SocialCountBadge count={count} />
          </Link>
        )
      })}
    </div>
  )
}
