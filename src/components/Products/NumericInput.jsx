import { useEffect, useState } from 'react'
import { formatPriceForCurrency, normalizeCurrency } from '../../utils/productPricing'

export default function NumericInput({
  value,
  onChange,
  prefix,
  suffix,
  suffixNode,
  readOnly = false,
  highlight = false,
  className = '',
  placeholder = '0',
  formatMode = 'plain',
  currency = 'TRY',
  maxLength,
  allowEmpty = false,
}) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const moneyCurrency = normalizeCurrency(currency)

  useEffect(() => {
    if (!focused) {
      if (allowEmpty && (value === '' || value == null)) {
        setText('')
        return
      }
      const num = Number(value) || 0
      setText(num === 0 ? '' : String(num))
    }
  }, [value, focused, allowEmpty])

  function handleChange(raw) {
    let v = raw
    if (moneyCurrency === 'USD') {
      v = raw.replace(/,/g, '')
    } else {
      // TRY / EUR: nokta binlik, virgül ondalık
      v = raw.replace(/\./g, '').replace(',', '.')
    }
    if (v !== '' && !/^\d*\.?\d*$/.test(v)) return
    if (maxLength && v.replace('.', '').length > maxLength) return
    setText(v)
    if (v === '' || v === '.') {
      onChange(0)
    } else {
      onChange(parseFloat(v) || 0)
    }
  }

  const hasSuffix = Boolean(suffixNode || suffix)
  const inputClass = `${readOnly ? 'form-input-readonly' : 'form-input'} ${prefix ? 'pl-8' : ''} ${hasSuffix ? 'pr-8' : ''} ${highlight ? 'border-accent-orange/50 text-accent-orange font-semibold' : ''} ${className}`
  const displayValue =
    allowEmpty && (value === '' || value == null)
      ? ''
      : Number(value) === 0
        ? ''
        : formatMode === 'price'
          ? formatPriceForCurrency(value, moneyCurrency)
          : String(value)

  return (
    <div className="relative inline-block w-full">
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
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
        maxLength={maxLength}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          setFocused(false)
          if (text === '' || text === '.') {
            if (!allowEmpty) onChange(0)
          }
        }}
        className={inputClass}
      />
      {suffixNode ||
        (suffix ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
            {suffix}
          </span>
        ) : null)}
    </div>
  )
}
