import { BachmainMobileProvider } from './BachmainMobileProvider.js'
import { ExternalGpsProvider } from './ExternalGpsProvider.js'
import { MockLocationProvider } from './MockLocationProvider.js'

export function createLocationProvider({ mock = false, externalName } = {}) {
  if (mock) return new MockLocationProvider()
  if (externalName) return new ExternalGpsProvider(externalName)
  return new BachmainMobileProvider()
}

export { BachmainMobileProvider, ExternalGpsProvider, MockLocationProvider }
