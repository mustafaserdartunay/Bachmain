const IDE_FLAG = 'bach-ide-webview'

/** Cursor / VS Code Simple Browser — `?ide=1` from open-system.sh */
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
