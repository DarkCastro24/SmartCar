import { Car, Settings2 } from 'lucide-react'
import { Link } from 'react-router'

import { useSelectedVehicle } from '../../features/vehicles/vehicle-context'
import { vehicleName } from '../../lib/format'
import { cn } from '../ui/cn'

/** Selector del vehículo activo; todas las secciones muestran los datos de este. */
export function VehicleSwitcher({ className }: { className?: string }) {
  const { vehicles, vehicle, selectVehicle, isLoading } = useSelectedVehicle()

  if (isLoading) return null

  if (!vehicle) {
    return (
      <Link
        to="/registrar?tipo=vehiculo"
        className={cn('inline-flex h-9 items-center gap-2 rounded-xl px-3 text-sm font-medium text-primary-text hover:bg-surface-2', className)}
      >
        <Car aria-hidden className="size-4" />
        Agregar vehículo
      </Link>
    )
  }

  return (
    <div className={cn('flex min-w-0 items-center gap-1', className)}>
      <label htmlFor="vehicle-switcher" className="sr-only">
        Vehículo
      </label>
      <div className="relative min-w-0">
        <Car aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-fg-2" />
        <select
          id="vehicle-switcher"
          value={vehicle.id}
          onChange={(event) => selectVehicle(Number(event.target.value))}
          className="h-9 w-full max-w-[13rem] cursor-pointer appearance-none truncate rounded-xl border border-border bg-surface pl-8 pr-3 text-sm font-medium text-fg hover:bg-surface-2 focus:border-primary focus:outline-none sm:max-w-[16rem]"
        >
          {vehicles.map((item) => (
            <option key={item.id} value={item.id}>
              {vehicleName(item)}
            </option>
          ))}
        </select>
      </div>
      <Link
        to="/vehiculos"
        aria-label="Administrar vehículos"
        title="Administrar vehículos"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-fg-2 hover:bg-surface-2 hover:text-fg"
      >
        <Settings2 aria-hidden className="size-4" />
      </Link>
    </div>
  )
}
