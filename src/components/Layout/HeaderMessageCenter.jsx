import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { getChannelUnreadCounts, getMessageCenterBadge } from '../../omnichannel/store'
import { HEADER_CONTROL_BUTTON_CLASS } from '../../utils/themeMode'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { useHeaderPopover } from '../../hooks/useHeaderPopover'
import { SOCIAL_DOCK_CHANNELS } from './SocialDock'
import { SOCIAL_BRAND_BACKGROUNDS, SOCIAL_BRAND_ICONS } from './SocialBrandIcons'

function SocialCountBadge({ count, size = 'md' }) {
  if (!count) return null
  const sizeClass =
    size === 'sm'
      ? 'h-[14px] min-w-[14px] text-[10px] ring-1'
      : 'h-[18px] min-w-[18px] text-[11px] ring-2'

  return (
    <span
      className={`social-dock-badge absolute -bottom-0.5 -right-0.5 flex items-center justify-center rounded-full bg-[#ff3b30] px-0.5 font-black leading-none text-white ring-white ${sizeClass}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

function HeaderSocialIcon({ channel, count, onNavigate }) {
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
      className={`message-center-channel-card ${
        isActive ? 'bg-white/50 ring-1 ring-[rgba(139,92,246,0.28)]' : ''
      }`}
    >
      <span
        className={`relative flex h-7 w-7 shrink-0 items-center justify-center rounded-md shadow-sm ${SOCIAL_BRAND_BACKGROUNDS[channel.id]}`}
      >
        <Icon className="h-3.5 w-3.5" />
        <SocialCountBadge count={count} size="sm" />
      </span>
      <span className="min-w-0 flex-1 truncate text-left text-[12px] font-semibold leading-none text-[var(--ink)]">
        {channel.label}
      </span>
      {count > 0 ? (
        <span className="shrink-0 text-[11px] font-bold tabular-nums text-[var(--muted)]">
          {count}
        </span>
      ) : null}
    </Link>
  )
}

export default function HeaderMessageCenter() {
  const navigate = useNavigate()
  const { open, setOpen, toggle } = useHeaderPopover('message-center')
  const [badge, setBadge] = useState(() => getMessageCenterBadge())
  const [counts, setCounts] = useState(() => getChannelUnreadCounts())
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'center',
    matchWidth: false,
    offset: 8,
  })

  useEffect(() => {
    function refresh() {
      setBadge(getMessageCenterBadge())
      setCounts(getChannelUnreadCounts())
    }
    refresh()
    window.addEventListener('bach:omni-updated', refresh)
    return () => window.removeEventListener('bach:omni-updated', refresh)
  }, [])

  return (
    <div
      className="relative flex items-center"
      ref={anchorRef}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        data-header-popover-trigger="message-center"
        onClick={toggle}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only relative`}
        aria-label={
          badge.count > 0 ? `Mesaj Merkezi · ${badge.count} okunmamış` : 'Mesaj Merkezi'
        }
      >
        <span className="icon-wrap">
          <MessageCircle className="h-4 w-4 shrink-0" />
        </span>
        {badge.count > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ff3b30] px-1 text-[11px] font-black text-white shadow-[0_0_10px_rgba(255,59,48,0.55)]">
            {badge.count > 99 ? '99+' : badge.count}
          </span>
        ) : null}
      </button>

      {open &&
        createPortal(
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
            className="app-header-dropdown header-popover-panel message-center-dropdown overflow-hidden"
            data-header-popover="message-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="header-popover-head !px-3 !py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Mesaj Merkezi
              </p>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate('/mesajlar')
                }}
                className="shrink-0 px-1.5 py-1 text-[12px] font-normal text-[#2563eb] transition-transform hover:-translate-y-0.5"
              >
                Tümü
              </button>
            </div>

            <div className="message-center-body">
              <div className="message-center-channel-grid">
                {SOCIAL_DOCK_CHANNELS.map((channel) => (
                  <HeaderSocialIcon
                    key={channel.id}
                    channel={channel}
                    count={counts[channel.id] || 0}
                    onNavigate={() => setOpen(false)}
                  />
                ))}
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
