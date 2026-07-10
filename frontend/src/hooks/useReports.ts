import { useQuery } from '@tanstack/react-query'
import { reportsApi } from '@/api/endpoints/reports.api'

export function useReportSummary() {
  return useQuery({
    queryKey: ['report-summary'],
    queryFn: () => reportsApi.summary(),
    staleTime: 60_000,
  })
}

export function useDeliveryStats() {
  return useQuery({
    queryKey: ['report-deliveries'],
    queryFn: () => reportsApi.deliveries(),
    staleTime: 60_000,
  })
}

export function useBedStats() {
  return useQuery({
    queryKey: ['report-beds'],
    queryFn: () => reportsApi.beds(),
    staleTime: 60_000,
  })
}

export function useBillingStats() {
  return useQuery({
    queryKey: ['report-billing'],
    queryFn: () => reportsApi.billing(),
    staleTime: 60_000,
  })
}
