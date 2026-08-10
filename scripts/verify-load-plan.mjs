import { readFileSync } from 'fs'
import { pathToFileURL } from 'url'
import { createRequire } from 'module'
import vm from 'vm'

const src = readFileSync(new URL('../src/utils/truckLoadCalc.js', import.meta.url), 'utf8')
const wrapped = src.replace(/export const /g, 'const ').replace(/export function /g, 'function ')
  .concat(`
globalThis.__OUT = { computeLoadPlan, TRUCK_PRESETS, GRID_MODULES };
`)
vm.runInThisContext(wrapped)
const { computeLoadPlan, TRUCK_PRESETS, GRID_MODULES } = globalThis.__OUT

const plan = computeLoadPlan(
  TRUCK_PRESETS.panelvan,
  GRID_MODULES.euro,
  [
    {
      id: '1',
      name: 'Europalet',
      qty: 2,
      L: 120,
      W: 80,
      H: 14,
      weight: 350,
      stackable: false,
      visualH: 150,
      colorIdx: 0,
    },
    {
      id: '2',
      name: 'Koli — Küçük',
      qty: 20,
      L: 40,
      W: 30,
      H: 30,
      weight: 8,
      stackable: true,
      colorIdx: 1,
    },
  ],
  { orientation: 'uzun' },
)

const ok = plan.totalWeight === 860 && plan.totalPieces === 22
console.log({
  totalWeight: plan.totalWeight,
  totalPieces: plan.totalPieces,
  slots: `${plan.totalSlotsUsed}/${plan.totalSlots}`,
  warnings: plan.warnings,
  ok,
})
if (!ok) process.exit(1)
