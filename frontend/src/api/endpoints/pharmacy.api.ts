import apiClient from '../client'
import type { PaginatedResponse } from '@/types/common.types'
import type {
  Medicine,
  MedicineBatch,
  PharmacySale,
  DispensePayload,
  OtcSalePayload,
  CreateBatchPayload
} from '@/types/pharmacy.types'

export const pharmacyApi = {
  // Medicines Master Formulary
  listMedicines: (params?: { page?: number; search?: string; is_active?: boolean; category?: string; ordering?: string }) =>
    apiClient.get<PaginatedResponse<Medicine>>('/pharmacy/medicines/', { params }).then((r) => r.data),

  getMedicine: (id: string) =>
    apiClient.get<Medicine>(`/pharmacy/medicines/${id}/`).then((r) => r.data),

  createMedicine: (data: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) =>
    apiClient.post<Medicine>('/pharmacy/medicines/', data).then((r) => r.data),

  updateMedicine: (id: string, data: Partial<Omit<Medicine, 'id'>>) =>
    apiClient.patch<Medicine>(`/pharmacy/medicines/${id}/`, data).then((r) => r.data),

  deleteMedicine: (id: string) =>
    apiClient.delete(`/pharmacy/medicines/${id}/`).then((r) => r.data),

  // Medicine Batches (Inventory)
  listBatches: (params?: { page?: number; search?: string; medicine?: string; expiry_date?: string; ordering?: string }) =>
    apiClient.get<PaginatedResponse<MedicineBatch>>('/pharmacy/batches/', { params }).then((r) => r.data),

  getBatch: (id: string) =>
    apiClient.get<MedicineBatch>(`/pharmacy/batches/${id}/`).then((r) => r.data),

  createBatch: (data: CreateBatchPayload) =>
    apiClient.post<MedicineBatch>('/pharmacy/batches/', data).then((r) => r.data),

  updateBatch: (id: string, data: Partial<Omit<MedicineBatch, 'id' | 'medicine_name'>>) =>
    apiClient.patch<MedicineBatch>(`/pharmacy/batches/${id}/`, data).then((r) => r.data),

  deleteBatch: (id: string) =>
    apiClient.delete(`/pharmacy/batches/${id}/`).then((r) => r.data),

  // Pharmacy Sales (Transactions)
  listSales: (params?: { page?: number; search?: string; patient?: string; prescription?: string; invoice_number?: string }) =>
    apiClient.get<PaginatedResponse<PharmacySale>>('/pharmacy/sales/', { params }).then((r) => r.data),

  dispense: (data: DispensePayload) =>
    apiClient.post<PharmacySale>('/pharmacy/sales/dispense/', data).then((r) => r.data),

  otcSale: (data: OtcSalePayload) =>
    apiClient.post<PharmacySale>('/pharmacy/sales/otc-sale/', data).then((r) => r.data),
}
