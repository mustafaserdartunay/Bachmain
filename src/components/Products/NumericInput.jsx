import { useEffect, useState } from 'react'

export default function NumericInput({
  value,
  onChange,
  prefix,
  suffix,
  readOnly = false,
  highlight = false,
  className = '',
  placeholder = '0',
  formatMode = 'plain',
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)

  useEffect(() => {
    if (!focused) {
      const num = Number(value) || 0
      setText(num === 0 ? '' : String(num))
    }
  }, [value, focused])

  function handleChange(raw) {
    const v = raw.replace(/\./g, '').replace(',', '.')
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return
    setText(v)
    if (v === '' || v === '.') {
      onChange(0)
    } else {
      onChange(parseFloat(v) || 0)
    }
  }

  const inputClass = `${readOnly ? 'form-input-readonly' : 'form-input'} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''} ${highlight ? 'border-accent-orange/50 text-accent-orange font-semibold' : ''} ${className}`
  const displayValue = Number(value) === 0
    ? ''
    : formatMode === 'price'
      ? new Intl.NumberFormat('tr-TR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(value) || 0)
      : String(value)

  return (
    <div className="relative">
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          {prefix}
        </span>
      )}
      <input
        type="text"
        inputMode="decimal"
        readOnly={readOnly}
        placeholder={placeholder}
        value={focused ? text : displayValue}
        onFocus={() => {
          setFocused(true)
          const num = Number(value) || 0
          setText(num === 0 ? '' : String(num))
        }}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          setFocused(false)
          if (text === '' || text === '.') onChange(0)
        }}
        className={inputClass}
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
          {suffix}
        </span>
      )}
    </div>
  )
}
