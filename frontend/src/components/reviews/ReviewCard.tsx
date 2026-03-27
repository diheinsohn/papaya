import { Link } from 'react-router-dom'
import type { Review } from '../../types/review'
import StarRating from './StarRating'
import { timeAgo } from '../../utils/formatters'

interface ReviewCardProps {
  review: Review
}

const roleBadge = {
  buyer: { label: 'Comprador', classes: 'bg-blue-100 text-blue-700' },
  seller: { label: 'Vendedor', classes: 'bg-green-100 text-green-700' },
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const badge = roleBadge[review.role]
  const initial = review.reviewer.display_name?.[0] || review.reviewer.username[0]

  return (
    <div className="border border-warm-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link to={`/users/${review.reviewer.id}`} className="shrink-0">
          {review.reviewer.avatar_url ? (
            <img
              src={review.reviewer.avatar_url}
              alt={review.reviewer.display_name || review.reviewer.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-papaya-100 text-papaya-600 flex items-center justify-center font-semibold text-sm uppercase">
              {initial}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/users/${review.reviewer.id}`}
              className="font-medium text-warm-800 text-sm hover:text-papaya-500 transition-colors"
            >
              {review.reviewer.display_name || review.reviewer.username}
            </Link>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${badge.classes}`}>
              {badge.label}
            </span>
          </div>

          {/* Rating + timestamp */}
          <div className="flex items-center gap-2 mt-1">
            <StarRating rating={review.rating} size="sm" />
            <span className="text-xs text-warm-400">{timeAgo(review.created_at)}</span>
          </div>

          {/* Comment */}
          {review.comment && (
            <p className="text-warm-700 text-sm mt-2 whitespace-pre-line">{review.comment}</p>
          )}

          {/* Listing link */}
          <Link
            to={`/listings/${review.listing.id}`}
            className="text-xs text-warm-400 hover:text-papaya-500 mt-2 inline-block transition-colors"
          >
            {review.listing.title}
          </Link>
        </div>
      </div>
    </div>
  )
}
