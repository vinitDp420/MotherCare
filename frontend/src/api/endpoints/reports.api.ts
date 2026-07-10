import apiClient from '../client'

export interface ReportSummary {
  patients: { total: number; new_this_month: number }
  beds: { total: number; occupied: number; available: number; occupancy_pct: number }
  deliveries: { total: number; this_month: number; c_sections: number; c_section_pct: number }
  revenue: { total_paid: number; pending: number; this_month: number }
}

export interface DeliveryStats {
  by_mode: { delivery_mode: string; count: number }[]
  monthly_trend: { month: string; count: number }[]
  complication_rate: number
  total: number
}

export interface BedStats {
  by_ward: { ward_type: string; total: number; occupied: number; available: number; cleaning: number; reserved: number }[]
  total: number
  occupied: number
  occupancy_pct: number
}

export interface BillingStats {
  by_type: { bill_type: string; count: number; total_billed: number; total_paid: number }[]
  by_status: { payment_status: string; count: number; amount: number }[]
  monthly_revenue: { month: string; revenue: number }[]
}

export const reportsApi = {
  summary: () =>
    apiClient.get<ReportSummary>('/reports/summary/').then((r) => r.data),

  deliveries: () =>
    apiClient.get<DeliveryStats>('/reports/deliveries/').then((r) => r.data),

  beds: () =>
    apiClient.get<BedStats>('/reports/beds/').then((r) => r.data),

  billing: () =>
    apiClient.get<BillingStats>('/reports/billing/').then((r) => r.data),
}
