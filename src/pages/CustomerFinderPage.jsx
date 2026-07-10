import { useMemo, useRef, useState } from 'react'
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Loader2,
  MapPin,
  Phone,
  Search,
  Star,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getCustomerProfiles } from '../data/customerProfiles'
import { getCustomerDisplay } from '../utils/customerDisplay'

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''
const PLACE_FIELDS = [
  'place_id',
  'name',
  'formatted_address',
  'formatted_phone_number',
  'international_phone_number',
  'website',
  'url',
  'rating',
  'user_ratings_total',
  'business_status',
  'types',
  'geometry',
  'address_components',
  'opening_hours',
]

let googleMapsLoader

function loadGoogleMapsApi() {
  if (window.google?.maps?.places) return Promise.resolve(window.google)
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error('Google Maps API anahtarı bulunamadı.'))
  if (googleMapsLoader) return googleMapsLoader

  googleMapsLoader = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-bach-google-maps="true"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google))
      existing.addEventListener('error', () => reject(new Error('Google Maps yüklenemedi.')))
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&libraries=places&language=tr&region=TR`
    script.async = true
    script.defer = true
    script.dataset.bachGoogleMaps = 'true'
    script.onload = () => resolve(window.google)
    script.onerror = () => reject(new Error('Google Maps yüklenemedi.'))
    document.head.appendChild(script)
  })

  return googleMapsLoader
}

function getAddressPart(components = [], types = []) {
  const match = components.find((component) => types.some((type) => component.types?.includes(type)))
  return match?.long_name || ''
}

function normalizeCandidate(place = {}) {
  const components = place.address_components || []
  const location = place.geometry?.location
  return {
    id: place.place_id,
    name: place.name || 'İsimsiz işletme',
    address: place.formatted_address || '',
    phone: place.formatted_phone_number || place.international_phone_number || '',
    website: place.website || '',
    mapsUrl: place.url || '',
    rating: place.rating || null,
    reviewCount: place.user_ratings_total || 0,
    status: place.business_status || '',
    types: place.types || [],
    city: getAddressPart(components, ['administrative_area_level_1', 'locality']),
    district: getAddressPart(components, ['administrative_area_level_2', 'sublocality', 'locality']),
    country: getAddressPart(components, ['country']),
    lat: location?.lat?.() ?? null,
    lng: location?.lng?.() ?? null,
    openNow: place.opening_hours?.isOpen?.() ?? place.opening_hours?.open_now ?? null,
  }
}

function placeToCustomerDraft(candidate, category) {
  return {
    source: 'google-maps',
    placeId: candidate.id,
    shortBrandName: candidate.name,
    companyTitle: candidate.name,
    addressTitle: 'Google Maps',
    address: candidate.address,
    city: candidate.city,
    district: candidate.district,
    phone: candidate.phone,
    email: '',
    website: candidate.website,
    lat: candidate.lat,
    lng: candidate.lng,
    category,
    mapsUrl: candidate.mapsUrl,
  }
}

function buildGoogleMapsSearchUrl(category, region) {
  const query = [category, region].filter(Boolean).join(' ')
  return `https://www.google.com/maps/search/${encodeURIComponent(query || 'müşteri')}`
}

function alreadyExists(candidate, customers) {
  const normalizedName = candidate.name.toLocaleLowerCase('tr-TR')
  const normalizedPhone = String(candidate.phone || '').replace(/\D/g, '')
  return customers.some((customer) => {
    const display = getCustomerDisplay(customer)
    const existingName = `${display.brandShortName} ${display.companyTitle}`.toLocaleLowerCase('tr-TR')
    const existingPhone = String(customer.phone || '').replace(/\D/g, '')
    return existingName.includes(normalizedName)
      || normalizedName.includes(display.brandShortName.toLocaleLowerCase('tr-TR'))
      || (normalizedPhone && existingPhone && normalizedPhone === existingPhone)
  })
}

export default function CustomerFinderPage() {
  const navigate = useNavigate()
  const serviceNodeRef = useRef(null)
  const [category, setCategory] = useState('')
  const [region, setRegion] = useState('Türkiye')
  const [candidates, setCandidates] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastQuery, setLastQuery] = useState('')
  const customers = useMemo(() => getCustomerProfiles(), [])
  const selectedCandidates = candidates.filter((candidate) => selectedIds.includes(candidate.id))
  const mapsSearchUrl = buildGoogleMapsSearchUrl(category, region)

  async function searchPlaces(event) {
    event?.preventDefault()
    const keyword = category.trim()
    if (!keyword) {
      setError('Önce kategori veya sektör adı yazın.')
      return
    }

    setLoading(true)
    setError('')
    setCandidates([])
    setSelectedIds([])
    setLastQuery([keyword, region.trim()].filter(Boolean).join(' / '))

    try {
      const google = await loadGoogleMapsApi()
      const service = new google.maps.places.PlacesService(serviceNodeRef.current)
      const query = [keyword, region.trim() || 'Türkiye'].filter(Boolean).join(' ')
      const results = await new Promise((resolve, reject) => {
        service.textSearch({ query }, (places, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) resolve(places || [])
          else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) resolve([])
          else reject(new Error(`Google Places araması tamamlanamadı: ${status}`))
        })
      })

      const limitedResults = results.slice(0, 20)
      const detailed = await Promise.all(limitedResults.map((place) => new Promise((resolve) => {
        service.getDetails({ placeId: place.place_id, fields: PLACE_FIELDS }, (detail, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && detail) {
            resolve(normalizeCandidate(detail))
          } else {
            resolve(normalizeCandidate(place))
          }
        })
      })))

      setCandidates(detailed.filter((candidate) => candidate.id))
      if (!detailed.length) setError('Bu kategori için sonuç bulunamadı. Bölgeyi veya kategori adını genişletin.')
    } catch (searchError) {
      setError(searchError.message || 'Arama sırasında hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  function toggleCandidate(candidateId) {
    setSelectedIds((current) => (
      current.includes(candidateId)
        ? current.filter((id) => id !== candidateId)
        : [...current, candidateId]
    ))
  }

  function openCustomerForm(candidate) {
    navigate('/musteriler/yeni', {
      state: {
        customerDraft: placeToCustomerDraft(candidate, category.trim()),
      },
    })
  }

  return (
    <div className="space-y-5">
      <section className="relative rounded-2xl border border-dark-500/50 bg-dark-800/70 p-5 text-center shadow-card">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-black uppercase tracking-wide text-blue-300">Müşteri Bul</h1>
          <p className="mt-2 text-xs font-semibold text-gray-500">
            Google Maps üzerinden kategoriye göre işletme adayları bulun, seçtiklerinizi müşteri kayıt formuna aktarın.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-dark-500/45 bg-dark-800/65 p-4 shadow-card">
        <form onSubmit={searchPlaces} className="grid gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.7fr)_auto]">
          <label>
            <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Kategori / Sektör</p>
            <input
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="form-input search-pill h-10 text-sm font-semibold"
              placeholder="Örn: mobilyacı, reklam ajansı, matbaa, restoran"
            />
          </label>
          <label>
            <p className="mb-2 text-[12px] font-black uppercase tracking-wider text-gray-500">Bölge</p>
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              className="form-input search-pill h-10 text-sm font-semibold"
              placeholder="Türkiye, İstanbul, Ankara..."
            />
          </label>
          <div className="flex items-end gap-2">
            <button type="submit" disabled={loading} className="btn-primary h-10 gap-2 rounded-full px-5 text-sm disabled:opacity-60">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              Ara
            </button>
            <a
              href={mapsSearchUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-dark-500/50 bg-dark-700/70 px-4 text-xs font-black text-gray-300 transition-colors hover:bg-dark-700 hover:text-white"
            >
              Maps <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </form>

        {!GOOGLE_MAPS_API_KEY && (
          <div className="mt-4 rounded-2xl border border-orange-500/25 bg-orange-500/10 p-3 text-xs font-semibold text-orange-200">
            Canlı Google Maps araması için `.env` içine `VITE_GOOGLE_MAPS_API_KEY` eklenmeli ve Google Places API açık olmalı.
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-xs font-semibold text-red-200">
            {error}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-dark-500/45 bg-dark-800/65 p-4 shadow-card">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-white">Bulunan Müşteri Adayları</h2>
            <p className="mt-1 text-xs font-semibold text-gray-500">{lastQuery || 'Kategori yazıp arama yapın.'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-xl bg-blue-500/10 px-3 py-1.5 text-xs font-black text-blue-300">{candidates.length} aday</span>
            <span className="rounded-xl bg-emerald-500/10 px-3 py-1.5 text-xs font-black text-emerald-300">{selectedCandidates.length} seçili</span>
            <button
              type="button"
              disabled={!selectedCandidates.length}
              onClick={() => selectedCandidates[0] && openCustomerForm(selectedCandidates[0])}
              className="btn-primary h-9 gap-2 px-3 text-xs disabled:opacity-50"
            >
              <Users className="h-3.5 w-3.5" /> Seçileni Ekle
            </button>
          </div>
        </div>

        <div ref={serviceNodeRef} className="hidden" aria-hidden="true" />

        {candidates.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {candidates.map((candidate) => {
              const selected = selectedIds.includes(candidate.id)
              const exists = alreadyExists(candidate, customers)
              return (
                <article
                  key={candidate.id}
                  className={`rounded-2xl border p-4 transition-colors ${
                    selected
                      ? 'border-blue-500/40 bg-blue-500/10'
                      : 'border-dark-500/40 bg-dark-700/30 hover:border-dark-500/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-white">{candidate.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs font-semibold text-gray-500">{candidate.address || 'Adres bilgisi yok'}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCandidate(candidate.id)}
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-colors ${
                        selected
                          ? 'border-emerald-500/35 bg-emerald-500/15 text-emerald-300'
                          : 'border-dark-500/50 bg-dark-800/70 text-gray-500 hover:text-white'
                      }`}
                      title="Seç"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-4 grid gap-2 text-xs font-semibold text-gray-400 sm:grid-cols-2">
                    <span className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-blue-300" /> {candidate.phone || '-'}</span>
                    <span className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5 text-blue-300" /> {candidate.website ? 'Web sitesi var' : '-'}</span>
                    <span className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-blue-300" /> {[candidate.district, candidate.city].filter(Boolean).join(' / ') || '-'}</span>
                    <span className="flex items-center gap-2"><Star className="h-3.5 w-3.5 text-orange-300" /> {candidate.rating ? `${candidate.rating} (${candidate.reviewCount})` : '-'}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {exists && <span className="rounded-lg bg-orange-500/10 px-2 py-1 text-[12px] font-black text-orange-300">Sistemde olabilir</span>}
                      {candidate.openNow !== null && (
                        <span className={`rounded-lg px-2 py-1 text-[12px] font-black ${candidate.openNow ? 'bg-emerald-500/10 text-emerald-300' : 'bg-gray-500/10 text-gray-400'}`}>
                          {candidate.openNow ? 'Açık' : 'Kapalı'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openCustomerForm(candidate)}
                      className="btn-primary h-9 gap-2 px-3 text-xs"
                    >
                      <Users className="h-3.5 w-3.5" /> Müşteri Olarak Ekle
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-dark-500/45 bg-dark-700/20 p-8 text-center">
            <Building2 className="mx-auto h-8 w-8 text-gray-600" />
            <p className="mt-3 text-sm font-black text-gray-300">Henüz aday listesi yok.</p>
            <p className="mt-1 text-xs font-semibold text-gray-500">Kategori yazıp arama yaptığınızda Google Maps sonuçları burada listelenir.</p>
          </div>
        )}
      </section>
    </div>
  )
}
