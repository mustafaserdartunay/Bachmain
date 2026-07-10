import NumericInput from './NumericInput'
import { tryToForeign, formatFx } from '../../utils/productPricing'

export default function PriceFieldWithFx({
  label,
  tryValue,
  onChange = () => {},
  readOnly = false,
  highlight = false,
  rates,
  showFx = true,
}) {
  const usd = tryToForeign(tryValue, rates.USD)
  const eur = tryToForeign(tryValue, rates.EUR)

  return (
    <div>
      <label className="form-label">{label}</label>
      <NumericInput
        value={tryValue}
        onChange={onChange}
        suffix="₺"
        readOnly={readOnly}
        highlight={highlight}
        formatMode="price"
      />
      {showFx && tryValue > 0 && (
        <div className="flex gap-3 mt-1.5">
          <span className="text-[12px] text-gray-500">{formatFx(usd, 'USD')}</span>
          <span className="text-[12px] text-gray-500">{formatFx(eur, 'EUR')}</span>
        </div>
      )}
    </div>
  )
}

export function FxHint({ tryValue, rates }) {
  if (!tryValue || tryValue <= 0) return null
  const usd = tryToForeign(tryValue, rates.USD)
  const eur = tryToForeign(tryValue, rates.EUR)
  return (
    <div className="flex gap-3 mt-0.5">
      <span className="text-[12px] text-gray-500">{formatFx(usd, 'USD')}</span>
      <span className="text-[12px] text-gray-500">{formatFx(eur, 'EUR')}</span>
    </div>
  )
}
