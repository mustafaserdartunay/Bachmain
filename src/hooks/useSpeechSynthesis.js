import { useCallback } from 'react'

export default function useSpeechSynthesis({ lang = 'tr-TR' } = {}) {
  const speak = useCallback((text) => {
    if (!text || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = lang
    utterance.rate = 1
    window.speechSynthesis.speak(utterance)
  }, [lang])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  return { speak, stop, supported: Boolean(window.speechSynthesis) }
}
