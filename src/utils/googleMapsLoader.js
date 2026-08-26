/**
 * Shared Google Maps JavaScript API loader.
 * Uses VITE_GOOGLE_MAPS_API_KEY (browser key — restrict by HTTP referrer).
 * Never hard-code keys. Prefer importLibrary over URL `libraries=`.
 */

const BROWSER_KEY =
  import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''

const CALLBACK_NAME = '__bachGoogleMapsReady'

let loadPromise = null

export function getGoogleMapsBrowserKey() {
  return BROWSER_KEY
}

export function hasGoogleMapsBrowserKey() {
  return Boolean(BROWSER_KEY)
}

export function getGoogleMapsMapId() {
  return import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || ''
}

export function loadGoogleMapsJs() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps yalnızca tarayıcıda yüklenebilir.'))
  }
  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google)
  }
  if (!BROWSER_KEY) {
    return Promise.reject(new Error('Google Maps API anahtarı bulunamadı.'))
  }
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.google?.maps) resolve(window.google)
      else reject(new Error('Google Maps yüklenemedi.'))
    }

    const existing = document.querySelector('script[data-bach-google-maps="true"]')
    if (existing) {
      if (window.google?.maps) {
        finish()
        return
      }
      existing.addEventListener('load', finish)
      existing.addEventListener('error', () => reject(new Error('Google Maps yüklenemedi.')))
      return
    }

    window[CALLBACK_NAME] = finish

    const script = document.createElement('script')
    script.async = true
    script.defer = true
    script.setAttribute('data-bach-google-maps', 'true')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(BROWSER_KEY)}&v=weekly&language=tr&region=TR&loading=async&callback=${CALLBACK_NAME}`
    script.onerror = () => {
      loadPromise = null
      reject(new Error('Google Maps yüklenemedi.'))
    }
    document.head.appendChild(script)
  })

  return loadPromise
}

/**
 * @returns {Promise<{ google: typeof window.google, maps: object, routes: object|null, marker: object|null, geometry: object|null }>}
 */
export async function importGoogleMapsLibraries() {
  const google = await loadGoogleMapsJs()
  if (!google?.maps?.importLibrary) {
    throw new Error('Google Maps importLibrary desteklenmiyor.')
  }

  const maps = await google.maps.importLibrary('maps')
  let routes = null
  let marker = null
  let geometry = null

  try {
    routes = await google.maps.importLibrary('routes')
  } catch (error) {
    console.warn('[truck-control] routes library', error)
  }
  try {
    marker = await google.maps.importLibrary('marker')
  } catch (error) {
    console.warn('[truck-control] marker library', error)
  }
  try {
    geometry = await google.maps.importLibrary('geometry')
  } catch (error) {
    console.warn('[truck-control] geometry library', error)
  }

  return { google, maps, routes, marker, geometry }
}
