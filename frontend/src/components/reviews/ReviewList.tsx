import { useState, useEffect } from 'react'
import { reviewsApi } from '../../api/reviews'
import type { Review } from '../../types/review'
import ReviewCard from './ReviewCard'

interface ReviewListProps {
  userId: string
}

export default function ReviewList({ userId }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    reviewsApi.getUserReviews(userId, { page, per_page: 10 })
      .then(({ data }) => {
        setReviews(data.items)
        setTotalPages(data.pages)
      })
      .catch(() => setReviews([]))
      .finally(() => setLoading(false))
  }, [userId, page])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse border border-warm-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-warm-200 shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-warm-200 rounded" />
                <div className="h-3 w-24 bg-warm-200 rounded" />
                <div className="h-4 w-full bg-warm-200 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (reviews.length === 0) {
    return <p className="text-warm-400 text-sm">Sin reseñas aún.</p>
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-warm-200 text-warm-600 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 text-sm text-warm-500">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm rounded-lg border border-warm-200 text-warm-600 hover:bg-warm-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
