/** Nilvera StatusCode / AnswerCode → Bachmain UI status. */

export const UI_STATUS = {
  DRAFT: 'DRAFT',
  PROCESSING: 'PROCESSING',
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED',
  ERROR: 'ERROR',
} as const

export type UiStatus = (typeof UI_STATUS)[keyof typeof UI_STATUS]

export const UI_STATUS_LABEL: Record<UiStatus, string> = {
  DRAFT: 'Taslak',
  PROCESSING: 'İşleniyor',
  SENT: 'Gönderildi',
  RECEIVED: 'Alındı',
  ACCEPTED: 'Kabul',
  REJECTED: 'Red',
  CANCELLED: 'İptal',
  ERROR: 'Hata',
}

export function mapNilveraStatus(input: {
  statusCode?: string | null
  answerCode?: string | null
  isCancel?: boolean | null
  direction?: string | null
}): UiStatus {
  if (input.isCancel) return UI_STATUS.CANCELLED
  const status = String(input.statusCode || '').toLowerCase()
  const answer = String(input.answerCode || '').toLowerCase()
  if (status === 'error') return UI_STATUS.ERROR
  if (answer === 'rejected') return UI_STATUS.REJECTED
  if (answer === 'approved' || answer === 'documentansweredautomatically') return UI_STATUS.ACCEPTED
  if (status === 'waiting' || answer === 'waitingforapproval') return UI_STATUS.PROCESSING
  if (status === 'succeed' || status === 'succeeded') {
    return input.direction === 'incoming' ? UI_STATUS.RECEIVED : UI_STATUS.SENT
  }
  return UI_STATUS.PROCESSING
}

export function extractNilveraMessages(body: unknown): string[] {
  if (!body) return []
  if (Array.isArray(body)) return body.map((item) => String(item)).filter(Boolean)
  if (typeof body === 'object') {
    const rec = body as Record<string, unknown>
    for (const key of ['Message', 'message', 'Detail', 'detail', 'Error', 'error', 'title']) {
      if (rec[key]) return [String(rec[key])]
    }
    if (Array.isArray(rec.errors)) return rec.errors.map((item) => String(item))
  }
  if (typeof body === 'string' && body.trim()) return [body.trim().slice(0, 400)]
  return []
}

export function userFacingNilveraError(httpStatus: number, body: unknown): string {
  if (httpStatus === 401) {
    return 'Nilvera API anahtarı geçersiz. Portal şifresi değil, API Tanımları’ndan üretilen anahtarı yapıştırın. TEST anahtarı yalnızca Test ortamında, canlı anahtar yalnızca Canlı ortamda çalışır.'
  }
  if (httpStatus === 403) {
    return 'API anahtarının Company / e-Fatura yetkisi yok. Nilvera Portal → API Tanımları’nda yetkileri açıp yeni anahtar üretin.'
  }
  if (httpStatus === 404) return 'Belge veya kayıt Nilvera üzerinde bulunamadı.'
  if (httpStatus === 409) {
    return 'Bu fatura daha önce gönderilmiş olabilir. Yinelenen gönderim engellendi.'
  }
  if (httpStatus === 422) {
    return 'Fatura bilgileri iş kurallarına uymuyor. Vergi numarası, satırlar ve tutarlar kontrol edilmelidir.'
  }
  if (httpStatus === 400) {
    const messages = extractNilveraMessages(body)
    if (messages.length) return `Fatura gönderilemedi. Nedeni: ${messages.slice(0, 3).join(' ')}`
    return 'Fatura gönderilemedi. Nedeni: Vergi numarası veya fatura bilgileri kontrol edilmelidir.'
  }
  return 'Nilvera servisine şu anda ulaşılamıyor. Lütfen tekrar deneyin.'
}
