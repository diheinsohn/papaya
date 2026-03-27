interface UserReputationProps {
  avgRating?: number
  reviewCount?: number
}

export default function UserReputation({ avgRating, reviewCount }: UserReputationProps) {
  if (!reviewCount) {
    return <span className="text-sm text-warm-400">Sin reseñas</span>
  }

  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <svg className="w-4 h-4 text-papaya-500" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
      <span className="font-medium text-warm-800">{avgRating?.toFixed(1)}</span>
      <span className="text-warm-400">&middot;</span>
      <span className="text-warm-500">{reviewCount} {reviewCount === 1 ? 'reseña' : 'reseñas'}</span>
    </span>
  )
}
