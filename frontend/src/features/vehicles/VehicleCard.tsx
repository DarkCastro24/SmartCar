import { CalendarClock, Car, Check, CircleCheck, Pencil, Trash2 } from 'lucide-react'
import { useId, useRef } from 'react'

import { Button } from '../../components/ui/Button'
import { cn } from '../../components/ui/cn'
import { formatMiles, vehicleName } from '../../lib/format'
import type { Vehicle } from '../../lib/types'

interface VehicleCardProps {
  vehicle: Vehicle
  /** Es el vehículo elegido en el selector del encabezado. */
  active: boolean
  onUse: () => void
  onEdit: () => void
  onIntervals: () => void
  onDelete: () => void
}

export function VehicleCard({ vehicle, active, onUse, onEdit, onIntervals, onDelete }: VehicleCardProps) {
  const titleId = useId()
  const titleRef = useRef<HTMLHeadingElement>(null)
  const name = vehicleName(vehicle)

  return (
    <article
      aria-labelledby={titleId}
      className={cn(
        'flex h-full flex-col rounded-2xl border bg-surface p-4 sm:p-5',
        active ? 'border-primary ring-1 ring-primary' : 'border-border',
      )}
    >
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary-text">
          <Car aria-hidden className="size-6" />
        </span>
        <h2
          ref={titleRef}
          id={titleId}
          tabIndex={-1}
          className="min-w-0 flex-1 text-base font-semibold break-words text-fg focus:outline-none"
        >
          {name}
        </h2>
        {active ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
            <CircleCheck aria-hidden className="size-3.5" />
            Activo
          </span>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              onUse()
              // El botón se cambia por la insignia "Activo": el foco pasa al título para no perderse
              titleRef.current?.focus()
            }}
            icon={<Check aria-hidden className="size-4" />}
          >
            Usar este<span className="sr-only"> vehículo: {name}</span>
          </Button>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-surface-2 px-3 py-2.5">
        <Detail label="Placa" value={vehicle.plate} />
        <Detail label="Color" value={vehicle.color} />
        <Detail label="Millaje inicial" value={formatMiles(vehicle.initial_mileage)} />
      </dl>

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onEdit} icon={<Pencil aria-hidden className="size-4" />}>
          Editar<span className="sr-only"> {name}</span>
        </Button>
        <Button
          variant="secondary"
          className="flex-1 sm:flex-none"
          onClick={onIntervals}
          icon={<CalendarClock aria-hidden className="size-4" />}
        >
          Intervalos<span className="sr-only"> de {name}</span>
        </Button>
        {/* En el teléfono solo el ícono; el nombre accesible siempre dice "Eliminar" */}
        <Button
          variant="secondary"
          className="max-sm:w-11 max-sm:px-0 sm:ml-auto"
          onClick={onDelete}
          title="Eliminar vehículo"
          icon={<Trash2 aria-hidden className="size-4 text-critical-text" />}
        >
          <span className="sr-only sm:not-sr-only">Eliminar</span>
          <span className="sr-only"> {name}</span>
        </Button>
      </div>
    </article>
  )
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-fg-2">{label}</dt>
      <dd className={cn('text-sm font-medium break-words', value ? 'text-fg' : 'text-muted')}>{value || '—'}</dd>
    </div>
  )
}
