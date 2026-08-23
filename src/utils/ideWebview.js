const IDE_FLAG = 'bach-ide-webview'

/**
 * Cursor / VS Code Simple Browser (in-IDE Chromium).
 * `?ide=1` is set by workspace/scripts/open-system.sh — the reliable signal.
 */
export function isIdeWebview() {
  if (typeof window === 'undefined') return false
  try {
    const q = new URLSearchParams(window.location.search)
    if (q.get('ide') === '1') {
      sessionStorage.setItem(IDE_FLAG, '1')
      return true
    }
    if (sessionStorage.getItem(IDE_FLAG) === '1') return true
  } catch {
    // private mode / blocked storage
  }
  const ua = navigator.userAgent || ''
  return /Electron/i.test(ua) && /Cursor|VSCode|Code\//i.test(ua)
}
