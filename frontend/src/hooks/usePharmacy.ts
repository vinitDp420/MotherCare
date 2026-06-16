import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pharmacyApi } from '@/api/endpoints/pharmacy.api'
import type {
  Medicine,
  MedicineBatch,
  DispensePayload,
  OtcSalePayload,
  CreateBatchPayload
} from '@/types/pharmacy.types'

// Medicines Formulary
export function useMedicinesList(params?: { page?: number; search?: string; is_active?: boolean; category?: string; ordering?: string }) {
  return useQuery({
    queryKey: ['medicines-list', params],
    queryFn: () => pharmacyApi.listMedicines(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateMedicine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Omit<Medicine, 'id' | 'created_at' | 'updated_at'>) =>
      pharmacyApi.createMedicine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}

export function useUpdateMedicine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<Medicine, 'id'>> }) =>
      pharmacyApi.updateMedicine(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicine', data.id] })
    },
  })
}

export function useDeleteMedicine() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pharmacyApi.deleteMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}

// Medicine Batches (Inventory)
export function useBatchesList(params?: { page?: number; search?: string; medicine?: string; expiry_date?: string; ordering?: string }) {
  return useQuery({
    queryKey: ['medicine-batches-list', params],
    queryFn: () => pharmacyApi.listBatches(params),
    placeholderData: (prev) => prev,
  })
}

export function useCreateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBatchPayload) =>
      pharmacyApi.createBatch(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-batches-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}

export function useUpdateBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Omit<MedicineBatch, 'id' | 'medicine_name'>> }) =>
      pharmacyApi.updateBatch(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-batches-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}

export function useDeleteBatch() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => pharmacyApi.deleteBatch(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicine-batches-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}

// Sales Transactions
export function useSalesList(params?: { page?: number; search?: string; patient?: string; prescription?: string; invoice_number?: string }) {
  return useQuery({
    queryKey: ['pharmacy-sales-list', params],
    queryFn: () => pharmacyApi.listSales(params),
    placeholderData: (prev) => prev,
  })
}

export function useDispensePrescription() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: DispensePayload) => pharmacyApi.dispense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-sales-list'] })
      queryClient.invalidateQueries({ queryKey: ['prescriptions'] })
      queryClient.invalidateQueries({ queryKey: ['medicine-batches-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}

export function useOtcSale() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: OtcSalePayload) => pharmacyApi.otcSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pharmacy-sales-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicine-batches-list'] })
      queryClient.invalidateQueries({ queryKey: ['medicines-list'] })
    },
  })
}
