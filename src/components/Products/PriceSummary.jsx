import { calcInclPrice, formatPrice, formatFx, formatTL, tryToForeign } from '../../utils/productPricing'

const toneClasses = {
  default: {
    label: 'text-gray-500',
    value: 'text-gray-300',
    valueBold: 'text-white',
  },
  cost: {
    label: 'text-red-400',
    value: 'text-red-400',
    valueBold: 'text-red-300',
  },
  margin: {
    label: 'text-blue-400',
    value: 'text-blue-400',
    valueBold: 'text-blue-300',
  },
  salesExcl: {
    label: 'text-emerald-400',
    value: 'text-emerald-400',
    valueBold: 'text-emerald-300',
  },
  salesIncl: {
    label: 'text-green-500',
    value: 'text-green-500',
    valueBold: 'text-green-400',
  },
  profit: {
    label: 'text-cyan-400',
    value: 'text-cyan-400',
    valueBold: 'text-cyan-300',
  },
  dealer: {
    label: 'text-accent-orange',
    value: 'text-accent-orange',
    valueBold: 'text-orange-300',
  },
  dealerProfit: {
    label: 'text-purple-400',
    value: 'text-purple-400',
    valueBold: 'text-purple-300',
  },
}

function MoneyValue({ tryValue, rates, bold = false, tone = 'default' }) {
  const usd = tryToForeign(tryValue, rates.USD)
  const eur = tryToForeign(tryValue, rates.EUR)
  const colors = toneClasses[tone] || toneClasses.default

  return (
    <div className="text-right">
      <span className={`text-sm ${bold ? `font-bold ${colors.valueBold}` : `font-semibold ${colors.value}`}`}>
        {formatTL(tryValue)}
      </span>
      {tryValue > 0 && (
        <div className="mt-0.5 flex justify-end gap-2">
          <span className="text-[9px] text-gray-600">{formatFx(usd, 'USD')}</span>
          <span className="text-[9px] text-gray-600">{formatFx(eur, 'EUR')}</span>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, children, tone = 'default', className = '' }) {
  const colors = toneClasses[tone] || toneClasses.default

  return (
    <div className={`rounded-2xl border border-dark-500/50 bg-dark-800/50 p-3 ${className}`}>
      <p className={`mb-2 text-xs font-semibold ${colors.label}`}>{label}</p>
      {children}
    </div>
  )
}

function PairCard({ label, leftLabel, leftValue, rightLabel, rightValue, rates, tone = 'default', rightTone = tone }) {
  const colors = toneClasses[tone] || toneClasses.default
  const rightColors = toneClasses[rightTone] || colors

  return (
    <div className="rounded-2xl border border-dark-500/50 bg-dark-800/40 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tone === 'dealer' ? 'bg-accent-orange' : tone === 'dealerProfit' ? 'bg-purple-400' : tone === 'profit' ? 'bg-cyan-400' : 'bg-emerald-400'}`} />
        <p className={`text-xs font-semibold ${colors.label}`}>{label}</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/35 p-2.5">
          <p className="mb-1 text-[10px] font-medium text-gray-500">{leftLabel}</p>
          <MoneyValue tryValue={leftValue} rates={rates} bold tone={tone} />
        </div>
        <div className="rounded-xl border border-dark-500/40 bg-dark-700/35 p-2.5">
          <p className={`mb-1 text-[10px] font-medium ${rightColors.label}`}>{rightLabel}</p>
          <MoneyValue tryValue={rightValue} rates={rates} bold tone={rightTone} />
        </div>
      </div>
    </div>
  )
}

export default function PriceSummary({ product, pricing, rates, loading }) {
  const costExcl = Number(product.costPrice) || 0
  const costIncl = calcInclPrice(costExcl, product.vatRate)
  const profitExcl = pricing.finalSalesPriceExcl - costExcl
  const profitIncl = pricing.finalSalesPriceIncl - costIncl
  const dealerProfitExcl = pricing.dealerSalesPriceExcl - costExcl
  const dealerProfitIncl = pricing.dealerSalesPriceIncl - costIncl
  const dealerProfitRateExcl = costExcl > 0 ? (dealerProfitExcl / costExcl) * 100 : 0
  const dealerProfitRateIncl = costIncl > 0 ? (dealerProfitIncl / costIncl) * 100 : 0

  return (
    <div className="card bg-gradient-to-br from-dark-700 to-dark-800">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">Fiyat Özeti</h3>
        {loading ? (
          <span className="text-[9px] text-gray-600">Kurlar yükleniyor...</span>
        ) : rates.updatedAt ? (
          <div className="text-right">
            <p className="text-[9px] text-gray-600">Canlı kur · {rates.updatedAt}</p>
            <p className="mt-0.5 text-[9px] text-gray-600">
              1 USD = {formatTL(rates.USD)} · 1 EUR = {formatTL(rates.EUR)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Maliyet" tone="cost" className="bg-red-500/10">
            <MoneyValue tryValue={product.costPrice} rates={rates} bold tone="cost" />
          </MetricCard>
          <MetricCard label="Kar Yüzdesi" tone="margin" className="bg-blue-500/10">
            <div className="text-right">
              <span className="text-lg font-bold text-blue-300">%{formatPrice(pricing.profitMargin)}</span>
            </div>
          </MetricCard>
        </div>

        <PairCard
          label="Kar"
          leftLabel="Vergi Hariç Kar"
          leftValue={profitExcl}
          rightLabel="Vergi Dahil Kar"
          rightValue={profitIncl}
          rates={rates}
          tone="profit"
        />
        <PairCard
          label="Satış Fiyatları"
          leftLabel="KDV Hariç Satış"
          leftValue={pricing.finalSalesPriceExcl}
          rightLabel="KDV Dahil Satış"
          rightValue={pricing.finalSalesPriceIncl}
          rates={rates}
          tone="salesExcl"
          rightTone="salesIncl"
        />
        <PairCard
          label="Bayi Satış Fiyatları"
          leftLabel="Bayi KDV Hariç"
          leftValue={pricing.dealerSalesPriceExcl}
          rightLabel="Bayi KDV Dahil"
          rightValue={pricing.dealerSalesPriceIncl}
          rates={rates}
          tone="dealer"
        />
        <PairCard
          label="Bayi Karları"
          leftLabel="Bayi Vergi Hariç Kar"
          leftValue={dealerProfitExcl}
          rightLabel="Bayi Vergi Dahil Kar"
          rightValue={dealerProfitIncl}
          rates={rates}
          tone="dealerProfit"
        />
        <div className="rounded-2xl border border-dark-500/50 bg-dark-800/40 p-3">
          <div className="mb-3 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400" />
            <p className="text-xs font-semibold text-purple-400">Bayiden Yaptığımız Kar Yüzdesi</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-dark-500/40 bg-dark-700/35 p-2.5">
              <p className="mb-1 text-[10px] font-medium text-gray-500">KDV Hariç Kar Yüzdesi</p>
              <div className="text-right">
                <span className="text-sm font-bold text-purple-300">%{formatPrice(dealerProfitRateExcl)}</span>
              </div>
            </div>
            <div className="rounded-xl border border-dark-500/40 bg-dark-700/35 p-2.5">
              <p className="mb-1 text-[10px] font-medium text-purple-400">KDV Dahil Kar Yüzdesi</p>
              <div className="text-right">
                <span className="text-sm font-bold text-purple-300">%{formatPrice(dealerProfitRateIncl)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
