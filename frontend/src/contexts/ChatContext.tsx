import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import { getAccessToken } from '../api/client'
import { chatApi } from '../api/chat'

interface ChatContextType {
  socket: Socket | null
  unreadCount: number
  refreshUnreadCount: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
      }
      setUnreadCount(0)
      return
    }

    const token = getAccessToken()
    if (!token) return

    const newSocket = io(window.location.origin, {
      auth: { token },
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('[Papaya Socket] Connected:', newSocket.id)
      chatApi.getUnreadCount()
        .then(({ data }) => setUnreadCount(data.unread_count))
        .catch(() => {})
    })

    newSocket.on('connect_error', (err) => {
      console.error('[Papaya Socket] Connection error:', err.message)
    })

    newSocket.on('new_message', () => {
      setUnreadCount((prev) => prev + 1)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
      socketRef.current = null
      setSocket(null)
    }
  }, [isAuthenticated])

  const refreshUnreadCount = () => {
    if (!isAuthenticated) return
    chatApi.getUnreadCount()
      .then(({ data }) => setUnreadCount(data.unread_count))
      .catch(() => {})
  }

  return (
    <ChatContext.Provider value={{ socket, unreadCount, refreshUnreadCount }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChatContext must be used within ChatProvider')
  return context
}
