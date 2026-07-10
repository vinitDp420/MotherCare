import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'

export interface Bill {
  id: string
  patient: string
  patient_name: string
  patient_mrn: string
  admission?: string
  bill_type: string
  bill_type_display: string
  invoice_number: string
  total_amount: number
  amount_paid: number
  payment_status: string
  payment_status_display: string
  notes: string
  generated_at: string
  items: BillItem[]
  payments: BillPayment[]
}

export interface BillItem {
  id: string
  item_type: string
  item_name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface BillPayment {
  id: string
  amount: number
  payment_method: string
  transaction_ref: string
  paid_at: string
}

export interface BillWritePayload {
  patient: string
  bill_type: string
  admission?: string
  notes?: string
  items?: { item_type: string; item_name: string; quantity: number; unit_price: number }[]
}

export interface PaymentPayload {
  amount: number
  payment_method: string
  transaction_ref?: string
}

export const billingApi = {
  list: (params?: { patient?: string; bill_type?: string; payment_status?: string; page?: number; search?: string }) =>
    apiClient.get<PaginatedResponse<Bill>>('/billing/bills/', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Bill>(`/billing/bills/${id}/`).then((r) => r.data),

  create: (data: BillWritePayload) =>
    apiClient.post<Bill>('/billing/bills/', data).then((r) => r.data),

  update: (id: string, data: Partial<BillWritePayload>) =>
    apiClient.patch<Bill>(`/billing/bills/${id}/`, data).then((r) => r.data),

  recordPayment: (id: string, data: PaymentPayload) =>
    apiClient.post<BillPayment>(`/billing/bills/${id}/record-payment/`, data).then((r) => r.data),

  listPayments: (params?: { bill?: string; payment_method?: string; page?: number }) =>
    apiClient.get<PaginatedResponse<BillPayment>>('/billing/payments/', { params }).then((r) => r.data),
}
