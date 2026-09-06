import { appendGpsLog, getGpsLogs } from '../../utils/pdksStore'
import { LIVE_EVENT } from '../constants.js'
import { historyForEntity, latestByEntity, upsertLiveLocation } from '../store.js'
import { enqueueOfflineSample, flushOfflineQueue } from '../offlineQueue.js'
import { validateLocationSample } from '../validateLocation.js'

export class BachmainMobileProvider {
  constructor() {
    this.name = 'bachmain-mobile'
    this.listeners = new Set()
  }

  async getCurrentLocation(entityId) {
    return latestByEntity(entityId)
  }

  async getHistory(entityId, options) {
    const live = historyForEntity(entityId, options)
    if (live.length) return live
    return getGpsLogs(entityId).map((log) => ({
      entityId: log.employeeId,
      latitude: log.lat,
      longitude: log.lng,
      timestamp: log.createdAt,
      source: log.source,
    }))
  }

  subscribe(listener) {
    this.listeners.add(listener)
    const onEvent = () => listener([])
    window.addEventListener(LIVE_EVENT, onEvent)
    window.addEventListener('bach:pdks-updated', onEvent)
    return () => {
      this.listeners.delete(listener)
      window.removeEventListener(LIVE_EVENT, onEvent)
      window.removeEventListener('bach:pdks-updated', onEvent)
    }
  }

  unsubscribe() {}

  async ingest(input) {
    const checked = validateLocationSample({ ...input, requireTenant: false })
    if (!checked.ok) throw new Error(`INVALID_LOCATION:${checked.errors.join(',')}`)
    const sample = checked.sample
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      await enqueueOfflineSample(sample)
      return { queued: true, sample }
    }
    upsertLiveLocation(sample)
    if (sample.entityKind === 'personnel') {
      appendGpsLog({
        employeeId: sample.entityId,
        lat: sample.latitude,
        lng: sample.longitude,
        source: 'live-track',
      })
    }
    return { queued: false, sample }
  }

  async flush() {
    return flushOfflineQueue((row) => this.ingest({ ...row, fromQueue: true }))
  }

  async getVehicleStatus() {
    return { provider: this.name, connected: true }
  }

  async getDeviceStatus() {
    return { provider: this.name, connected: true }
  }
}
