import { APP_VERSION, syncSeenVersion } from './appVersion'

const POLL_MS = 5 * 60 * 1000
const RELOAD_FLAG = 'bach-app-version-reloading'

/**
 * Sunucudaki app-version.json ile paketlenen sürümü karşılaştırır.
 * Farklıysa soft reload yapar (localStorage / üye verisi silinmez).
 */
export function installAppUpdateChecker() {
  if (typeof window === 'undefined') return () => {}

  syncSeenVersion(APP_VERSION)

  let cancelled = false
  let timer = null

  async function check() {
    if (cancelled || document.hidden) return
    try {
      const res = await fetch(`/app-version.json?_=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      })
      if (!res.ok) return
      const data = await res.json()
      const remote = String(data?.version || '').trim()
      if (!remote || remote === APP_VERSION) return

      // Aynı yenileme döngüsünü engelle
      if (sessionStorage.getItem(RELOAD_FLAG) === remote) return
      sessionStorage.setItem(RELOAD_FLAG, remote)
      window.location.reload()
    } catch {
      /* ağ yoksa sessizce geç */
    }
  }

  function onVisible() {
    if (!document.hidden) void check()
  }

  void check()
  timer = window.setInterval(() => void check(), POLL_MS)
  document.addEventListener('visibilitychange', onVisible)
  window.addEventListener('focus', onVisible)

  return () => {
    cancelled = true
    if (timer) window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisible)
    window.removeEventListener('focus', onVisible)
  }
}
