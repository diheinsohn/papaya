import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { chatApi } from '../../api/chat'
import type { Conversation } from '../../types/message'

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHr / 24)

  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `${diffMin} min`
  if (diffHr < 24) return `${diffHr} h`
  if (diffDay < 7) return `${diffDay} d`
  return date.toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

function truncate(text: string, maxLen: number) {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '...'
}

export default function InboxPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    chatApi.getConversations()
      .then(({ data }) => setConversations(data.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-warm-900 mb-4">Mensajes</h1>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex gap-3 p-4 rounded-lg border border-warm-200">
              <div className="w-12 h-12 bg-warm-200 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-warm-200 rounded w-1/3" />
                <div className="h-3 bg-warm-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold text-warm-900 mb-4">Mensajes</h1>

      {conversations.length === 0 ? (
        <div className="text-center py-16">
          <svg className="w-16 h-16 mx-auto text-warm-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-warm-500">No tienes conversaciones aún</p>
          <p className="text-sm text-warm-400 mt-1">Contacta a un vendedor para iniciar una conversación</p>
        </div>
      ) : (
        <div className="divide-y divide-warm-100">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              to={`/messages/${conv.id}`}
              className="flex gap-3 p-4 hover:bg-warm-50 transition-colors rounded-lg"
            >
              {/* Listing thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-warm-100 overflow-hidden shrink-0">
                {conv.listing.thumbnail ? (
                  <img src={conv.listing.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-warm-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium truncate ${conv.unread_count > 0 ? 'text-warm-900' : 'text-warm-700'}`}>
                    {conv.other_user.display_name || conv.other_user.username}
                  </p>
                  <span className="text-xs text-warm-400 shrink-0">
                    {conv.last_message_at ? formatRelativeTime(conv.last_message_at) : ''}
                  </span>
                </div>
                <p className="text-xs text-warm-500 truncate">{conv.listing.title}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className={`text-sm truncate ${conv.unread_count > 0 ? 'text-warm-800 font-medium' : 'text-warm-500'}`}>
                    {conv.last_message ? truncate(conv.last_message.content, 50) : 'Sin mensajes'}
                  </p>
                  {conv.unread_count > 0 && (
                    <span className="shrink-0 min-w-5 h-5 flex items-center justify-center bg-papaya-500 text-white text-xs font-bold rounded-full px-1.5">
                      {conv.unread_count}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
