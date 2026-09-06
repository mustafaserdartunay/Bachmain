export function watchFieldPosition(onFix, { movingMs = 8000, stillMs = 45000 } = {}) {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    onFix(null, new Error('GPS desteklenmiyor'))
    return () => {}
  }

  let last = null
  let watchId = null
  let interval = movingMs

  function handle(position) {
    const speed = Number(position.coords.speed) || 0
    const sample = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed,
      heading: position.coords.heading,
      altitude: position.coords.altitude,
      timestamp: new Date(position.timestamp || Date.now()).toISOString(),
      isMoving: speed > 0.8,
      platform: 'web',
      activity: speed > 0.8 ? 'moving' : 'still',
      locationPermissionStatus: 'granted',
    }
    last = sample
    interval = sample.isMoving ? movingMs : stillMs
    onFix(sample, null)
  }

  function start() {
    if (watchId != null) navigator.geolocation.clearWatch(watchId)
    watchId = navigator.geolocation.watchPosition(handle, (error) => onFix(last, error), {
      enableHighAccuracy: true,
      maximumAge: interval,
      timeout: 15000,
    })
  }

  start()
  return () => {
    if (watchId != null) navigator.geolocation.clearWatch(watchId)
  }
}
