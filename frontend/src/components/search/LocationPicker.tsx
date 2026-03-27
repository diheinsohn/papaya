import { useState, useEffect } from 'react'

interface LocationPickerProps {
  onLocationChange: (lat?: number, lng?: number, radius_km?: number) => void
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]
const STORAGE_KEY = 'papaya_user_location'

interface StoredLocation {
  lat: number
  lng: number
  radius_km: number
  name?: string
}

function getStoredLocation(): StoredLocation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore corrupted localStorage */ }
  return null
}

function storeLocation(loc: StoredLocation) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loc))
}

function clearStoredLocation() {
  localStorage.removeItem(STORAGE_KEY)
}

export default function LocationPicker({ onLocationChange }: LocationPickerProps) {
  const [location, setLocation] = useState<StoredLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const stored = getStoredLocation()
    if (stored) {
      setLocation(stored)
      onLocationChange(stored.lat, stored.lng, stored.radius_km)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const radius = location?.radius_km || 25
        const loc: StoredLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          radius_km: radius,
          name: `${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`,
        }
        setLocation(loc)
        storeLocation(loc)
        onLocationChange(loc.lat, loc.lng, loc.radius_km)
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        if (err.code === err.PERMISSION_DENIED) {
          setError('Permiso de ubicación denegado')
        } else {
          setError('No se pudo obtener la ubicación')
        }
      },
      { enableHighAccuracy: false, timeout: 10000 },
    )
  }

  const handleRadiusChange = (radius: number) => {
    if (!location) return
    const updated = { ...location, radius_km: radius }
    setLocation(updated)
    storeLocation(updated)
    onLocationChange(updated.lat, updated.lng, updated.radius_km)
  }

  const handleClear = () => {
    setLocation(null)
    clearStoredLocation()
    onLocationChange(undefined, undefined, undefined)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {location ? (
        <>
          <div className="flex items-center gap-1.5 text-sm text-warm-700">
            <svg className="w-4 h-4 text-papaya-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{location.name || 'Ubicación actual'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => handleRadiusChange(r)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  location.radius_km === r
                    ? 'bg-papaya-500 text-white'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
          <button
            onClick={handleClear}
            className="text-xs text-warm-500 hover:text-warm-700 transition-colors"
          >
            Quitar
          </button>
        </>
      ) : (
        <button
          onClick={requestLocation}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-warm-300 text-sm text-warm-700 hover:bg-warm-50 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="w-4 h-4 animate-spin text-warm-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {loading ? 'Obteniendo ubicación...' : 'Usar mi ubicación'}
        </button>
      )}
      {error && <span className="text-xs text-error-500">{error}</span>}
    </div>
  )
}

export { getStoredLocation }
export type { StoredLocation }
