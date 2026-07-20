export const MES_BASE = '/mes'
export const MES_OPERATOR_PATH = '/mes/operator'

export const mesSubMenus = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'orders', label: 'Production Orders' },
  { id: 'planning', label: 'Production Planning' },
  { id: 'calendar', label: 'Production Calendar' },
  { id: 'capacity', label: 'Capacity Planning' },
  { id: 'machines', label: 'Machine Center' },
  { id: 'operators', label: 'Operator Center' },
  { id: 'shifts', label: 'Shift Management' },
  { id: 'bom', label: 'Recipe (BOM)' },
  { id: 'routing', label: 'Routing' },
  { id: 'workCenters', label: 'Work Centers' },
  { id: 'quality', label: 'Quality Center' },
  { id: 'packaging', label: 'Packaging Center' },
  { id: 'pallet', label: 'Pallet Center' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'energy', label: 'Energy Monitor' },
  { id: 'iot', label: 'IoT Center' },
  { id: 'reports', label: 'Reports' },
  { id: 'ai', label: 'AI Manufacturing' },
]

export function isMesRoute(pathname) {
  return pathname === MES_BASE || pathname.startsWith(`${MES_BASE}/`)
}
