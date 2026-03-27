import { CONDITION_LABELS } from '../../types/listing'

const conditionColors: Record<string, string> = {
  new: 'bg-success-500/10 text-success-500',
  like_new: 'bg-info-500/10 text-info-500',
  good: 'bg-papaya-100 text-papaya-700',
  fair: 'bg-warning-500/10 text-warning-500',
  poor: 'bg-error-500/10 text-error-500',
}

interface ConditionBadgeProps {
  condition: string
  className?: string
}

export default function ConditionBadge({ condition, className = '' }: ConditionBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${conditionColors[condition] || 'bg-warm-100 text-warm-600'} ${className}`}
    >
      {CONDITION_LABELS[condition] || condition}
    </span>
  )
}
