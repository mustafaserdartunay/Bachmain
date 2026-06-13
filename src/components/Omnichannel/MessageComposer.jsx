import { useRef, useState, useEffect } from 'react'
import { Mic, Paperclip, Send, Square } from 'lucide-react'
import { BTN_SUCCESS } from '../../utils/buttonStyles'

export default function MessageComposer({ onSend, disabled, suggestedText = '' }) {
  const [text, setText] = useState('')
  const [recording, setRecording] = useState(false)
  const fileRef = useRef(null)

  useEffect(() => {
    if (suggestedText) setText(suggestedText)
  }, [suggestedText])

  function handleSubmit(event) {
    event.preventDefault()
    if (!text.trim() || disabled) return
    onSend({ type: 'text', body: text.trim() })
    setText('')
  }

  function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file || disabled) return
    const reader = new FileReader()
    reader.onload = () => {
      const isImage = file.type.startsWith('image/')
      const isAudio = file.type.startsWith('audio/')
      onSend({
        type: isImage ? 'image' : isAudio ? 'audio' : 'file',
        body: isImage || isAudio ? '' : file.name,
        mediaUrl: String(reader.result),
        mediaName: file.name,
      })
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  function toggleRecording() {
    if (disabled) return
    if (recording) {
      setRecording(false)
      onSend({ type: 'audio', body: 'Sesli mesaj', duration: 12, mediaUrl: null })
      return
    }
    setRecording(true)
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-dark-500/45 bg-dark-800/95 p-3">
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="rounded-xl border border-dark-500/50 p-2.5 text-gray-400 transition-colors hover:bg-dark-700 hover:text-white disabled:opacity-40"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input ref={fileRef} type="file" className="hidden" onChange={handleFile} accept="image/*,audio/*,.pdf,.doc,.docx" />

        <button
          type="button"
          onClick={toggleRecording}
          disabled={disabled}
          className={`rounded-xl border p-2.5 transition-colors disabled:opacity-40 ${
            recording ? 'border-red-500/40 bg-red-500/15 text-red-300' : 'border-dark-500/50 text-gray-400 hover:bg-dark-700 hover:text-white'
          }`}
        >
          {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Mesaj yazın..."
          rows={1}
          disabled={disabled}
          className="form-input max-h-28 min-h-[42px] flex-1 resize-none py-2.5 text-sm"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSubmit(e)
            }
          }}
        />

        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className={`${BTN_SUCCESS} p-2.5 disabled:opacity-40`}
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
      {recording && <p className="mt-2 text-[11px] font-semibold text-red-300">Kayıt yapılıyor... Durdurmak için tekrar basın.</p>}
    </form>
  )
}
