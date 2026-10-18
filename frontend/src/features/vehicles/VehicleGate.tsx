import { Car } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { buttonClasses } from '../../components/ui/button-classes'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import type { Vehicle } from '../../lib/types'
import { useSelectedVehicle } from './vehicle-context'

/**
 * Muestra el contenido solo cuando hay un vehículo elegido. Mientras carga,
 * si falla o si el usuario aún no registra ninguno, muestra el estado adecuado.
 */
export function VehicleGate({ children }: { children: (vehicle: Vehicle) => ReactNode }) {
  const { vehicle, isLoading, error, refetch } = useSelectedVehicle()

  if (isLoading) return <LoadingState label="Cargando tus vehículos…" />
  if (error) return <ErrorState error={error} onRetry={refetch} />
  if (!vehicle) return <NoVehicleState />
  return children(vehicle)
}

export function NoVehicleState() {
  return (
    <EmptyState
      icon={Car}
      title="Registra tu primer vehículo"
      description="Agrega tu carro para empezar a llevar el control de sus mantenimientos y del consumo de combustible."
      action={
        <Link to="/registrar?tipo=vehiculo" className={buttonClasses('primary')}>
          Registrar vehículo
        </Link>
      }
    />
  )
}
