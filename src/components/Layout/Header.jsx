import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Menu,
  Megaphone,
  UserRound,
  Settings,
  LogOut,
  Trash2,
  GraduationCap,
  ShoppingBag,
  Package,
  LayoutGrid,
} from 'lucide-react'
import { ensureUserProfile, readUserProfile } from '../../utils/userProfile'
import { readCompanySettings } from '../../utils/companySettings'
import { useAuth } from '../../auth/AuthContext'
import { HEADER_CONTROL_BUTTON_CLASS, HEADER_SEARCH_INPUT_CLASS } from '../../utils/themeMode'
import { isLocalDevHost, redirectToMarketingLogin } from '../../utils/marketingLogin'
import NotificationDropdown from './NotificationDropdown'
import AppearanceToggle from './AppearanceToggle'
import HeaderMessageCenter from './HeaderMessageCenter'
import HeaderNotebook from './HeaderNotebook'
import HeaderCalendar from './HeaderCalendar'
import HeaderAgendaSwitch from './HeaderAgendaSwitch'
import HeaderAiAssistant from './HeaderAiAssistant'
import OrgSwitcher from './OrgSwitcher'
import { useAnchoredPortal } from '../../hooks/useAnchoredPortal'
import { HeaderPopoverProvider, useHeaderPopover } from '../../hooks/useHeaderPopover'

function useCompactHeader() {
  const [compact, setCompact] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 1279px)').matches,
  )

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)')
    const sync = () => setCompact(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  return compact
}

function MobileToolItem({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-1 py-2 text-center">
      {children}
      <span className="w-full truncate text-[10px] font-semibold text-[var(--muted)]">{label}</span>
    </div>
  )
}

function MobileHeaderTools({ onNavigate }) {
  const [open, setOpen] = useState(false)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(open, {
    align: 'right',
    matchWidth: false,
    width: 304,
    offset: 8,
  })

  useEffect(() => {
    if (!open) return undefined
    function closeOnOutsideClick(event) {
      if (anchorRef.current?.contains(event.target) || menuRef.current?.contains(event.target))
        return
      if (event.target.closest?.('[data-header-popover]')) return
      setOpen(false)
    }
    document.addEventListener('mousedown', closeOnOutsideClick)
    return () => document.removeEventListener('mousedown', closeOnOutsideClick)
  }, [anchorRef, menuRef, open])

  return (
    <div ref={anchorRef} className="relative flex shrink-0 items-center">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only`}
        aria-label="Hızlı araçlar"
        aria-expanded={open}
        title="Hızlı araçlar"
      >
        <span className="icon-wrap">
          <LayoutGrid className="h-4 w-4" />
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
              className="app-header-dropdown w-[min(19rem,calc(100vw-1rem))] overflow-visible p-2"
              data-mobile-header-tools="true"
            >
              <p className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                Hızlı Araçlar
              </p>
              <div className="grid grid-cols-3 gap-1">
                <MobileToolItem label="Firma">
                  <OrgSwitcher />
                </MobileToolItem>
                <MobileToolItem label="Mesajlar">
                  <HeaderMessageCenter />
                </MobileToolItem>
                <MobileToolItem label="Ajanda">
                  <HeaderAgendaSwitch />
                </MobileToolItem>
                <MobileToolItem label="Asistan">
                  <HeaderAiAssistant />
                </MobileToolItem>
                <MobileToolItem label="Görünüm">
                  <AppearanceToggle />
                </MobileToolItem>
                <MobileToolItem label="POS">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onNavigate('/shopping')
                    }}
                    className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only`}
                    aria-label="POS"
                    title="POS / Shopping"
                  >
                    <span className="icon-wrap">
                      <ShoppingBag className="h-4 w-4 shrink-0" />
                    </span>
                  </button>
                </MobileToolItem>
                <MobileToolItem label="Bildirimler">
                  <NotificationDropdown />
                </MobileToolItem>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default function Header({ onMenuClick }) {
  return (
    <header className="app-header-banner sticky top-[var(--shell-gap)] z-40 flex h-[var(--ds-header-h,4.5rem)] min-h-[var(--ds-header-h,4.5rem)] shrink-0 items-center px-4 py-2 sm:px-6">
      <HeaderPopoverProvider>
        <HeaderBar onMenuClick={onMenuClick} />
      </HeaderPopoverProvider>
    </header>
  )
}

function HeaderBar({ onMenuClick }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const compactHeader = useCompactHeader()
  const { open: menuOpen, setOpen: setMenuOpen, toggle: toggleMenu } = useHeaderPopover('user-menu')
  const [pendingLogout, setPendingLogout] = useState(false)
  const [profile, setProfile] = useState(() => ensureUserProfile())
  const [companyName, setCompanyName] = useState(() => readCompanySettings().companyName)
  const {
    anchorRef,
    menuRef,
    style: menuStyle,
  } = useAnchoredPortal(menuOpen, {
    align: 'center',
    matchWidth: false,
    width: 320,
    offset: 8,
  })

  const initials = profile.displayName?.slice(0, 1)?.toUpperCase() || 'Y'

  useEffect(() => {
    function syncProfile() {
      setProfile(readUserProfile() || ensureUserProfile())
    }
    function syncCompany() {
      setCompanyName(readCompanySettings().companyName)
    }
    window.addEventListener('erlenbox:user-profile-updated', syncProfile)
    window.addEventListener('erlenbox:company-settings-updated', syncCompany)
    return () => {
      window.removeEventListener('erlenbox:user-profile-updated', syncProfile)
      window.removeEventListener('erlenbox:company-settings-updated', syncCompany)
    }
  }, [])

  async function handleLogout() {
    setMenuOpen(false)
    setPendingLogout(false)
    await logout()
    if (isLocalDevHost()) {
      navigate('/giris', { replace: true })
      return
    }
    redirectToMarketingLogin()
  }

  const menuItems = [
    { label: 'Yeni Özellikler ve Duyurular', icon: Megaphone, path: '/duyurular' },
    { label: 'Eğitim', icon: GraduationCap, path: '/egitim' },
    { label: 'Paketler', icon: Package, path: '/paketler' },
    { label: 'Profilim', icon: UserRound, path: '/profil' },
    { label: 'Yönetici Ayarları', icon: Settings, path: '/ayarlar' },
  ]

  return (
    <div className="flex w-full min-w-0 flex-nowrap items-center justify-between gap-1.5 lg:gap-2">
      <div className="flex min-w-0 flex-1 items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={onMenuClick}
          className="icon-btn shrink-0 lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="relative min-w-0 flex-1 sm:max-w-[18rem] lg:max-w-[22rem]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input type="text" placeholder="Ara..." className={HEADER_SEARCH_INPUT_CLASS} />
        </div>
        {!compactHeader ? (
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <OrgSwitcher />
            <HeaderMessageCenter />
            <HeaderAgendaSwitch />
            <HeaderNotebook hideTrigger />
            <HeaderCalendar hideTrigger />
            <HeaderAiAssistant />
            <AppearanceToggle />
          </div>
        ) : null}
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
        {compactHeader ? (
          <>
            <MobileHeaderTools onNavigate={navigate} />
            <HeaderNotebook hideTrigger />
            <HeaderCalendar hideTrigger />
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => navigate('/shopping')}
              className={`${HEADER_CONTROL_BUTTON_CLASS} icon-only`}
              aria-label="POS"
              title="POS / Shopping"
            >
              <span className="icon-wrap">
                <ShoppingBag className="h-4 w-4 shrink-0" />
              </span>
            </button>
            <NotificationDropdown />
          </>
        )}

        <div className="flex items-center gap-1 sm:gap-1.5">
          <div
            className="hidden h-6 w-px shrink-0 bg-[rgba(140,145,165,0.25)] sm:block"
            aria-hidden="true"
          />

          <div
            className="relative flex items-center"
            ref={anchorRef}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              data-header-popover-trigger="user-menu"
              onClick={() => {
                toggleMenu()
                setPendingLogout(false)
              }}
              className={`${HEADER_CONTROL_BUTTON_CLASS} !min-h-0 !px-1 !py-1`}
            >
              <div className="avatar-ring">
                <div className="avatar-inner">
                  {profile.avatarDataUrl ? (
                    <img
                      src={profile.avatarDataUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>
              </div>
              <div className={compactHeader ? 'hidden' : 'hidden text-left leading-none sm:block'}>
                <p className="text-xs font-extrabold text-[var(--ink)]">{profile.displayName}</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[var(--muted)]">
                  {companyName || profile.companyName}
                </p>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-[var(--muted)] transition-transform ${menuOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {menuOpen &&
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
                  className="app-header-dropdown w-[min(20rem,calc(100vw-1rem))] overflow-hidden"
                  data-header-popover="user-menu"
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="border-b border-[rgba(140,145,165,0.14)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="avatar-ring">
                        <div className="avatar-inner !h-12 !w-12 !rounded-2xl text-sm">
                          {profile.avatarDataUrl ? (
                            <img
                              src={profile.avatarDataUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            initials
                          )}
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-[var(--ink)]">
                          {profile.displayName}
                        </p>
                        <p className="truncate text-xs font-semibold text-[var(--muted)]">
                          {companyName || profile.companyName}
                        </p>
                        <p className="mt-1 text-[13px] font-bold uppercase tracking-wide text-[var(--purple2)]">
                          Müşteri No: {profile.tenantCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {pendingLogout ? (
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(255,94,98,0.14)] text-[#e0384c]">
                          <Trash2 className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[var(--ink)]">
                            Çıkış yapılsın mı?
                          </p>
                          <p className="mt-0.5 text-[13px] font-semibold text-[var(--muted)]">
                            Oturumunuz kapatılacak ve ana sayfaya yönlendirileceksiniz.
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setPendingLogout(false)}
                          className="btn-cancel px-3 text-xs"
                        >
                          Vazgeç
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="btn-primary px-3 py-2 text-xs"
                          style={{ background: 'linear-gradient(135deg,#FF8A65,#E0384C)' }}
                        >
                          Evet, Çık
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="p-2">
                        {menuItems.map(({ label, icon: Icon, path }) => (
                          <button
                            key={label}
                            type="button"
                            onClick={() => {
                              setMenuOpen(false)
                              navigate(path)
                            }}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-[var(--ink)] transition-colors hover:bg-white/55"
                          >
                            <Icon className="h-4 w-4 shrink-0 text-[var(--muted)]" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-[rgba(140,145,165,0.14)] p-2">
                        <button
                          type="button"
                          onClick={() => setPendingLogout(true)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-bold text-[#e0384c] transition-colors hover:bg-[rgba(255,94,98,0.1)]"
                        >
                          <LogOut className="h-4 w-4 shrink-0" />
                          <span>Çıkış Yap</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>,
                document.body,
              )}
          </div>
        </div>
      </div>
    </div>
  )
}
