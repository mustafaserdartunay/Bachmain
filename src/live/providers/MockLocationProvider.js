import { buildDemoEntities } from '../demo.js'

export class MockLocationProvider {
  constructor() {
    this.name = 'mock'
    this.timer = null
    this.listeners = new Set()
  }

  async getCurrentLocation(entityId) {
    return buildDemoEntities().find((row) => row.id === entityId) || null
  }

  async getHistory() {
    return []
  }

  subscribe(listener) {
    this.listeners.add(listener)
    listener(buildDemoEntities())
    if (!this.timer) {
      this.timer = setInterval(() => {
        const rows = buildDemoEntities()
        this.listeners.forEach((fn) => fn(rows))
      }, 4000)
    }
    return () => this.unsubscribe(listener)
  }

  unsubscribe(listener) {
    this.listeners.delete(listener)
    if (!this.listeners.size && this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async getVehicleStatus() {
    return { provider: 'mock', connected: true }
  }

  async getDeviceStatus() {
    return { provider: 'mock', connected: true }
  }
}
