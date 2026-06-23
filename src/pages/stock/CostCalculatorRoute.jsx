import { Navigate } from 'react-router-dom'
import { isSectoralModuleEnabled } from '../../utils/sectoralSettings'
import ProductCostCalculatorPage from './ProductCostCalculatorPage'

export default function CostCalculatorRoute({ variant, moduleId }) {
  if (!isSectoralModuleEnabled('ambalaj', 'matbaa', moduleId)) {
    return <Navigate to="/stok/urunler" replace />
  }
  return <ProductCostCalculatorPage variant={variant} />
}

export function LegacyCostCalculatorRedirect() {
  if (isSectoralModuleEnabled('ambalaj', 'matbaa', 'baklavaCostCalculator')) {
    return <Navigate to="/stok/baklava-kutu-maliyet-hesaplama" replace />
  }
  return <Navigate to="/stok/urunler" replace />
}
