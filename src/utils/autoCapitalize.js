// Tüm sistemde metin girişlerinde cümle başlarını otomatik büyük harf yapar:
// metnin ilk harfi ve nokta/ünlem/soru işaretinden sonraki ilk harf büyük yazılır.

const TEXT_INPUT_TYPES = new Set(['text', 'search', ''])
// Metnin ilk harfi ve nokta/ünlem/soru işareti + boşluktan sonraki ilk harf.
// Boşluk şartı sayesinde "x.com", "3.14" gibi değerler bozulmaz.
const SENTENCE_BOUNDARY = /(^\s*|[.!?]+\s+)(\p{L})/gu

export function toSentenceCase(value) {
  if (!value) return value
  // E-posta benzeri değerlere dokunma.
  if (value.includes('@')) return value
  return value.replace(SENTENCE_BOUNDARY, (_match, prefix, letter) => prefix + letter.toLocaleUpperCase('tr-TR'))
}

export function toTitleCaseTr(value) {
  if (!value) return value
  if (value.includes('@')) return value
  return String(value)
    .split(/(\s+)/)
    .map((part) => {
      if (!part.trim()) return part
      return part.charAt(0).toLocaleUpperCase('tr-TR') + part.slice(1).toLocaleLowerCase('tr-TR')
    })
    .join('')
}

function isEligible(element) {
  if (!element) return false
  const tag = element.tagName
  if (tag === 'TEXTAREA') return !isOptedOut(element)
  if (tag !== 'INPUT') return false
  const type = (element.getAttribute('type') || 'text').toLowerCase()
  if (!TEXT_INPUT_TYPES.has(type)) return false
  return !isOptedOut(element)
}

function isOptedOut(element) {
  if (element.dataset && element.dataset.noAutocap != null) return true
  const autocap = element.getAttribute('autocapitalize')
  return autocap === 'none' || autocap === 'off'
}

function setNativeValue(element, value) {
  const prototype = Object.getPrototypeOf(element)
  const prototypeSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set
  const instanceSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set
  if (prototypeSetter && prototypeSetter !== instanceSetter) {
    prototypeSetter.call(element, value)
  } else if (instanceSetter) {
    instanceSetter.call(element, value)
  } else {
    element.value = value
  }
}

function handleInput(event) {
  const element = event.target
  if (!isEligible(element)) return

  const original = element.value
  const transformed = toSentenceCase(original)
  if (transformed === original) return

  const start = element.selectionStart
  const end = element.selectionEnd

  setNativeValue(element, transformed)
  try {
    element.setSelectionRange(start, end)
  } catch {
    /* bazı input tipleri selection desteklemez */
  }

  // React'in kontrollü inputlarda yeni değeri görmesi için input olayını yeniden yay.
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

let installed = false

export function installAutoCapitalize() {
  if (installed || typeof document === 'undefined') return () => {}
  installed = true
  document.addEventListener('input', handleInput, true)
  return () => {
    document.removeEventListener('input', handleInput, true)
    installed = false
  }
}
