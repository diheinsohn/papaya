import { useState, useEffect, useCallback, useRef } from 'react'
import { useChatContext } from '../contexts/ChatContext'
import { useAuth } from '../contexts/AuthContext'
import { chatApi } from '../api/chat'
import type { Message } from '../types/message'

export function useChat(conversationId: string) {
  const { socket, refreshUnreadCount } = useChatContext()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [typingUsers, setTypingUsers] = useState<string[]>([])
  const typingTimeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  // Fetch initial messages
  useEffect(() => {
    setLoading(true)
    setMessages([])
    setPage(1)

    chatApi.getMessages(conversationId, { page: 1, per_page: 30 })
      .then(({ data }) => {
        // API returns newest first, reverse for chronological display
        setMessages(data.items.reverse())
        setHasMore(data.page < data.pages)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    // Mark as read
    chatApi.markRead(conversationId).then(() => refreshUnreadCount()).catch(() => {})
  }, [conversationId, refreshUnreadCount])

  // Join/leave socket room
  useEffect(() => {
    if (!socket) return

    socket.emit('join_conversation', { conversation_id: conversationId })

    return () => {
      socket.emit('leave_conversation', { conversation_id: conversationId })
    }
  }, [socket, conversationId])

  // Listen for socket events
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: Message) => {
      if (message.conversation_id !== conversationId) return
      setMessages((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
      // Mark as read if we're viewing this conversation
      chatApi.markRead(conversationId).then(() => refreshUnreadCount()).catch(() => {})
    }

    const handleOfferUpdated = (message: Message) => {
      if (message.conversation_id !== conversationId) return
      setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)))
    }

    const handleTyping = ({ conversation_id, user_id, username }: { conversation_id: string; user_id: string; username: string }) => {
      if (conversation_id !== conversationId) return
      if (user_id === user?.id) return

      const displayName = username
      setTypingUsers((prev) => (prev.includes(displayName) ? prev : [...prev, displayName]))

      // Clear previous timeout for this user
      if (typingTimeouts.current[user_id]) {
        clearTimeout(typingTimeouts.current[user_id])
      }
      typingTimeouts.current[user_id] = setTimeout(() => {
        setTypingUsers((prev) => prev.filter((u) => u !== displayName))
        delete typingTimeouts.current[user_id]
      }, 3000)
    }

    const handleMessagesRead = () => {
      // Could update read status of messages if needed
    }

    socket.on('new_message', handleNewMessage)
    socket.on('offer_updated', handleOfferUpdated)
    socket.on('user_typing', handleTyping)
    socket.on('messages_read', handleMessagesRead)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('offer_updated', handleOfferUpdated)
      socket.off('user_typing', handleTyping)
      socket.off('messages_read', handleMessagesRead)
      // Clear all typing timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout)
      typingTimeouts.current = {}
    }
  }, [socket, conversationId, user?.id, refreshUnreadCount])

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return
    const nextPage = page + 1
    try {
      const { data } = await chatApi.getMessages(conversationId, { page: nextPage, per_page: 30 })
      setMessages((prev) => [...data.items.reverse(), ...prev])
      setHasMore(data.page < data.pages)
      setPage(nextPage)
    } catch {
      // ignore
    }
  }, [conversationId, hasMore, loading, page])

  const sendMessage = useCallback(async (content: string) => {
    const { data } = await chatApi.sendMessage(conversationId, content)
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev
      return [...prev, data]
    })
    return data
  }, [conversationId])

  const sendOffer = useCallback(async (amount: number) => {
    const { data } = await chatApi.sendOffer(conversationId, amount)
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.id)) return prev
      return [...prev, data]
    })
    return data
  }, [conversationId])

  const respondOffer = useCallback(async (messageId: string, accept: boolean) => {
    const { data } = await chatApi.respondOffer(conversationId, messageId, accept)
    setMessages((prev) => prev.map((m) => (m.id === data.id ? data : m)))
    return data
  }, [conversationId])

  const emitTyping = useCallback(() => {
    if (!socket) return
    socket.emit('typing', { conversation_id: conversationId })
  }, [socket, conversationId])

  return {
    messages,
    loading,
    hasMore,
    loadMore,
    sendMessage,
    sendOffer,
    respondOffer,
    typingUsers,
    emitTyping,
  }
}
