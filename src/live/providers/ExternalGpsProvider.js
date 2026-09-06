export class ExternalGpsProvider {
  constructor(name = 'external') {
    this.name = name
  }

  async getCurrentLocation() {
    return null
  }

  async getHistory() {
    return []
  }

  subscribe() {
    return () => {}
  }

  unsubscribe() {}

  async getVehicleStatus() {
    return { provider: this.name, connected: false }
  }

  async getDeviceStatus() {
    return { provider: this.name, connected: false }
  }
}
