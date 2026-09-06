const MAX_ACCURACY_M = 5000

export function validateLocationSample(input = {}) {
  const lat = Number(input.latitude ?? input.lat)
  const lng = Number(input.longitude ?? input.lng)
  const errors = []

  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.push('latitude')
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.push('longitude')
  if (!input.entityId && !input.userId) errors.push('entityId')
  if (!input.companyId && input.requireTenant !== false) errors.push('companyId')

  const accuracy = input.accuracy == null ? null : Number(input.accuracy)
  if (
    accuracy != null &&
    (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > MAX_ACCURACY_M)
  ) {
    errors.push('accuracy')
  }

  const timestamp = Date.parse(input.timestamp || input.recordedAt || '')
  if (input.timestamp && Number.isNaN(timestamp)) errors.push('timestamp')

  return {
    ok: errors.length === 0,
    errors,
    sample: errors.length
      ? null
      : {
          entityId: String(input.entityId || input.userId),
          entityKind: input.entityKind || 'personnel',
          companyId: input.companyId || null,
          latitude: lat,
          longitude: lng,
          accuracy: Number.isFinite(accuracy) ? accuracy : null,
          speed: Number.isFinite(Number(input.speed)) ? Number(input.speed) : null,
          heading: Number.isFinite(Number(input.heading)) ? Number(input.heading) : null,
          altitude: Number.isFinite(Number(input.altitude)) ? Number(input.altitude) : null,
          timestamp: Number.isNaN(timestamp)
            ? new Date().toISOString()
            : new Date(timestamp).toISOString(),
          batteryLevel: Number.isFinite(Number(input.batteryLevel))
            ? Number(input.batteryLevel)
            : null,
          isMoving: Boolean(input.isMoving ?? Number(input.speed) > 0.8),
          deviceId: input.deviceId || null,
          platform: input.platform || 'web',
          activity: input.activity || (Number(input.speed) > 0.8 ? 'moving' : 'still'),
          locationPermissionStatus: input.locationPermissionStatus || 'granted',
          idempotencyKey:
            input.idempotencyKey || `${input.entityId || input.userId}:${input.timestamp || ''}`,
        },
  }
}

export function isSameSample(a, b) {
  if (!a || !b) return false
  if (a.idempotencyKey && b.idempotencyKey && a.idempotencyKey === b.idempotencyKey) return true
  return (
    a.entityId === b.entityId &&
    a.timestamp === b.timestamp &&
    Number(a.latitude) === Number(b.latitude) &&
    Number(a.longitude) === Number(b.longitude)
  )
}

export function filterByCompany(rows, companyId) {
  if (!Array.isArray(rows)) return []
  if (!companyId) return rows
  return rows.filter((row) => !row.companyId || row.companyId === companyId)
}
