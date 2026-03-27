import apiClient from './client'

export interface TransactionItem {
  listing: {
    id: string
    title: string
    price: string
    currency: string
    status: string
    images: { url: string; thumbnail_url: string }[]
  }
  other_user: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  conversation_id: string
  offer_amount: string
  accepted_at: string
  has_reviewed: boolean
  receipt_confirmed: boolean
}

export const transactionsApi = {
  getMyPurchases: () =>
    apiClient.get<{ items: TransactionItem[] }>('/my-purchases'),

  getMySales: () =>
    apiClient.get<{ items: TransactionItem[] }>('/my-sales'),

  confirmReceipt: (listingId: string) =>
    apiClient.post(`/listings/${listingId}/confirm-receipt`),
}
