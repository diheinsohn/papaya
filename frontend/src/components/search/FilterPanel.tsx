import { useState, useEffect } from 'react'
import type { Category } from '../../types/listing'
import { CONDITION_LABELS } from '../../types/listing'
import { categoriesApi } from '../../api/listings'

interface FilterValues {
  category: string
  min_price: string
  max_price: string
  condition: string
  sort_by: string
  lat: string
  lng: string
  radius_km: string
}

interface FilterPanelProps {
  filters: FilterValues
  onFilterChange: {
    setCategory: (category: string | null) => void
    setPriceRange: (min?: number, max?: number) => void
    setConditions: (condition: string | null) => void
    setSort: (sort: string | null) => void
  }
  location?: { lat: number; lng: number } | null
}

const RADIUS_OPTIONS = [5, 10, 25, 50, 100]

export default function FilterPanel({ filters, onFilterChange, location }: FilterPanelProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [localMinPrice, setLocalMinPrice] = useState(filters.min_price)
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.max_price)

  useEffect(() => {
    categoriesApi.getAll()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setLocalMinPrice(filters.min_price)
    setLocalMaxPrice(filters.max_price)
  }, [filters.min_price, filters.max_price])

  const handleApplyPrice = () => {
    const min = localMinPrice ? Number(localMinPrice) : undefined
    const max = localMaxPrice ? Number(localMaxPrice) : undefined
    onFilterChange.setPriceRange(min, max)
  }

  const handleConditionToggle = (condKey: string) => {
    const currentConditions = filters.condition ? filters.condition.split(',') : []
    let next: string[]
    if (currentConditions.includes(condKey)) {
      next = currentConditions.filter((c) => c !== condKey)
    } else {
      next = [...currentConditions, condKey]
    }
    onFilterChange.setConditions(next.length > 0 ? next.join(',') : null)
  }

  const clearAll = () => {
    onFilterChange.setCategory(null)
    onFilterChange.setPriceRange(undefined, undefined)
    onFilterChange.setConditions(null)
  }

  const hasActiveFilters = filters.category || filters.min_price || filters.max_price || filters.condition

  const panelContent = (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-warm-800 mb-2">Categoria</h3>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange.setCategory(null)}
            className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
              !filters.category
                ? 'bg-papaya-50 text-papaya-700 font-medium'
                : 'text-warm-600 hover:bg-warm-50'
            }`}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onFilterChange.setCategory(cat.slug)}
              className={`block w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                filters.category === cat.slug
                  ? 'bg-papaya-50 text-papaya-700 font-medium'
                  : 'text-warm-600 hover:bg-warm-50'
              }`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-sm font-semibold text-warm-800 mb-2">Precio (CLP)</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localMinPrice}
            onChange={(e) => setLocalMinPrice(e.target.value)}
            onBlur={handleApplyPrice}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
            className="w-full px-3 py-1.5 rounded-md border border-warm-300 text-sm text-warm-800 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none"
          />
          <span className="text-warm-400 text-sm">-</span>
          <input
            type="number"
            placeholder="Max"
            value={localMaxPrice}
            onChange={(e) => setLocalMaxPrice(e.target.value)}
            onBlur={handleApplyPrice}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyPrice()}
            className="w-full px-3 py-1.5 rounded-md border border-warm-300 text-sm text-warm-800 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none"
          />
        </div>
      </div>

      {/* Condition */}
      <div>
        <h3 className="text-sm font-semibold text-warm-800 mb-2">Condicion</h3>
        <div className="space-y-1.5">
          {Object.entries(CONDITION_LABELS).map(([key, label]) => {
            const active = filters.condition?.split(',').includes(key) || false
            return (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => handleConditionToggle(key)}
                  className="w-4 h-4 rounded border-warm-300 text-papaya-500 focus:ring-papaya-500/30"
                />
                <span className="text-sm text-warm-700">{label}</span>
              </label>
            )
          })}
        </div>
      </div>

      {/* Distance — only if location is set */}
      {location && (
        <div>
          <h3 className="text-sm font-semibold text-warm-800 mb-2">Distancia</h3>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                onClick={() => onFilterChange.setSort(null)} // radius is handled by LocationPicker
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filters.radius_km === String(r)
                    ? 'bg-papaya-500 text-white'
                    : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
                }`}
              >
                {r} km
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Clear */}
      {hasActiveFilters && (
        <button
          onClick={clearAll}
          className="w-full text-center text-sm text-papaya-500 hover:text-papaya-600 font-medium py-2"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-warm-300 text-sm text-warm-700 hover:bg-warm-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filtros
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-papaya-500" />
          )}
        </button>
      </div>

      {/* Mobile panel */}
      {mobileOpen && (
        <div className="lg:hidden mb-6 p-4 bg-white rounded-lg border border-warm-200 shadow-sm">
          {panelContent}
          <button
            onClick={() => setMobileOpen(false)}
            className="w-full mt-4 px-4 py-2.5 rounded-lg bg-papaya-500 text-white text-sm font-medium hover:bg-papaya-600 transition-colors"
          >
            Aplicar filtros
          </button>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-20 p-4 bg-white rounded-lg border border-warm-200 shadow-sm">
          {panelContent}
        </div>
      </div>
    </>
  )
}
