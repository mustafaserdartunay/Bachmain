/**
 * Shared mail brand tokens — BACHMAIN design language.
 */
export const MAIL_BRAND = {
  name: 'BACHMAIN',
  primary: '#0b1f3a',
  accent: '#2f6fed',
  accentHover: '#1d4ed8',
  bg: '#f4f6fa',
  card: '#ffffff',
  muted: '#64748b',
  ink: '#0f172a',
  success: '#059669',
  danger: '#e11d48',
  warning: '#d97706',
  logoUrl: 'https://bachmain.com/assets/bachmain-logo.png',
  appUrl: () => process.env.APP_URL || process.env.CRM_URL || 'https://uygulama.bachmain.com',
  adminUrl: () => process.env.ADMIN_URL || 'https://yonetim.bachmain.com',
  webUrl: () => process.env.WEB_URL || 'https://www.bachmain.com',
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
