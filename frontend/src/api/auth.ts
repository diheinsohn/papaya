import apiClient from './client'

export const authApi = {
  register: (data: { email: string; password: string; username: string }) =>
    apiClient.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    apiClient.post('/auth/login', data),
  refresh: () => apiClient.post('/auth/refresh'),
  logout: () => apiClient.post('/auth/logout'),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),
}

export const usersApi = {
  getMe: () => apiClient.get('/users/me'),
  updateMe: (data: Record<string, unknown>) => apiClient.patch('/users/me', data),
  uploadAvatar: (file: File) => {
    const formData = new FormData()
    formData.append('avatar', file)
    return apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getUser: (id: string) => apiClient.get(`/users/${id}`),
}
