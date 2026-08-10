import ProductionProcessStageBar from './ProductionProcessStageBar'

/**
 * Minimal process panel — horizontal stepper + photo strip / active gallery.
 * Kept as a thin wrapper so existing call sites keep working.
 */
export default function ProductionStageMiniCards({
  steps = [],
  stagePhotos = [],
  readOnly = false,
  onStageClick,
  onPhotosChange,
  showEditProcesses = true,
}) {
  return (
    <ProductionProcessStageBar
      steps={steps}
      stagePhotos={stagePhotos}
      readOnly={readOnly}
      onStageClick={onStageClick}
      onPhotosChange={onPhotosChange}
      showEditLink={showEditProcesses}
      showPhotoStrip
      showActiveGallery
    />
  )
}
