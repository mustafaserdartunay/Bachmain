import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  ChevronDown,
  Megaphone,
  UserRound,
  Settings,
  LogOut,
  Trash2,
} from 'lucide-react'
import { ensureUserProfile, readUserProfile } from '../../utils/userProfile'
import { readCompanySettings } from '../../utils/companySettings'
import { cycleTheme, getStoredTheme, HEADER_CONTROL_BUTTON_CLASS, HEADER_SEARCH_INPUT_CLASS, THEME_MODES, THEME_TOGGLE_BUTTON_CLASS } from '../../utils/themeMode'
import ThemeModeIcon from '../Common/ThemeModeIcon'
import NotificationDropdown from './NotificationDropdown'

export default function Header() {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(getStoredTheme)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingLogout, setPendingLogout] = useState(false)
  const [profile, setProfile] = useState(() => ensureUserProfile())
  const [companyName, setCompanyName] = useState(() => readCompanySettings().companyName)

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
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center border-b border-dark-500/50 bg-dark-800 px-4">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex w-full max-w-[14rem] shrink-0 items-center">
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Arama yapın..."
              className={HEADER_SEARCH_INPUT_CLASS}
            />
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
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

          <div className="flex items-center gap-4">
            <div className="h-6 w-px shrink-0 bg-dark-500/50" aria-hidden="true" />

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
                <div className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-dark-500 bg-dark-800 shadow-2xl shadow-black/35">
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
                    <p className="truncate text-xs font-semibold text-gray-500">{companyName || profile.companyName}</p>
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
                      <p className="mt-0.5 text-[11px] font-medium text-gray-500">Oturumunuz kapatılacak ve ana sayfaya yönlendirileceksiniz.</p>
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
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-black uppercase tracking-wide text-gray-300 transition-colors hover:bg-blue-500/10 hover:text-white"
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
                      <span>Çıkış</span>
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
