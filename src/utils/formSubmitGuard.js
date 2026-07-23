/**
 * Prevent Enter (and Space on focused CTAs) from auto-saving forms.
 * Saves only via pointer click on Kaydet/submit, or Ctrl/Cmd+S.
 * Search fields still accept Enter.
 */

const SAVE_LABEL_RE =
  /\b(kaydet|save|listeyi kaydet|projeyi kaydet|gideri kaydet|irsaliyeyi kaydet|transferi kaydet|depoyu kaydet|profili kaydet)\b/i

function isAuthPath() {
  return /^\/(giris|kayit|sifremi-unuttum|sifre-sifirla|eposta-dogrula)(\/|$)/.test(
    window.location.pathname,
  )
}

function isSearchField(el) {
  if (!(el instanceof HTMLElement)) return false
  if (el.closest('[data-allow-enter-submit]')) return true
  if (el.matches('input[type="search"], [role="searchbox"]')) return true
  if (el.classList?.contains('app-search-field')) return true
  const hay = [
    el.getAttribute('name'),
    el.id,
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    typeof el.className === 'string' ? el.className : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLocaleLowerCase('tr-TR')
  return /(^|[^a-zğüşıöç])(search|ara|filtre|filter|query)([^a-zğüşıöç]|$)/i.test(hay)
}

function isSaveControl(el) {
  if (!(el instanceof HTMLElement)) return false
  const control = el.closest('button, [type="submit"], [role="button"]')
  if (!(control instanceof HTMLElement)) return false
  if (control.matches('[data-allow-enter-submit]')) return false
  const type = (control.getAttribute('type') || '').toLowerCase()
  if (type === 'submit') return true
  if (control.classList.contains('btn-success')) return true
  const label = `${control.textContent || ''} ${control.getAttribute('aria-label') || ''}`
  return SAVE_LABEL_RE.test(label)
}

function findActiveSaveControl() {
  const scoped =
    (document.activeElement instanceof HTMLElement && document.activeElement.closest('form')) ||
    document.querySelector('form:focus-within')

  if (scoped instanceof HTMLFormElement) {
    const inForm = scoped.querySelector('button[type="submit"], input[type="submit"]')
    if (inForm) return inForm
  }

  return (
    document.querySelector('.btn-split button[type="submit"]') ||
    document.querySelector('button[type="submit"].btn-success') ||
    document.querySelector('button.btn-success')
  )
}

export function installFormSubmitGuard() {
  let allowByPointer = false
  let allowByShortcut = false

  const resetFlags = () => {
    allowByPointer = false
    allowByShortcut = false
  }

  const onPointerDown = (event) => {
    if (event.button != null && event.button !== 0) return
    if (isSaveControl(event.target)) allowByPointer = true
  }

  const onClickCapture = (event) => {
    if (isAuthPath()) return
    if (!isSaveControl(event.target)) return
    if (allowByPointer || allowByShortcut) {
      // setTimeout(0): submit activation runs in the same turn as click;
      // queueMicrotask would clear the flag before the form submit event.
      setTimeout(resetFlags, 0)
      return
    }
    event.preventDefault()
    event.stopImmediatePropagation()
  }

  const onSubmitCapture = (event) => {
    if (isAuthPath()) return

    if (allowByPointer || allowByShortcut) {
      setTimeout(resetFlags, 0)
      return
    }

    const form = event.target
    if (form instanceof HTMLFormElement && form.hasAttribute('data-allow-enter-submit')) return

    const active = document.activeElement
    if (active instanceof HTMLElement && isSearchField(active)) return

    const submitter = event.submitter
    if (submitter instanceof HTMLElement && isSearchField(submitter)) return

    event.preventDefault()
    event.stopImmediatePropagation()
  }

  const onKeyDown = (event) => {
    if (isAuthPath()) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
      }
      return
    }

    const key = event.key
    const isMod = event.ctrlKey || event.metaKey

    if (isMod && key.toLowerCase() === 's') {
      event.preventDefault()
      const control = findActiveSaveControl()
      if (!(control instanceof HTMLElement) || control.disabled) return
      allowByShortcut = true
      control.click()
      setTimeout(resetFlags, 0)
      return
    }

    if (key !== 'Enter' && key !== ' ') return

    const el = event.target
    if (!(el instanceof HTMLElement)) return

    if (key === 'Enter') {
      if (el.closest('textarea') || el.isContentEditable) return
      if (isSearchField(el)) return
      if (el.matches('input, select') && el.closest('form')) {
        event.preventDefault()
      }
    }

    if (isSaveControl(el) && (key === 'Enter' || key === ' ')) {
      event.preventDefault()
    }
  }

  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('click', onClickCapture, true)
  document.addEventListener('submit', onSubmitCapture, true)
  document.addEventListener('keydown', onKeyDown, true)

  return () => {
    document.removeEventListener('pointerdown', onPointerDown, true)
    document.removeEventListener('click', onClickCapture, true)
    document.removeEventListener('submit', onSubmitCapture, true)
    document.removeEventListener('keydown', onKeyDown, true)
  }
}
