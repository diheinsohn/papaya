import type { Message } from '../../types/message'
import OfferCard from './OfferCard'

interface MessageBubbleProps {
  message: Message
  isMine: boolean
  onRespondOffer?: (messageId: string, accept: boolean) => void
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
}

export default function MessageBubble({ message, isMine, onRespondOffer }: MessageBubbleProps) {
  if (message.message_type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <span className="text-xs text-warm-500 bg-warm-50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    )
  }

  if (message.message_type === 'offer') {
    return (
      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
        <div className="max-w-xs sm:max-w-sm">
          {!isMine && (
            <p className="text-xs text-warm-500 mb-1 ml-1">
              {message.sender.display_name || message.sender.username}
            </p>
          )}
          <OfferCard
            message={message}
            isMine={isMine}
            onRespond={onRespondOffer}
          />
          <p className={`text-xs text-warm-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
            {formatTime(message.created_at)}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className="max-w-xs sm:max-w-sm">
        {!isMine && (
          <p className="text-xs text-warm-500 mb-1 ml-3">
            {message.sender.display_name || message.sender.username}
          </p>
        )}
        <div
          className={`px-4 py-2 rounded-2xl whitespace-pre-wrap break-words ${
            isMine
              ? 'bg-papaya-500 text-white rounded-br-md'
              : 'bg-warm-100 text-warm-800 rounded-bl-md'
          }`}
        >
          {message.content}
        </div>
        <p className={`text-xs text-warm-400 mt-1 ${isMine ? 'text-right mr-1' : 'ml-3'}`}>
          {formatTime(message.created_at)}
        </p>
      </div>
    </div>
  )
}
