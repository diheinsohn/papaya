import apiClient from './client'
import type { Listing, PaginatedResponse } from '../types/listing'

export interface SearchParams {
  q?: string
  category?: string
  min_price?: number
  max_price?: number
  condition?: string
  lat?: number
  lng?: number
  radius_km?: number
  sort_by?: string
  page?: number
  per_page?: number
}

export const searchApi = {
  search: (params: SearchParams) =>
    apiClient.get<PaginatedResponse<Listing>>('/search', { params }),

  suggestions: (q: string) =>
    apiClient.get<{ suggestions: string[] }>('/search/suggestions', { params: { q } }),

  feed: (params?: { lat?: number; lng?: number; page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Listing>>('/feed', { params }),
}
