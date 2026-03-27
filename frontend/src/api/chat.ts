import apiClient from './client'
import type { Conversation, Message } from '../types/message'
import type { PaginatedResponse } from '../types/listing'

export const chatApi = {
  getConversations: (params?: { page?: number }) =>
    apiClient.get<PaginatedResponse<Conversation>>('/chat/conversations', { params }),

  createConversation: (listingId: string, message?: string) =>
    apiClient.post<Conversation>('/chat/conversations', { listing_id: listingId, message }),

  getConversation: (id: string) =>
    apiClient.get<Conversation>(`/chat/conversations/${id}`),

  getMessages: (convId: string, params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Message>>(`/chat/conversations/${convId}/messages`, { params }),

  sendMessage: (convId: string, content: string) =>
    apiClient.post<Message>(`/chat/conversations/${convId}/messages`, { content }),

  sendOffer: (convId: string, amount: number) =>
    apiClient.post<Message>(`/chat/conversations/${convId}/offer`, { amount }),

  respondOffer: (convId: string, messageId: string, accept: boolean) =>
    apiClient.patch<Message>(`/chat/conversations/${convId}/offer/${messageId}`, { accept }),

  markRead: (convId: string) =>
    apiClient.patch(`/chat/conversations/${convId}/read`),

  getUnreadCount: () =>
    apiClient.get<{ unread_count: number }>('/chat/unread-count'),
}
