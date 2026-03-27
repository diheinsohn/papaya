import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { reviewsApi } from '../../api/reviews'
import { listingsApi } from '../../api/listings'
import type { Listing } from '../../types/listing'
import StarRating from '../../components/reviews/StarRating'
import Button from '../../components/ui/Button'

export default function WriteReviewPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSeller = searchParams.get('role') === 'seller'
  const [listing, setListing] = useState<Listing | null>(null)
  const [canReview, setCanReview] = useState<boolean | null>(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!listingId) return

    const load = async () => {
      setLoading(true)
      try {
        const canReviewFn = isSeller ? reviewsApi.canReviewAsSeller : reviewsApi.canReview
        const [canRes, listingRes] = await Promise.all([
          canReviewFn(listingId),
          listingsApi.get(listingId),
        ])
        setCanReview(canRes.data.can_review)
        setListing(listingRes.data)
      } catch {
        setError('No se pudo cargar la información.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [listingId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!listingId || rating === 0) return

    setSubmitting(true)
    setError('')
    try {
      await reviewsApi.create({ listing_id: listingId, rating, comment })
      navigate(listing ? `/listings/${listing.id}` : '/home')
    } catch {
      setError('No se pudo enviar la reseña. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-warm-200 rounded" />
          <div className="h-40 bg-warm-200 rounded-lg" />
        </div>
      </div>
    )
  }

  if (canReview === false) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center">
        <p className="text-warm-600">No puedes dejar una reseña para esta publicación.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-papaya-500 hover:text-papaya-600 font-medium text-sm"
        >
          Volver
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-md border border-warm-200 p-8">
        <h1 className="text-xl font-bold text-warm-900 mb-6">Dejar reseña</h1>

        {listing && (
          <div className="mb-6 p-3 bg-warm-50 rounded-lg border border-warm-200">
            <p className="text-sm text-warm-500">Estás evaluando:</p>
            <p className="font-medium text-warm-800">{listing.title}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">
              Calificación
            </label>
            <StarRating rating={rating} onChange={setRating} size="lg" />
            {rating === 0 && (
              <p className="text-xs text-warm-400 mt-1">Selecciona una calificación</p>
            )}
          </div>

          <div>
            <label htmlFor="review-comment" className="block text-sm font-medium text-warm-700 mb-2">
              Comentario <span className="text-warm-400 font-normal">(opcional)</span>
            </label>
            <textarea
              id="review-comment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Cuéntanos sobre tu experiencia..."
              className="w-full rounded-lg border border-warm-300 px-3 py-2 text-warm-800 placeholder:text-warm-400 focus:outline-none focus:ring-2 focus:ring-papaya-300 focus:border-papaya-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-error-500">{error}</p>
          )}

          <Button
            type="submit"
            loading={submitting}
            disabled={rating === 0}
            className="w-full"
          >
            Enviar reseña
          </Button>
        </form>
      </div>
    </div>
  )
}
