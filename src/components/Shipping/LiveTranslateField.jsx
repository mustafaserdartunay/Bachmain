import { useEffect, useState } from 'react'
import { Languages } from 'lucide-react'
import { translateLive } from '../../utils/shippingI18n'

export default function LiveTranslateField({
  label,
  value,
  onChange,
  targetLang,
  placeholder,
  multiline = false,
}) {
  const [preview, setPreview] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setPreview(translateLive(value, targetLang))
    }, 180)
    return () => clearTimeout(timer)
  }, [value, targetLang])

  const Input = multiline ? 'textarea' : 'input'

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-white">{label}</label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`form-input ${multiline ? 'min-h-20 resize-none' : ''}`}
      />
      {targetLang !== 'tr' && value && preview !== value && (
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-blue-400/20 bg-blue-500/10 px-3 py-2 text-xs text-blue-200">
          <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{preview}</span>
        </div>
      )}
    </div>
  )
}
