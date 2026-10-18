import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { useVehicles } from '../../lib/queries'
import { readStorage, STORAGE_KEYS, writeStorage } from '../../lib/storage'
import { VehicleContext, type VehicleContextValue } from './vehicle-context'

function readStoredId() {
  const raw = readStorage(STORAGE_KEYS.vehicleId)
  const id = raw ? Number(raw) : NaN
  return Number.isInteger(id) ? id : null
}

export function VehicleProvider({ children }: { children: ReactNode }) {
  const query = useVehicles()
  const [selectedId, setSelectedId] = useState<number | null>(readStoredId)

  const selectVehicle = useCallback((id: number) => {
    setSelectedId(id)
    writeStorage(STORAGE_KEYS.vehicleId, String(id))
  }, [])

  const { refetch } = query
  const value = useMemo<VehicleContextValue>(() => {
    const vehicles = query.data ?? []
    return {
      vehicles,
      // Si el elegido ya no existe (se borró), se usa el primero
      vehicle: vehicles.find((v) => v.id === selectedId) ?? vehicles[0] ?? null,
      isLoading: query.isPending,
      error: query.error,
      refetch: () => void refetch(),
      selectVehicle,
    }
  }, [query.data, query.isPending, query.error, refetch, selectedId, selectVehicle])

  return <VehicleContext value={value}>{children}</VehicleContext>
}
