import { APP_VERSION, APP_BUILD, syncSeenVersion } from './appVersion'

const POLL_MS = 5 * 60 * 1000
const RELOAD_FLAG = 'bach-app-version-reloading'

/**
 * Sunucudaki app-version.json ile paketlenen sürüm/build karşılaştırır.
 * Farklıysa soft reload yapar (localStorage / üye verisi silinmez).
 */
export function installAppUpdateChecker() {
  if (typeof window === 'undefined') return () => {}

  syncSeenVersion(APP_VERSION, APP_BUILD)

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
      const remoteVersion = String(data?.version || '').trim()
      const remoteBuild = String(data?.build || data?.releasedAt || '').trim()
      if (!remoteVersion) return

      const versionChanged = remoteVersion !== APP_VERSION
      const buildChanged = Boolean(remoteBuild) && remoteBuild !== APP_BUILD
      if (!versionChanged && !buildChanged) return

      const reloadKey = `${remoteVersion}|${remoteBuild}`
      if (sessionStorage.getItem(RELOAD_FLAG) === reloadKey) return
      sessionStorage.setItem(RELOAD_FLAG, reloadKey)
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
