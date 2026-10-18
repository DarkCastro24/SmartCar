import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'

import { api } from './api'
import type {
  DateRangeFilters,
  FuelInput,
  FuelLog,
  Interval,
  IntervalInput,
  MaintenanceFilters,
  MaintenanceInput,
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceTypeInfo,
  User,
  Vehicle,
  VehicleInput,
  VehicleStats,
  VehicleStatus,
} from './types'

/**
 * Llaves del caché. Todo lo de un vehículo cuelga de ['vehicles', id], así que al
 * registrar o editar algo basta con invalidar ese prefijo para refrescar estado,
 * estadísticas e historial.
 */
export const queryKeys = {
  me: ['me'] as const,
  maintenanceTypes: ['maintenance-types'] as const,
  vehicles: ['vehicles'] as const,
  vehicle: (id: number) => ['vehicles', id] as const,
  status: (id: number) => ['vehicles', id, 'status'] as const,
  stats: (id: number) => ['vehicles', id, 'stats'] as const,
  maintenance: (id: number, filters: MaintenanceFilters = {}) =>
    ['vehicles', id, 'maintenance', cleanFilters(filters)] as const,
  fuel: (id: number, filters: DateRangeFilters = {}) =>
    ['vehicles', id, 'fuel', cleanFilters(filters)] as const,
  intervals: (id: number) => ['vehicles', id, 'intervals'] as const,
}

/** Quita filtros vacíos para no mandar ?type=&from= al backend. */
function cleanFilters<T extends object>(filters: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ) as Partial<T>
}

function invalidateVehicle(queryClient: QueryClient, vehicleId: number) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.vehicle(vehicleId) })
}

// ---------------------------------------------------------------- Lecturas

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: async () => (await api.get<User>('/auth/me')).data,
    enabled,
  })
}

export function useMaintenanceTypes() {
  return useQuery({
    queryKey: queryKeys.maintenanceTypes,
    queryFn: async () => (await api.get<MaintenanceTypeInfo[]>('/maintenance-types')).data,
    staleTime: Infinity,
  })
}

export function useVehicles(enabled = true) {
  return useQuery({
    queryKey: queryKeys.vehicles,
    queryFn: async () => (await api.get<Vehicle[]>('/vehicles')).data,
    enabled,
  })
}

export function useVehicleStatus(vehicleId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.status(vehicleId ?? 0),
    queryFn: async () => (await api.get<VehicleStatus>(`/vehicles/${vehicleId}/status`)).data,
    enabled: vehicleId != null,
  })
}

export function useVehicleStats(vehicleId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.stats(vehicleId ?? 0),
    queryFn: async () => (await api.get<VehicleStats>(`/vehicles/${vehicleId}/stats`)).data,
    enabled: vehicleId != null,
  })
}

export function useMaintenanceRecords(vehicleId: number | undefined, filters: MaintenanceFilters = {}) {
  return useQuery({
    queryKey: queryKeys.maintenance(vehicleId ?? 0, filters),
    queryFn: async () =>
      (
        await api.get<MaintenanceRecord[]>(`/vehicles/${vehicleId}/maintenance`, {
          params: cleanFilters(filters),
        })
      ).data,
    enabled: vehicleId != null,
  })
}

export function useFuelLogs(vehicleId: number | undefined, filters: DateRangeFilters = {}) {
  return useQuery({
    queryKey: queryKeys.fuel(vehicleId ?? 0, filters),
    queryFn: async () =>
      (await api.get<FuelLog[]>(`/vehicles/${vehicleId}/fuel`, { params: cleanFilters(filters) })).data,
    enabled: vehicleId != null,
  })
}

export function useIntervals(vehicleId: number | undefined) {
  return useQuery({
    queryKey: queryKeys.intervals(vehicleId ?? 0),
    queryFn: async () => (await api.get<Interval[]>(`/vehicles/${vehicleId}/intervals`)).data,
    enabled: vehicleId != null,
  })
}

// ---------------------------------------------------------------- Vehículos

export function useCreateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: VehicleInput) => (await api.post<Vehicle>('/vehicles', input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles }),
  })
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<VehicleInput> & { id: number }) =>
      (await api.put<Vehicle>(`/vehicles/${id}`, input)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.vehicles }),
  })
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/vehicles/${id}`)
      return id
    },
    onSuccess: (id) => {
      queryClient.removeQueries({ queryKey: queryKeys.vehicle(id) })
      return queryClient.invalidateQueries({ queryKey: queryKeys.vehicles })
    },
  })
}

// ---------------------------------------------------------------- Mantenimientos

export function useCreateMaintenance(vehicleId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: MaintenanceInput) =>
      (await api.post<MaintenanceRecord>(`/vehicles/${vehicleId}/maintenance`, input)).data,
    onSuccess: (record) => invalidateVehicle(queryClient, record.vehicle_id),
  })
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<MaintenanceInput> & { id: number }) =>
      (await api.put<MaintenanceRecord>(`/maintenance/${id}`, input)).data,
    onSuccess: (record) => invalidateVehicle(queryClient, record.vehicle_id),
  })
}

export function useDeleteMaintenance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number; vehicleId: number }) => {
      await api.delete(`/maintenance/${id}`)
    },
    onSuccess: (_data, { vehicleId }) => invalidateVehicle(queryClient, vehicleId),
  })
}

// ---------------------------------------------------------------- Combustible

export function useCreateFuelLog(vehicleId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (input: FuelInput) =>
      (await api.post<FuelLog>(`/vehicles/${vehicleId}/fuel`, input)).data,
    onSuccess: (log) => invalidateVehicle(queryClient, log.vehicle_id),
  })
}

export function useUpdateFuelLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<FuelInput> & { id: number }) =>
      (await api.put<FuelLog>(`/fuel/${id}`, input)).data,
    onSuccess: (log) => invalidateVehicle(queryClient, log.vehicle_id),
  })
}

export function useDeleteFuelLog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }: { id: number; vehicleId: number }) => {
      await api.delete(`/fuel/${id}`)
    },
    onSuccess: (_data, { vehicleId }) => invalidateVehicle(queryClient, vehicleId),
  })
}

// ---------------------------------------------------------------- Intervalos

export function useSaveIntervals(vehicleId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (items: IntervalInput[]) =>
      (await api.put<Interval[]>(`/vehicles/${vehicleId}/intervals`, items)).data,
    onSuccess: () => invalidateVehicle(queryClient, vehicleId ?? 0),
  })
}

export function useResetInterval(vehicleId: number | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (type: MaintenanceType) =>
      (await api.delete<Interval[]>(`/vehicles/${vehicleId}/intervals/${type}`)).data,
    onSuccess: () => invalidateVehicle(queryClient, vehicleId ?? 0),
  })
}
