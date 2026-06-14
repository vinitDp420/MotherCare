import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '@/api/endpoints/patients.api'
import { pregnancyApi } from '@/api/endpoints/pregnancy.api'
import { appointmentsApi } from '@/api/endpoints/appointments.api'
import { bedsApi } from '@/api/endpoints/beds.api'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      // Execute fetches in parallel to minimize latency
      const [
        patientsRes,
        pregnanciesRes,
        appointmentsRes,
        bedsRes,
        occupiedBedsRes
      ] = await Promise.all([
        patientsApi.list({ page: 1 }).catch(() => ({ count: 0 })),
        pregnancyApi.list({ is_active: true, page: 1 }).catch(() => ({ count: 0 })),
        appointmentsApi.getToday({ page: 1 }).catch(() => ({ count: 0 })),
        bedsApi.list({ page: 1 }).catch(() => ({ count: 0 })),
        bedsApi.list({ status: 'occupied', page: 1 }).catch(() => ({ count: 0 })),
      ])

      const totalBeds = bedsRes.count || 0
      const occupiedBeds = occupiedBedsRes.count || 0
      const availableBeds = Math.max(0, totalBeds - occupiedBeds)
      const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0

      return {
        totalPatients: patientsRes.count || 0,
        activePregnancies: pregnanciesRes.count || 0,
        todayAppointments: appointmentsRes.count || 0,
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate,
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })
}
