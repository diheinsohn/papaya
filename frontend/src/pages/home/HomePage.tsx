import { useState, useEffect } from 'react'
import type { Listing, Category } from '../../types/listing'
import { listingsApi, categoriesApi } from '../../api/listings'
import ListingGrid from '../../components/listings/ListingGrid'
import CategoryPills from '../../components/listings/CategoryPills'

type SortOption = 'newest' | 'price_asc' | 'price_desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'newest', label: 'Mas reciente' },
  { value: 'price_asc', label: 'Menor precio' },
  { value: 'price_desc', label: 'Mayor precio' },
]

export default function HomePage() {
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [sort, setSort] = useState<SortOption>('newest')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  useEffect(() => {
    categoriesApi.getAll()
      .then(({ data }) => setCategories(data.categories))
      .catch(() => {})
  }, [])

  const fetchListings = (p: number, sortBy: string) => {
    setLoading(true)
    listingsApi.getAll({ page: p, per_page: 24, sort: sortBy })
      .then(({ data }) => {
        setListings(data.items)
        setTotalPages(data.pages)
        setPage(data.page)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchListings(1, sort)
  }, [sort])

  const handleCategorySelect = (slug: string | null) => {
    setSelectedCategory(slug)
  }

  const handleLoadMore = () => {
    if (page >= totalPages) return
    const nextPage = page + 1
    listingsApi.getAll({ page: nextPage, per_page: 24, sort })
      .then(({ data }) => {
        setListings((prev) => [...prev, ...data.items])
        setTotalPages(data.pages)
        setPage(data.page)
      })
      .catch(() => {})
  }

  // Client-side category filter
  const filteredListings = selectedCategory
    ? listings.filter((l) => l.category?.slug === selectedCategory)
    : listings

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-6">
          <CategoryPills
            categories={categories}
            selectedSlug={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>
      )}

      {/* Sort */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-semibold text-warm-800">Publicaciones</h1>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="px-3 py-1.5 rounded-lg border border-warm-300 text-sm text-warm-600 focus:border-papaya-500 focus:ring-2 focus:ring-papaya-500/30 focus:outline-none bg-white"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <ListingGrid listings={filteredListings} loading={loading} />

      {/* Load more */}
      {page < totalPages && !loading && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="px-6 py-2.5 rounded-lg border-2 border-papaya-500 text-papaya-500 font-medium hover:bg-papaya-50 transition-colors"
          >
            Cargar mas
          </button>
        </div>
      )}
    </div>
  )
}
