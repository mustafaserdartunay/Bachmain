export function interpolatePosition(from, to, t) {
  if (!from) return to
  if (!to) return from
  const k = Math.max(0, Math.min(1, t))
  const headingFrom = Number(from.heading) || 0
  const headingTo = Number(to.heading) || headingFrom
  let delta = headingTo - headingFrom
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return {
    ...to,
    lat: Number(from.lat) + (Number(to.lat) - Number(from.lat)) * k,
    lng: Number(from.lng) + (Number(to.lng) - Number(from.lng)) * k,
    heading: headingFrom + delta * k,
  }
}

export function createInterpolator() {
  const prev = new Map()
  return function next(entities, t = 1) {
    return entities.map((entity) => {
      const last = prev.get(entity.id)
      const mixed = interpolatePosition(last, entity, t)
      prev.set(entity.id, mixed)
      return mixed
    })
  }
}
