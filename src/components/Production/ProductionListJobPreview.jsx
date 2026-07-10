import ProductionLineItemCard from './ProductionLineItemCard'

export default function ProductionListJobPreview({
  job,
  lineItems = [],
  productionStages = [],
  activeMenu,
  setActiveMenu,
  lineItemActions,
}) {
  if (!lineItems.length) {
    return (
      <div className="border-t border-dark-500/40 bg-dark-900/30 px-4 py-3 text-xs text-gray-500">
        Bu kayıtta kalem bulunmuyor.
      </div>
    )
  }

  return (
    <div className="border-t border-dark-500/40 bg-gradient-to-b from-dark-900/50 to-dark-900/20 px-4 py-3">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[12px] font-black uppercase tracking-wider text-gray-500">
          Kalem önizleme · {lineItems.length} ürün
        </p>
        <p className="text-[12px] font-semibold text-gray-600">
          {productionStages.length} süreç
        </p>
      </div>
      <div className="space-y-3">
        {lineItems.map((lineItem, index) => (
          <ProductionLineItemCard
            key={lineItem.id}
            lineItem={lineItem}
            index={index}
            productionStages={productionStages}
            activeMenu={activeMenu}
            setActiveMenu={setActiveMenu}
            menuKeyPrefix={`${job.id}-${lineItem.id}`}
            onQuantityRowStageChange={(rowId, stageId) => lineItemActions.handleQuantityRowStageChange(lineItem, rowId, stageId)}
            onQuantityRowChange={(rowId, patch) => lineItemActions.handleLineQuantityRowChange(lineItem, rowId, patch)}
            onAddQuantityRow={(rowId) => lineItemActions.handleAddQuantityRow(lineItem, rowId)}
            onRemoveQuantityRow={(rowId) => lineItemActions.handleRemoveQuantityRow(lineItem, rowId)}
            onCloseProduction={(depoWarehouseKind) => lineItemActions.handleCloseProduction(lineItem, depoWarehouseKind)}
            onReopenProduction={() => lineItemActions.handleReopenProduction(lineItem)}
            onStagePhotosChange={(photos) => lineItemActions.handleStagePhotosChange(lineItem, photos)}
          />
        ))}
      </div>
    </div>
  )
}
