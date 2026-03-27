export interface User {
  id: string
  email?: string
  username: string
  display_name?: string
  bio?: string
  avatar_url?: string
  phone?: string
  location_name?: string
  location_lat?: number
  location_lng?: number
  is_verified?: boolean
  avg_rating?: number
  review_count?: number
  created_at?: string
  updated_at?: string
}
