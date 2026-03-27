import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Listing } from '../../types/listing'
import ConditionBadge from './ConditionBadge'
import PriceDisplay from './PriceDisplay'
import { listingsApi } from '../../api/listings'

interface ListingCardProps {
  listing: Listing
  showActions?: boolean
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
}

export default function ListingCard({ listing, showActions, onEdit, onDelete }: ListingCardProps) {
  const [isFavorited, setIsFavorited] = useState(listing.is_favorited)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  const thumbnail = listing.images?.[0]?.thumbnail_url || listing.images?.[0]?.url

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (favoriteLoading) return
    setFavoriteLoading(true)
    try {
      const { data } = await listingsApi.toggleFavorite(listing.id)
      setIsFavorited(data.is_favorited)
    } catch {
      // silently fail
    } finally {
      setFavoriteLoading(false)
    }
  }

  return (
    <Link
      to={`/listings/${listing.id}`}
      className="group block bg-white rounded-lg shadow-sm border border-warm-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-warm-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-warm-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Favorite button */}
        {!showActions && (
          <button
            onClick={handleFavorite}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
          >
            <svg
              className={`w-5 h-5 ${isFavorited ? 'text-error-500 fill-error-500' : 'text-warm-500'}`}
              fill={isFavorited ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* Status badge for my listings */}
        {showActions && listing.status !== 'active' && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-xs font-medium rounded-full bg-warm-800/70 text-white">
            {listing.status === 'sold' ? 'Vendido' : listing.status === 'reserved' ? 'Reservado' : listing.status === 'draft' ? 'Borrador' : listing.status}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <PriceDisplay price={listing.price} currency={listing.currency} />

        <h3 className="mt-1 text-sm text-warm-800 line-clamp-2 group-hover:text-papaya-600 transition-colors">
          {listing.title}
        </h3>

        <div className="mt-2 flex items-center gap-2">
          <ConditionBadge condition={listing.condition} />
        </div>

        {listing.location_name && (
          <p className="mt-1.5 text-xs text-warm-500 truncate">{listing.location_name}</p>
        )}

        {/* Edit/Delete actions for my listings */}
        {showActions && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit?.(listing.id) }}
              className="flex-1 py-1.5 text-xs font-medium text-papaya-600 bg-papaya-50 rounded-lg hover:bg-papaya-100 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete?.(listing.id) }}
              className="flex-1 py-1.5 text-xs font-medium text-error-500 bg-error-500/10 rounded-lg hover:bg-error-500/20 transition-colors"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>
    </Link>
  )
}
