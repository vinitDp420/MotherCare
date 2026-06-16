import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { laboratoryApi } from '@/api/endpoints/laboratory.api'
import type {
  LabTestWritePayload,
  LabStatusUpdatePayload,
  LabReportUploadPayload,
} from '@/types/laboratory.types'

export function useLabTestsList(params?: { status?: string; urgency?: string; patient?: string; ordered_by?: string; flagged?: boolean; page?: number; search?: string; consultation?: string }) {
  return useQuery({
    queryKey: ['lab-tests-list', params],
    queryFn: () => laboratoryApi.list(params),
    placeholderData: (prev) => prev,
  })
}

export function useLabTestDetail(id: string) {
  return useQuery({
    queryKey: ['lab-test', id],
    queryFn: () => laboratoryApi.get(id),
    enabled: !!id,
  })
}

export function useCreateLabTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: LabTestWritePayload) => laboratoryApi.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests-list'] })
      queryClient.invalidateQueries({ queryKey: ['lab-queue'] })
      if (data.consultation) {
        queryClient.invalidateQueries({ queryKey: ['consultation', data.consultation] })
      }
    },
  })
}

export function useUpdateLabStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LabStatusUpdatePayload }) =>
      laboratoryApi.updateStatus(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-tests-list'] })
      queryClient.invalidateQueries({ queryKey: ['lab-queue'] })
      queryClient.invalidateQueries({ queryKey: ['lab-test', data.id] })
      if (data.consultation) {
        queryClient.invalidateQueries({ queryKey: ['consultation', data.consultation] })
      }
    },
  })
}

export function useUploadLabReport() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LabReportUploadPayload }) =>
      laboratoryApi.uploadReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lab-test', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['lab-tests-list'] })
    },
  })
}

export function useFlagLabTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      laboratoryApi.flag(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['lab-test', data.id] })
      queryClient.invalidateQueries({ queryKey: ['lab-tests-list'] })
      queryClient.invalidateQueries({ queryKey: ['lab-flagged'] })
    },
  })
}

export function useLabQueue(params?: { urgency?: string; status?: string; page?: number }) {
  return useQuery({
    queryKey: ['lab-queue', params],
    queryFn: () => laboratoryApi.getQueue(params),
    placeholderData: (prev) => prev,
  })
}

export function useFlaggedLabTests(params?: { limit?: number }) {
  return useQuery({
    queryKey: ['lab-flagged', params],
    queryFn: () => laboratoryApi.getFlagged(params),
  })
}
