/**
 * Shared mail brand tokens — BACHMAIN design language.
 */
import { publicLogoUrl, LOGO_CONTENT_ID } from './mailAssets.mjs'

export const MAIL_BRAND = {
  name: 'BACHMAIN',
  slogan: 'Tüm Süreçler Tek Platformda',
  primary: '#0b1f3a',
  accent: '#2563EB',
  accentHover: '#1d4ed8',
  bg: '#f4f7fb',
  card: '#ffffff',
  muted: '#64748b',
  ink: '#0f172a',
  border: '#e2e8f0',
  success: '#059669',
  danger: '#e11d48',
  warning: '#d97706',
  /** Remote fallback (correct public asset path). */
  logoUrl: publicLogoUrl(),
  logoCid: LOGO_CONTENT_ID,
  /** Display size — source is 1024×125 (~8.19:1). */
  logoWidth: 220,
  logoHeight: 27,
  appUrl: () => process.env.APP_URL || process.env.CRM_URL || 'https://uygulama.bachmain.com',
  adminUrl: () => process.env.ADMIN_URL || 'https://yonetim.bachmain.com',
  webUrl: () => process.env.WEB_URL || 'https://bachmain.com',
  supportEmail: () => process.env.SUPPORT_EMAIL || 'destek@bachmain.com',
}

export function mailConfig() {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim()
  const from = String(process.env.EMAIL_FROM || 'BACHMAIN <noreply@bachmain.com>').trim()
  const replyTo =
    String(process.env.EMAIL_REPLY_TO || process.env.SUPPORT_EMAIL || '').trim() || undefined
  return {
    provider: 'resend',
    apiKey: apiKey || null,
    from,
    replyTo,
    enabled: Boolean(apiKey),
    appUrl: MAIL_BRAND.appUrl(),
    adminUrl: MAIL_BRAND.adminUrl(),
    webUrl: MAIL_BRAND.webUrl(),
  }
}
