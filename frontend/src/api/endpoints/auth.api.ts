/**
 * Auth API endpoints
 */
import apiClient from '../client'
import type { LoginRequest, LoginResponse, AuthUser, UserSession } from '@/types/common.types'

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>('/auth/login/', data).then((r) => r.data),

  logout: () =>
    apiClient.post('/auth/logout/').then((r) => r.data),

  me: () =>
    apiClient.get<AuthUser>('/auth/me/').then((r) => r.data),

  getSessions: () =>
    apiClient.get<UserSession[]>('/auth/sessions/').then((r) => r.data),

  revokeSession: (sessionId: string) =>
    apiClient.delete(`/auth/sessions/${sessionId}/`).then((r) => r.data),
}
