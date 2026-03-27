import apiClient from './client'
import type { Review } from '../types/review'
import type { PaginatedResponse } from '../types/listing'

export const reviewsApi = {
  create: (data: { listing_id: string; rating: number; comment: string }) =>
    apiClient.post<Review>('/reviews', data),

  getUserReviews: (userId: string, params?: { page?: number; per_page?: number }) =>
    apiClient.get<PaginatedResponse<Review>>(`/users/${userId}/reviews`, { params }),

  canReview: (listingId: string) =>
    apiClient.get<{ can_review: boolean }>(`/reviews/can-review/${listingId}`),

  canReviewAsSeller: (listingId: string) =>
    apiClient.get<{ can_review: boolean }>(`/reviews/can-review-as-seller/${listingId}`),
}
