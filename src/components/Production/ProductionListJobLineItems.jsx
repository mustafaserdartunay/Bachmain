import ProductionJobFlowBadge from './ProductionJobFlowBadge'
import { ProductionLineItemStageTrackInline } from './ProductionStageFlow'
import { getLineMinimalStageSteps } from '../../utils/productionQuantityMetrics'

export default function ProductionListJobLineItems({ lineItems = [], productionStages = [] }) {
  if (!lineItems.length || !productionStages.length) return null

  return (
    <div className="border-t border-dark-500/40 bg-dark-900/25 px-3 py-2.5">
      <div className="space-y-0">
        {lineItems.map((lineItem, index) => {
          const steps = getLineMinimalStageSteps(lineItem, productionStages)

          return (
            <div
              key={lineItem.id}
              className="grid items-center gap-2 border-b border-dark-500/25 py-2.5 last:border-b-0 last:pb-0 first:pt-0 sm:gap-3"
              style={{ gridTemplateColumns: 'minmax(108px, 168px) minmax(0, 1fr) minmax(120px, 136px)' }}
            >
              <p className="min-w-0 truncate text-[13px] font-bold text-gray-200" title={lineItem.product || 'Ürün adı yok'}>
                <span className="mr-1 text-[12px] font-black tabular-nums text-gray-500">#{index + 1}</span>
                {lineItem.product || 'Ürün adı yok'}
              </p>
              <ProductionLineItemStageTrackInline steps={steps} theme="dark" />
              <ProductionJobFlowBadge lineItems={[lineItem]} jobStatus={lineItem.fulfillmentStatus} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
