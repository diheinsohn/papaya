import type { Listing } from '../../types/listing'
import ListingCard from './ListingCard'

interface ListingGridProps {
  listings: Listing[]
  loading?: boolean
  showActions?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  emptyMessage?: string
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-warm-200 overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-warm-200" />
      <div className="p-3 space-y-2">
        <div className="h-5 bg-warm-200 rounded w-2/3" />
        <div className="h-4 bg-warm-200 rounded w-full" />
        <div className="h-4 bg-warm-200 rounded w-1/2" />
        <div className="h-5 bg-warm-200 rounded-full w-20" />
      </div>
    </div>
  )
}

export default function ListingGrid({
  listings,
  loading,
  showActions,
  onEdit,
  onDelete,
  emptyMessage = 'No se encontraron publicaciones.',
}: ListingGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="w-16 h-16 mx-auto text-warm-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p className="text-warm-500 text-lg">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          listing={listing}
          showActions={showActions}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
