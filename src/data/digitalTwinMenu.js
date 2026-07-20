export const DIGITAL_TWIN_BASE = '/dijital-ikiz'

export const twinSubMenus = [
  { id: 'control', label: 'Control Room' },
  { id: 'factory', label: 'Factory View' },
  { id: 'warehouse', label: 'Warehouse View' },
  { id: 'truck', label: 'Truck View' },
  { id: 'pallet', label: 'Pallet View' },
  { id: 'machine', label: 'Machine View' },
  { id: 'production', label: 'Production View' },
  { id: 'orderFlow', label: 'Order Flow' },
  { id: 'customerFlow', label: 'Customer Flow' },
  { id: 'route', label: 'Route Center' },
  { id: 'live', label: 'Live Monitoring' },
  { id: 'whatif', label: 'What If' },
]

export function isDigitalTwinRoute(pathname) {
  return pathname === DIGITAL_TWIN_BASE || pathname.startsWith(`${DIGITAL_TWIN_BASE}/`)
}
