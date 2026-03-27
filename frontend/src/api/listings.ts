import apiClient from './client'
import type { Listing, PaginatedResponse, Category } from '../types/listing'

export const categoriesApi = {
  getAll: () => apiClient.get<{ categories: Category[] }>('/categories'),
}

export const listingsApi = {
  getAll: (params?: { page?: number; per_page?: number; sort?: string }) =>
    apiClient.get<PaginatedResponse<Listing>>('/listings', { params }),

  get: (id: string) => apiClient.get<Listing>(`/listings/${id}`),

  create: (formData: FormData) =>
    apiClient.post<Listing>('/listings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  update: (id: string, data: Record<string, unknown>) =>
    apiClient.patch<Listing>(`/listings/${id}`, data),

  delete: (id: string) => apiClient.delete(`/listings/${id}`),

  addImages: (id: string, formData: FormData) =>
    apiClient.post(`/listings/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteImage: (listingId: string, imageId: string) =>
    apiClient.delete(`/listings/${listingId}/images/${imageId}`),

  reorderImages: (id: string, imageIds: string[]) =>
    apiClient.patch(`/listings/${id}/images/reorder`, { image_ids: imageIds }),

  toggleFavorite: (id: string) =>
    apiClient.post<{ is_favorited: boolean }>(`/listings/${id}/favorite`),

  getMyListings: (params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Listing>>('/users/me/listings', { params }),

  getMyFavorites: (params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Listing>>('/users/me/favorites', { params }),

  getUserListings: (userId: string, params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Listing>>(`/users/${userId}/listings`, { params }),
}
