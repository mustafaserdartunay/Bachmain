/**
 * AI Load Optimizer — shelf packing + weight balance heuristics
 * (Amazon/DHL-style operational packing, not ML inference)
 */

function overlaps(a, b) {
  return !(
    a.x + a.l <= b.x
    || b.x + b.l <= a.x
    || a.y + a.w <= b.y
    || b.y + b.w <= a.y
  )
}

/**
 * @param {object} vehicle inner mm + max kg
 * @param {Array} pallets { id, lengthMm, widthMm, heightMm, weightKg }
 * @returns {{ placements, balance, fillPct, unplaced }}
 */
export function optimizeTruckLoad(vehicle, pallets = []) {
  const L = Number(vehicle.innerLengthMm || 13600)
  const W = Number(vehicle.innerWidthMm || 2450)
  const H = Number(vehicle.innerHeightMm || 2700)
  const maxKg = Number(vehicle.maxWeightKg || 24000)

  const sorted = [...pallets].sort((a, b) => {
    const areaA = Number(a.lengthMm) * Number(a.widthMm)
    const areaB = Number(b.lengthMm) * Number(b.widthMm)
    if (areaB !== areaA) return areaB - areaA
    return Number(b.weightKg || 0) - Number(a.weightKg || 0)
  })

  const placements = []
  const unplaced = []
  let cursorX = 0
  let cursorY = 0
  let rowHeight = 0
  let totalKg = 0

  for (const pallet of sorted) {
    let pl = Number(pallet.lengthMm || 1200)
    let pw = Number(pallet.widthMm || 800)
    const ph = Number(pallet.heightMm || 144) + Number(pallet.loadHeightMm || 1000)
    const kg = Number(pallet.weightKg || 0)

    if (ph > H || kg + totalKg > maxKg) {
      unplaced.push({ id: pallet.id, reason: ph > H ? 'height' : 'weight' })
      continue
    }

    // Try normal then rotated
    const orientations = [
      { l: pl, w: pw },
      { l: pw, w: pl },
    ]

    let placed = null
    for (const ori of orientations) {
      if (ori.l > L || ori.w > W) continue

      // First-fit shelf
      let x = cursorX
      let y = cursorY
      if (y + ori.w > W) {
        x = cursorX + rowHeight > 0 ? cursorX + Math.max(rowHeight, 0) : x
        // advance to next column along length
        cursorX += rowHeight || ori.l
        cursorY = 0
        rowHeight = 0
        x = cursorX
        y = 0
      }

      if (x + ori.l > L) {
        // scan free gaps
        const candidate = findGap(placements, L, W, ori.l, ori.w)
        if (!candidate) continue
        placed = { ...candidate, l: ori.l, w: ori.w, rotated: ori.l !== pl }
        break
      }

      const trial = { x, y, l: ori.l, w: ori.w }
      const clash = placements.some((p) => overlaps(trial, p))
      if (clash) {
        const candidate = findGap(placements, L, W, ori.l, ori.w)
        if (!candidate) continue
        placed = { ...candidate, l: ori.l, w: ori.w, rotated: ori.l !== pl }
      } else {
        placed = { x, y, l: ori.l, w: ori.w, rotated: ori.l !== pl }
        cursorY = y + ori.w
        rowHeight = Math.max(rowHeight, ori.l)
      }
      break
    }

    if (!placed) {
      unplaced.push({ id: pallet.id, reason: 'space' })
      continue
    }

    totalKg += kg
    placements.push({
      palletId: pallet.id,
      xMm: Math.round(placed.x),
      yMm: Math.round(placed.y),
      zMm: 0,
      lengthMm: placed.l,
      widthMm: placed.w,
      heightMm: ph,
      rotated: Boolean(placed.rotated),
      weightKg: kg,
      customer: pallet.customer || '',
      address: pallet.address || '',
    })
  }

  const usedArea = placements.reduce((s, p) => s + p.lengthMm * p.widthMm, 0)
  const floorArea = L * W
  const fillPct = floorArea ? Math.round((usedArea / floorArea) * 100) : 0
  const balance = computeBalance(placements, L, W, totalKg)

  return { placements, balance, fillPct, unplaced, totalKg }
}

function findGap(placements, L, W, l, w) {
  const step = 50
  for (let x = 0; x <= L - l; x += step) {
    for (let y = 0; y <= W - w; y += step) {
      const trial = { x, y, l, w }
      if (!placements.some((p) => overlaps(trial, p))) return trial
    }
  }
  return null
}

export function computeBalance(placements, L, W, totalKg) {
  if (!placements.length || !totalKg) {
    return { leftPct: 50, rightPct: 50, frontPct: 50, rearPct: 50, score: 100, safe: true }
  }
  let left = 0
  let right = 0
  let front = 0
  let rear = 0
  const midY = W / 2
  const midX = L / 2
  for (const p of placements) {
    const cx = p.xMm + p.lengthMm / 2
    const cy = p.yMm + p.widthMm / 2
    const kg = Number(p.weightKg || 0)
    if (cy < midY) left += kg
    else right += kg
    if (cx < midX) front += kg // door/rear is high X typically — front=cab side
    else rear += kg
  }
  const lr = left + right || 1
  const fr = front + rear || 1
  const leftPct = Math.round((left / lr) * 100)
  const rightPct = 100 - leftPct
  const frontPct = Math.round((front / fr) * 100)
  const rearPct = 100 - frontPct
  const skew = Math.abs(leftPct - 50) + Math.abs(frontPct - 50)
  const score = Math.max(0, 100 - skew)
  return { leftPct, rightPct, frontPct, rearPct, score, safe: skew <= 30 }
}

/** Simple layer packing of boxes onto a pallet */
export function packBoxesOnPallet(pallet, boxes = []) {
  const maxL = Number(pallet.lengthMm || 1200)
  const maxW = Number(pallet.widthMm || 800)
  const maxH = Number(pallet.maxHeightMm || 2200) - Number(pallet.heightMm || 144)
  const maxKg = Number(pallet.maxKg || 1500)

  const layers = []
  let z = 0
  let totalKg = Number(pallet.tareKg || 0)
  const remaining = [...boxes]

  while (remaining.length && z < maxH) {
    const layer = []
    let x = 0
    let y = 0
    let rowH = 0
    let layerH = 0
    let i = 0
    while (i < remaining.length) {
      const box = remaining[i]
      const bl = Number(box.lengthMm || 400)
      const bw = Number(box.widthMm || 300)
      const bh = Number(box.heightMm || 300)
      const kg = Number(box.grossKg || box.weightKg || 1)
      if (totalKg + kg > maxKg || z + bh > maxH) {
        i += 1
        continue
      }
      if (x + bl > maxL) {
        x = 0
        y += rowH
        rowH = 0
      }
      if (y + bw > maxW) {
        i += 1
        continue
      }
      layer.push({ ...box, xMm: x, yMm: y, zMm: z })
      x += bl
      rowH = Math.max(rowH, bw)
      layerH = Math.max(layerH, bh)
      totalKg += kg
      remaining.splice(i, 1)
    }
    if (!layer.length) break
    layers.push({ zMm: z, heightMm: layerH, boxes: layer })
    z += layerH
  }

  return {
    layers,
    unplaced: remaining,
    totalKg,
    heightMm: z + Number(pallet.heightMm || 144),
    volumeM3: (maxL / 1000) * (maxW / 1000) * (z / 1000),
  }
}
