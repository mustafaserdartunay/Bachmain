/**
 * Bach AI V2 — iOS foreground bridge contract (Swift shell).
 *
 * Native app: ios/Bachmain
 * Background mic / always-on wake: NOT supported (honest UX).
 *
 * Contract (JS ↔ WKWebView / native):
 * 1. Request mic permission via AVAudioSession (record).
 * 2. When app is active (foreground), native may start local wake detector.
 * 3. On wake → call POST /api/ai/realtime/session (via shared cookie/token) then
 *    open Realtime WebRTC/WS with ephemeral client_secret.
 * 4. On background / resign active → tear down session; show “Arka planda dinlemiyor”.
 * 5. Siri shortcuts = later phase; not required for V2 MVP.
 *
 * This module is the web-side message bridge stub.
 */

export const IOS_BRIDGE_EVENTS = {
  REQUEST_MIC: 'bach.ai.requestMic',
  MIC_STATUS: 'bach.ai.micStatus',
  WAKE: 'bach.ai.wake',
  SESSION_START: 'bach.ai.sessionStart',
  SESSION_END: 'bach.ai.sessionEnd',
  FOREGROUND: 'bach.ai.foreground',
  BACKGROUND: 'bach.ai.background',
}

export function isLikelyIosWebView() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPhone|iPad|iPod/i.test(ua) && !!(window.webkit?.messageHandlers)
}

export function postToIosNative(event, payload = {}) {
  const handler = window.webkit?.messageHandlers?.bachAi
  if (!handler?.postMessage) return false
  handler.postMessage({ event, ...payload })
  return true
}

export function subscribeIosBridge(handler) {
  if (typeof window === 'undefined') return () => {}
  const listener = (e) => {
    const detail = e?.detail || {}
    handler?.(detail.event || e.type, detail)
  }
  window.addEventListener('bach-ai-native', listener)
  return () => window.removeEventListener('bach-ai-native', listener)
}

/** Call when document visibility drops — always end Realtime. */
export function bindForegroundSessionGuard(onBackground) {
  if (typeof document === 'undefined') return () => {}
  const onVis = () => {
    if (document.visibilityState === 'hidden') onBackground?.()
  }
  document.addEventListener('visibilitychange', onVis)
  return () => document.removeEventListener('visibilitychange', onVis)
}
