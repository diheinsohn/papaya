import useSearch from '../../hooks/useSearch'
import FilterPanel from '../../components/search/FilterPanel'
import LocationPicker from '../../components/search/LocationPicker'
import ListingGrid from '../../components/listings/ListingGrid'

const SORT_OPTIONS = [
  { value: '', label: 'Relevancia' },
  { value: 'newest', label: 'Más reciente' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
  { value: 'distance', label: 'Más cercano' },
]

export default function SearchResultsPage() {
  const {
    results,
    loading,
    error,
    total,
    page,
    pages,
    query,
    filters,
    setCategory,
    setPriceRange,
    setConditions,
    setSort,
    setPage,
    setLocation,
  } = useSearch()

  const location = filters.lat && filters.lng
    ? { lat: Number(filters.lat), lng: Number(filters.lng) }
    : null

  const handleLocationChange = (lat?: number, lng?: number, radius_km?: number) => {
    setLocation(lat, lng, radius_km)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Location picker */}
      <div className="mb-4">
        <LocationPicker onLocationChange={handleLocationChange} />
      </div>

      {/* Header: result count + sort */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          {query ? (
            <h1 className="text-lg font-semibold text-warm-800">
              {total} {total === 1 ? 'resultado' : 'resultados'} para &ldquo;{query}&rdquo;
            </h1>
          ) : (
            <h1 className="text-lg font-semibold text-warm-800">
              {total} {total === 1 ? 'resultado' : 'resultados'}
            </h1>
          )}
        </div>
        <select
          value={filters.sort_by}
          onChange={(e) => setSort(e.target.value || null)}
          className="px-3 py-1.5 rounded-lg border border-warm-300 text-sm text-warm-600 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none bg-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-error-50 border border-error-200 rounded-lg text-sm text-error-600">
          {error}
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6">
        <FilterPanel
          filters={filters}
          onFilterChange={{ setCategory, setPriceRange, setConditions, setSort }}
          location={location}
        />

        <div className="flex-1 min-w-0">
          <ListingGrid
            listings={results}
            loading={loading}
            emptyMessage="No se encontraron resultados"
          />

          {/* Pagination */}
          {pages > 1 && !loading && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-warm-300 text-sm text-warm-600 hover:bg-warm-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Anterior
              </button>

              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === pages || Math.abs(p - page) <= 2)
                .reduce<(number | 'ellipsis')[]>((acc, p, i, arr) => {
                  if (i > 0 && arr[i - 1] !== p - 1) acc.push('ellipsis')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === 'ellipsis' ? (
                    <span key={`e${i}`} className="px-2 text-warm-400">...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        p === page
                          ? 'bg-papaya-500 text-white'
                          : 'text-warm-600 hover:bg-warm-100'
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}

              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pages}
                className="px-3 py-1.5 rounded-lg border border-warm-300 text-sm text-warm-600 hover:bg-warm-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
