import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { useChat } from '../../hooks/useChat'
import { chatApi } from '../../api/chat'
import type { Conversation } from '../../types/message'
import MessageBubble from '../../components/chat/MessageBubble'
import MessageInput from '../../components/chat/MessageInput'
import TypingIndicator from '../../components/chat/TypingIndicator'

export default function ConversationPage() {
  const { conversationId } = useParams<{ conversationId: string }>()
  const { user } = useAuth()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [convLoading, setConvLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const prevMessagesLenRef = useRef(0)

  const {
    messages,
    loading: messagesLoading,
    hasMore,
    loadMore,
    sendMessage,
    sendOffer,
    respondOffer,
    typingUsers,
    emitTyping,
  } = useChat(conversationId!)

  // Fetch conversation details
  useEffect(() => {
    if (!conversationId) return
    chatApi.getConversation(conversationId)
      .then(({ data }) => setConversation(data))
      .catch(() => {})
      .finally(() => setConvLoading(false))
  }, [conversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevMessagesLenRef.current) {
      const isLoadingOlder = messages.length - prevMessagesLenRef.current > 1 && prevMessagesLenRef.current > 0
      if (!isLoadingOlder) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }
    }
    prevMessagesLenRef.current = messages.length
  }, [messages.length])

  // Initial scroll to bottom
  useEffect(() => {
    if (!messagesLoading && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView()
    }
  }, [messagesLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load more on scroll to top
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container || !hasMore) return
    if (container.scrollTop < 100) {
      loadMore()
    }
  }, [hasMore, loadMore])

  const handleRespondOffer = useCallback(async (messageId: string, accept: boolean) => {
    try {
      await respondOffer(messageId, accept)
    } catch {
      // ignore
    }
  }, [respondOffer])

  const handleSendMessage = useCallback((content: string) => {
    sendMessage(content).catch(() => {})
  }, [sendMessage])

  const handleSendOffer = useCallback((amount: number) => {
    sendOffer(amount).catch(() => {})
  }, [sendOffer])

  if (convLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="animate-pulse p-4 border-b border-warm-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warm-200 rounded-lg" />
            <div className="space-y-1">
              <div className="h-4 bg-warm-200 rounded w-32" />
              <div className="h-3 bg-warm-200 rounded w-20" />
            </div>
          </div>
        </div>
        <div className="flex-1" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="text-center">
          <p className="text-warm-500">Conversación no encontrada</p>
          <Link to="/messages" className="text-papaya-500 hover:text-papaya-600 text-sm mt-2 inline-block">
            Volver a mensajes
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Conversation header */}
      <div className="bg-white border-b border-warm-200 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link
            to="/messages"
            className="p-1 text-warm-500 hover:text-warm-700 md:hidden"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>

          {/* Listing thumbnail */}
          <Link
            to={`/listings/${conversation.listing.id}`}
            className="w-10 h-10 rounded-lg bg-warm-100 overflow-hidden shrink-0"
          >
            {conversation.listing.thumbnail ? (
              <img src={conversation.listing.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-warm-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Link
                to={`/users/${conversation.other_user.id}`}
                className="text-sm font-semibold text-warm-800 hover:text-papaya-500 truncate"
              >
                {conversation.other_user.display_name || conversation.other_user.username}
              </Link>
            </div>
            <div className="flex items-center gap-2 text-xs text-warm-500">
              <Link
                to={`/listings/${conversation.listing.id}`}
                className="truncate hover:text-papaya-500"
              >
                {conversation.listing.title}
              </Link>
              <span>·</span>
              <span className="font-medium text-papaya-600 shrink-0">${parseInt(conversation.listing.price).toLocaleString('es-CL')}</span>
            </div>
          </div>

          <Link
            to="/messages"
            className="hidden md:flex items-center text-sm text-warm-500 hover:text-warm-700 gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        <div className="max-w-2xl mx-auto">
          {hasMore && (
            <div className="text-center py-2">
              <button
                onClick={loadMore}
                className="text-sm text-papaya-500 hover:text-papaya-600"
              >
                Cargar mensajes anteriores
              </button>
            </div>
          )}

          {messagesLoading ? (
            <div className="flex justify-center py-8">
              <svg
                className="animate-spin h-6 w-6 text-papaya-500"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-warm-500 text-sm">No hay mensajes aún. Envía el primero.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isMine={msg.sender_id === user?.id}
                onRespondOffer={handleRespondOffer}
              />
            ))
          )}

          <TypingIndicator users={typingUsers} />
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="max-w-2xl mx-auto w-full">
        <MessageInput
          onSendMessage={handleSendMessage}
          onSendOffer={handleSendOffer}
          onTyping={emitTyping}
        />
      </div>
    </div>
  )
}
