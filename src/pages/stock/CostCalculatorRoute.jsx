import { Navigate } from 'react-router-dom'
import { isBaklavaCostCalculatorEnabled, isSectoralModuleEnabled } from '../../utils/sectoralSettings'
import ProductCostCalculatorPage from './ProductCostCalculatorPage'

/** Stok → Maliyet Hesaplama — header modülünden taşındı. */
export default function CostCalculatorRoute({ variant = 'baklava', moduleId = 'baklavaCostCalculator' }) {
  if (!isSectoralModuleEnabled('ambalaj', 'matbaa', moduleId)) {
    return <Navigate to="/ayarlar/sektorel/ambalaj" replace />
  }
  return <ProductCostCalculatorPage variant={variant} />
}

export function LegacyCostCalculatorRedirect() {
  if (isBaklavaCostCalculatorEnabled()) {
    return <Navigate to="/stok/maliyet-hesaplama" replace />
  }
  return <Navigate to="/ayarlar/sektorel/ambalaj" replace />
}
