/**
 * Conversion analytics scaffolding — GA4 / GTM / Meta / LinkedIn / Clarity / Hotjar.
 * Set env vars in production; no-ops when unset.
 */

export type TrackPayload = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>
    gtag?: (...args: unknown[]) => void
    fbq?: (...args: unknown[]) => void
    lintrk?: (...args: unknown[]) => void
    clarity?: (...args: unknown[]) => void
    hj?: (...args: unknown[]) => void
  }
}

export function trackCta(event: string, payload: TrackPayload = {}) {
  if (typeof window === 'undefined') return
  const detail = { event, ...payload, ts: Date.now() }

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event, ...payload })

  if (typeof window.gtag === 'function') {
    window.gtag('event', event, payload)
  }
  if (typeof window.fbq === 'function') {
    window.fbq('trackCustom', event, payload)
  }
  if (typeof window.lintrk === 'function') {
    window.lintrk('track', { conversion_id: event })
  }
  if (typeof window.clarity === 'function') {
    window.clarity('event', event)
  }
  if (typeof window.hj === 'function') {
    window.hj('event', event)
  }

  window.dispatchEvent(new CustomEvent('bachmain:cta', { detail }))
}

export function trackPageView(path: string) {
  if (typeof window === 'undefined') return
  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({ event: 'page_view', page_path: path })
  if (typeof window.gtag === 'function') {
    window.gtag('event', 'page_view', { page_path: path })
  }
}
