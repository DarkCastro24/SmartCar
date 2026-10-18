import { createContext, useContext } from 'react'

import type { Vehicle } from '../../lib/types'

export interface VehicleContextValue {
  vehicles: Vehicle[]
  /** Vehículo elegido en el selector del encabezado (null si no hay ninguno). */
  vehicle: Vehicle | null
  isLoading: boolean
  error: unknown
  refetch: () => void
  selectVehicle: (id: number) => void
}

export const VehicleContext = createContext<VehicleContextValue | null>(null)

export function useSelectedVehicle() {
  const context = useContext(VehicleContext)
  if (!context) throw new Error('useSelectedVehicle debe usarse dentro de <VehicleProvider>')
  return context
}
