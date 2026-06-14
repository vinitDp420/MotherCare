/// <reference types="vite/client" />
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from '@/types/common.types'

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api/v1'

const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─────────────────────────────────────────────────────────────────────────────
// Request Interceptor — inject auth token
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('mc_token')
    if (token) {
      config.headers.Authorization = `Token ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ─────────────────────────────────────────────────────────────────────────────
// Response Interceptor — handle auth errors and normalize errors
// ─────────────────────────────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear stale token and redirect to login
      localStorage.removeItem('mc_token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Normalize error for consistent handling
    const normalizedError: ApiError = error.response?.data ?? {
      detail: error.message || 'An unexpected error occurred.',
      code: 'network_error',
    }

    return Promise.reject(normalizedError)
  }
)

export default apiClient
