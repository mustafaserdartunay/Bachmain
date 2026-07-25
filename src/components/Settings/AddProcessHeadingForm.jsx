import { useState } from 'react'
import { Plus } from 'lucide-react'

/**
 * Ortak “yeni süreç başlığı” formu — LabelsSettings bölümlerinde kullanılır.
 */
export default function AddProcessHeadingForm({
  placeholder = 'Yeni süreç başlığı...',
  submitLabel = 'Süreç Ekle',
  onAdd,
  className = '',
}) {
  const [value, setValue] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const clean = value.trim()
    if (!clean) return
    onAdd?.(clean)
    setValue('')
  }

  return (
    <form
      className={`flex w-full min-w-0 items-center gap-2 ${className}`.trim()}
      onSubmit={handleSubmit}
    >
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        className="form-input box-border !h-10 !min-h-10 !max-h-10 min-w-0 flex-1 !py-0 !text-sm font-normal leading-none"
      />
      <button
        type="submit"
        className="ml-auto inline-flex h-10 min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-transparent px-3 text-xs font-extrabold tracking-wide text-[#3b82f6] transition-colors hover:text-[#60a5fa]"
      >
        <Plus className="h-4 w-4" /> {submitLabel}
      </button>
    </form>
  )
}
