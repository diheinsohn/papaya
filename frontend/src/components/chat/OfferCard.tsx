import type { Message } from '../../types/message'
import Button from '../ui/Button'

interface OfferCardProps {
  message: Message
  isMine: boolean
  onRespond?: (messageId: string, accept: boolean) => void
}

const statusConfig = {
  pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  accepted: { label: 'Aceptada', bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  rejected: { label: 'Rechazada', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  expired: { label: 'Expirada', bg: 'bg-warm-100', text: 'text-warm-500', border: 'border-warm-300' },
}

function formatCLP(amount: string) {
  const num = parseInt(amount, 10)
  if (isNaN(num)) return `$${amount}`
  return `$${num.toLocaleString('es-CL')}`
}

export default function OfferCard({ message, isMine, onRespond }: OfferCardProps) {
  const status = message.offer_status || 'pending'
  const config = statusConfig[status]
  const canRespond = status === 'pending' && !isMine && onRespond

  return (
    <div className={`border-2 ${config.border} rounded-xl p-4 ${config.bg}`}>
      <p className="text-xs font-medium text-warm-500 uppercase tracking-wide mb-1">
        Oferta
      </p>
      <p className="text-2xl font-bold text-warm-900">
        {message.offer_amount ? formatCLP(message.offer_amount) : '—'}
      </p>

      <div className="mt-2 flex items-center gap-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
          {config.label}
        </span>
      </div>

      {status === 'accepted' && (
        <p className="mt-2 text-sm font-medium text-green-700">
          Oferta aceptada
        </p>
      )}

      {canRespond && (
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={() => onRespond(message.id, true)}
            className="flex-1"
          >
            Aceptar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRespond(message.id, false)}
            className="flex-1"
          >
            Rechazar
          </Button>
        </div>
      )}
    </div>
  )
}
