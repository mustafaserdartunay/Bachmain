const STORAGE_KEY = 'erlenbox-document-terms'

export const defaultDocumentTerms = [
  'Fiyatlara KDV dahil değildir.',
  'Teklif geçerlilik süresi belirtilen tarih ile sınırlıdır.',
  'Teslimat süresi sipariş onayı ve avans ödemesi sonrası başlar.',
  'Baskı onayı alındıktan sonra üretim revizyonu ayrıca fiyatlandırılır.',
  'Nakliye ve sevkiyat bedeli ayrıca hesaplanır.',
  'Ödeme koşulları sipariş onayı öncesinde karşılıklı mutabakat ile netleştirilir.',
]

export function loadSavedDocumentTerms() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) return parsed
    }
    const legacy = localStorage.getItem('erlenbox-quote-terms')
    if (legacy) {
      const parsed = JSON.parse(legacy)
      if (Array.isArray(parsed)) return parsed
    }
  } catch {
    return defaultDocumentTerms
  }
  return defaultDocumentTerms
}

export function saveSavedDocumentTerms(terms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(terms))
}
