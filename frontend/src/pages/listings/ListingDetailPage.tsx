import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import type { Listing } from '../../types/listing'
import { listingsApi } from '../../api/listings'
import ConditionBadge from '../../components/listings/ConditionBadge'
import PriceDisplay from '../../components/listings/PriceDisplay'
import Button from '../../components/ui/Button'

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImage, setSelectedImage] = useState(0)
  const [isFavorited, setIsFavorited] = useState(false)
  const [favoriteLoading, setFavoriteLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    listingsApi.get(id)
      .then(({ data }) => {
        setListing(data)
        setIsFavorited(data.is_favorited)
      })
      .catch(() => setError('No se pudo cargar la publicación.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleFavorite = async () => {
    if (!listing || favoriteLoading) return
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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="aspect-square bg-warm-200 rounded-lg" />
          <div className="space-y-4">
            <div className="h-8 bg-warm-200 rounded w-3/4" />
            <div className="h-10 bg-warm-200 rounded w-1/3" />
            <div className="h-6 bg-warm-200 rounded-full w-24" />
            <div className="h-24 bg-warm-200 rounded" />
            <div className="h-20 bg-warm-200 rounded-lg" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-warm-500 text-lg">{error || 'Publicación no encontrada.'}</p>
        <Link to="/home" className="mt-4 inline-block text-papaya-500 hover:text-papaya-600 font-medium">
          Volver al inicio
        </Link>
      </div>
    )
  }

  const mainImage = listing.images[selectedImage]?.url || listing.images[selectedImage]?.thumbnail_url

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image gallery */}
        <div>
          <div className="aspect-square bg-warm-100 rounded-lg overflow-hidden">
            {mainImage ? (
              <img src={mainImage} alt={listing.title} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-warm-400">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {listing.images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {listing.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    i === selectedImage ? 'border-papaya-500' : 'border-warm-200 hover:border-warm-300'
                  }`}
                >
                  <img src={img.thumbnail_url || img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-2xl font-bold text-warm-900">{listing.title}</h1>

          <div className="mt-3">
            <PriceDisplay price={listing.price} currency={listing.currency} className="text-2xl" />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <ConditionBadge condition={listing.condition} />
            {listing.category && (
              <span className="text-sm text-warm-500">{listing.category.name}</span>
            )}
          </div>

          {listing.location_name && (
            <p className="mt-2 text-sm text-warm-500 flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {listing.location_name}
            </p>
          )}

          {/* Description */}
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-warm-700 mb-2">Descripción</h2>
            <p className="text-warm-700 whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <Button className="flex-1">Contactar</Button>
            <button
              onClick={handleFavorite}
              disabled={favoriteLoading}
              className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-colors ${
                isFavorited
                  ? 'border-error-500 bg-error-500/10 text-error-500'
                  : 'border-warm-300 text-warm-500 hover:border-warm-400'
              }`}
            >
              <svg
                className="w-6 h-6"
                fill={isFavorited ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Seller card */}
          <Link
            to={`/users/${listing.seller.id}`}
            className="mt-6 flex items-center gap-3 p-4 rounded-lg border border-warm-200 hover:bg-warm-50 transition-colors"
          >
            {listing.seller.avatar_url ? (
              <img
                src={listing.seller.avatar_url}
                alt={listing.seller.display_name || listing.seller.username}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-papaya-100 text-papaya-600 flex items-center justify-center font-semibold text-lg uppercase">
                {(listing.seller.display_name?.[0] || listing.seller.username[0])}
              </div>
            )}
            <div>
              <p className="font-medium text-warm-800">
                {listing.seller.display_name || listing.seller.username}
              </p>
              <p className="text-sm text-warm-500">@{listing.seller.username}</p>
            </div>
          </Link>

          <p className="mt-4 text-xs text-warm-400">
            Publicado el {new Date(listing.created_at).toLocaleDateString('es-AR')}
          </p>
        </div>
      </div>
    </div>
  )
}
