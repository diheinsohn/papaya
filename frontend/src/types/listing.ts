export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  children?: Category[]
}

export interface ListingImage {
  id: string
  url: string
  thumbnail_url: string
  sort_order: number
}

export interface SellerSummary {
  id: string
  username: string
  display_name?: string
  avatar_url?: string
}

export interface Listing {
  id: string
  title: string
  description: string
  price: string
  currency: string
  condition: 'new' | 'like_new' | 'good' | 'fair' | 'poor'
  category_id: number
  category?: Category
  location_name?: string
  status: string
  view_count: number
  is_promoted: boolean
  created_at: string
  updated_at: string
  images: ListingImage[]
  seller: SellerSummary
  is_favorited: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

export const CONDITION_LABELS: Record<string, string> = {
  new: 'Nuevo',
  like_new: 'Como nuevo',
  good: 'Buen estado',
  fair: 'Aceptable',
  poor: 'Para reparar',
}
