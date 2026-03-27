export interface Review {
  id: string
  listing_id: string
  listing: { id: string; title: string }
  reviewer: {
    id: string
    username: string
    display_name?: string
    avatar_url?: string
  }
  reviewee_id: string
  rating: number
  comment: string
  role: 'buyer' | 'seller'
  created_at: string
}
