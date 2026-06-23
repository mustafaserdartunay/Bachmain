import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import { ensureUserProfile, readUserProfile } from '../../utils/userProfile'
import { readCompanySettings } from '../../utils/companySettings'
import { cycleTheme, getStoredTheme, HEADER_CONTROL_BUTTON_CLASS, HEADER_SEARCH_INPUT_CLASS, THEME_MODES, THEME_TOGGLE_BUTTON_CLASS } from '../../utils/themeMode'
import { useExchangeRates } from '../../hooks/useExchangeRates'
import ThemeModeIcon from '../Common/ThemeModeIcon'
import NotificationDropdown from './NotificationDropdown'
import HeaderModuleDropdown from './HeaderModuleDropdown'

function formatClock(date) {
  const datePart = date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
  const weekday = date.toLocaleDateString('tr-TR', { weekday: 'long' })
  const time = date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `${datePart} ${weekday} - ${time}`
}

function formatMarketValue(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '-'
  return number.toLocaleString('tr-TR', {
    minimumFractionDigits: number >= 1000 ? 0 : 2,
    maximumFractionDigits: number >= 1000 ? 0 : 2,
  })
}

function MarketTicker({ rates }) {
  const items = [
    ['USD', rates.market?.USD],
    ['EUR', rates.market?.EUR],
    ['ALTIN', rates.market?.GOLD],
  ]
  const infoControlClass = `${HEADER_CONTROL_BUTTON_CLASS} h-9 min-h-9 max-h-9 self-center overflow-hidden rounded-lg px-0 text-[10px] font-black leading-none hover:bg-transparent`

  return (
    <div className="hidden min-w-0 items-center justify-end gap-2 xl:flex">
      {items.map(([label, value]) => (
        <div
          key={label}
          className={infoControlClass}
          title={`${label} alış satış`}
        >
          <span
            className="flex h-full items-center border-r border-dark-500/45 px-2.5 text-[11px] tracking-wide text-current"
          >
            {label}
          </span>
          <span className="flex h-full items-center gap-1 px-2 text-current">
            <span className="text-[9px] opacity-70">A</span>
            {formatMarketValue(value?.buy)}
          </span>
          <span className="flex h-full items-center gap-1 border-l border-dark-500/35 px-2 text-current">
            <span className="text-[9px] opacity-70">S</span>
            {formatMarketValue(value?.sell)}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function Header({ onMenuClick }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getStoredTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingLogout, setPendingLogout] = useState(false)
  const [profile, setProfile] = useState(() => ensureUserProfile())
  const [companyName, setCompanyName] = useState(() => readCompanySettings().companyName)
  const [now, setNow] = useState(() => new Date())
  const { rates } = useExchangeRates()

  const activeTheme = THEME_MODES[theme] || THEME_MODES.dark
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

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (!menuOpen) return undefined

    function closeMenu() {
      setMenuOpen(false)
      setPendingLogout(false)
    }

    document.addEventListener('click', closeMenu)
    return () => document.removeEventListener('click', closeMenu)
  }, [menuOpen])

  function handleLogout() {
    setMenuOpen(false)
    setPendingLogout(false)
    navigate('/')
  }

  const menuItems = [
    { label: 'Yeni Özellikler ve Duyurular', icon: Megaphone, path: '/duyurular' },
    { label: 'Profilim', icon: UserRound, path: '/profil' },
    { label: 'Yönetici Ayarları', icon: Settings, path: '/ayarlar' },
  ]

  return (
    <header className="app-header sticky top-0 z-40 flex min-h-14 shrink-0 items-center bg-dark-800 px-3 py-2 sm:px-4">
      <div className="flex w-full min-w-0 flex-wrap items-center justify-between gap-2 lg:flex-nowrap lg:gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dark-500/50 text-gray-300 transition-colors hover:bg-dark-700 lg:hidden"
          aria-label="Menüyü aç"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="order-3 flex w-full min-w-0 items-center gap-2 sm:order-none sm:max-w-[18rem] lg:max-w-[22rem] lg:shrink-0">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Arama yapın..."
              className={HEADER_SEARCH_INPUT_CLASS}
            />
          </div>
          <HeaderModuleDropdown />
        </div>

        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <div className={`${HEADER_CONTROL_BUTTON_CLASS} hidden h-9 min-h-9 max-h-9 self-center rounded-lg px-4 text-xs font-black leading-none text-white md:inline-flex`}>
            {formatClock(now)}
          </div>

          <MarketTicker rates={rates} />

          <button
            type="button"
            onClick={() => setTheme((current) => cycleTheme(current))}
            className={THEME_TOGGLE_BUTTON_CLASS}
            title={`Görünüm: ${activeTheme.label}`}
          >
            <ThemeModeIcon mode={theme} className="h-5 w-5 shrink-0" />
            <span className="truncate">{activeTheme.label}</span>
          </button>
          <NotificationDropdown />

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden h-6 w-px shrink-0 bg-dark-500/50 sm:block" aria-hidden="true" />

            <div className="relative flex items-center" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen((open) => !open)
                  setPendingLogout(false)
                }}
                className={`${HEADER_CONTROL_BUTTON_CLASS} gap-1.5 px-2`}
              >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
              {profile.avatarDataUrl ? (
                <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden leading-none sm:block">
              <p className="text-xs font-semibold">{profile.displayName}</p>
              <p className="mt-0.5 text-[10px] opacity-80">{companyName || profile.companyName}</p>
            </div>
                <ChevronDown className={`h-3.5 w-3.5 shrink-0 opacity-80 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-12 z-50 w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-2xl border border-dark-500 bg-dark-800 shadow-2xl shadow-black/35">
              <div className="border-b border-dark-500/55 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-black text-white">
                    {profile.avatarDataUrl ? (
                      <img src={profile.avatarDataUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-white">{profile.displayName}</p>
                    <p className="truncate text-xs font-semibold text-slate-950">{companyName || profile.companyName}</p>
                    <p className="mt-1 text-[11px] font-black uppercase tracking-wide text-blue-300">Müşteri No: {profile.tenantCode}</p>
                  </div>
                </div>
              </div>

              {pendingLogout ? (
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white">Çıkış yapılsın mı?</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-slate-950">Oturumunuz kapatılacak ve ana sayfaya yönlendirileceksiniz.</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setPendingLogout(false)}
                      className="rounded-xl border border-dark-500/60 bg-dark-700 px-3 py-2 text-xs font-bold text-gray-200 transition-colors hover:bg-dark-600"
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-xl bg-red-500 px-3 py-2 text-xs font-black text-white transition-colors hover:bg-red-400"
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
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-950 transition-colors hover:bg-blue-500/10 hover:text-blue-700"
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-dark-500/55 p-2">
                    <button
                      type="button"
                      onClick={() => setPendingLogout(true)}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-red-300 transition-colors hover:bg-red-500/10 hover:text-red-200"
                    >
                      <LogOut className="h-4 w-4 shrink-0" />
                      <span>Çıkış Yap</span>
                    </button>
                  </div>
                </>
              )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
