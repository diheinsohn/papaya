import { useState } from 'react'

interface StarRatingProps {
  rating: number
  onChange?: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
}

const gapClasses = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1',
}

function StarIcon({ filled, className }: { filled: boolean; className: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={filled ? 0 : 1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
    </svg>
  )
}

export default function StarRating({ rating, onChange, size = 'md' }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0)
  const interactive = !!onChange

  const displayRating = hoverRating || rating

  return (
    <div className={`inline-flex ${gapClasses[size]}`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= displayRating

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className={`${filled ? 'text-papaya-500' : 'text-warm-300'} cursor-pointer transition-colors hover:scale-110`}
            >
              <StarIcon filled={filled} className={sizeClasses[size]} />
            </button>
          )
        }

        return (
          <span
            key={star}
            className={filled ? 'text-papaya-500' : 'text-warm-300'}
          >
            <StarIcon filled={filled} className={sizeClasses[size]} />
          </span>
        )
      })}
    </div>
  )
}
