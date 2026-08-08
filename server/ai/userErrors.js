/**
 * Bach AI V2 — map OpenAI / proxy errors to user-facing Turkish copy.
 * Audit payloads stay metadata-only (no transcript / PII dumps).
 */

export function mapAiUserError(error, fallback = 'Bir sorun oluştu. Lütfen tekrar deneyin.') {
  const status = Number(error?.statusCode || error?.status || 0)
  const raw = String(error?.message || '').toLowerCase()

  if (status === 401 || status === 403) {
    return 'Bu işlem için yetkiniz yok veya oturumunuz geçersiz.'
  }
  if (status === 429 || raw.includes('rate') || raw.includes('yoğunluk')) {
    return 'Şu anda bağlantıda bir yoğunluk var. Tekrar deneyelim.'
  }
  if (status === 408 || raw.includes('timeout') || raw.includes('timed out')) {
    return 'Yanıt gecikti. Lütfen tekrar deneyin.'
  }
  if (status === 404) {
    return 'İstenen AI servisi bulunamadı.'
  }
  if (raw.includes('api key') || raw.includes('api_key')) {
    return 'AI servisi yapılandırılmamış. Yöneticinize danışın.'
  }
  if (raw.includes('permission') || raw.includes('yetki')) {
    return 'Bu işlem için paketinizin izni yok.'
  }
  if (status >= 500) {
    return 'Sunucu geçici olarak yanıt veremiyor. Kısa süre sonra tekrar deneyin.'
  }
  return error?.message || fallback
}

export function auditMetadataOnly({
  userId = null,
  companyId = null,
  action = 'unknown',
  success = false,
  errorCode = null,
  durationMs = 0,
  source = 'ai_v2',
} = {}) {
  return {
    timestamp: new Date().toISOString(),
    userId,
    companyId,
    source,
    module: 'bach_ai_v2',
    action,
    success: Boolean(success),
    durationMs,
    errorCode,
  }
}
