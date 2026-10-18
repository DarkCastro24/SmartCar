import type { ReactNode } from 'react'

import { StatusBadge } from '../../components/ui/Badge'
import { Spinner } from '../../components/ui/States'
import { formatMiles, formatMoney, vehicleName } from '../../lib/format'
import type { VehicleStats, VehicleStatus } from '../../lib/types'
import { formatCostPerMile, formatMpgFixed } from './formats'
import { summarizeStatus } from './status-text'

interface SummarySectionProps {
  status: VehicleStatus
  /** Las estadísticas llegan en otra consulta; mientras cargan se muestra un indicador */
  stats: VehicleStats | undefined
  statsLoading: boolean
}

/** Millaje actual (cifra protagonista), estado general y fichas de rendimiento y gasto. */
export function SummarySection({ status, stats, statsLoading }: SummarySectionProps) {
  const { vehicle } = status
  const pending = statsLoading ? <Spinner className="size-5 text-fg-2" /> : null
  const noMpg = 'Necesita dos cargas con tanque lleno'

  return (
    <section aria-label="Resumen" className="rounded-2xl border border-border bg-surface p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-fg-2">Millaje actual</p>
          <p className="text-5xl font-semibold tracking-tight text-fg">{formatMiles(status.current_mileage)}</p>
          <p className="mt-1 text-fg-2">
            {vehicleName(vehicle)}
            {vehicle.plate && <span className="text-sm"> · {vehicle.plate}</span>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="sr-only">Estado general:</span>
          <StatusBadge status={status.overall} />
          <span className="text-sm text-fg-2">{summarizeStatus(status.summary)}</span>
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Rendimiento promedio"
          hint={status.fuel.avg_mpg == null ? noMpg : 'Todos los tramos de tanque lleno'}
        >
          {formatMpgFixed(status.fuel.avg_mpg)}
        </StatTile>
        <StatTile label="Último rendimiento" hint={status.fuel.last_mpg == null ? noMpg : 'Tramo más reciente'}>
          {formatMpgFixed(status.fuel.last_mpg)}
        </StatTile>
        <StatTile
          label="Combustible por milla"
          hint={stats && stats.fuel.cost_per_mile == null ? 'Necesita cargas con precio y MPG' : 'Precio por galón ÷ MPG'}
        >
          {pending ?? formatCostPerMile(stats?.fuel.cost_per_mile)}
        </StatTile>
        <StatTile label="Gasto total registrado" hint="Mantenimiento y combustible">
          {pending ?? formatMoney(stats?.costs.total)}
        </StatTile>
      </dl>
    </section>
  )
}

function StatTile({ label, hint, children }: { label: string; hint: string; children: ReactNode }) {
  return (
    // Subcuadrícula: etiqueta, valor y nota quedan alineados entre fichas de la misma fila
    <div className="row-span-3 grid grid-rows-subgrid gap-1 rounded-xl bg-surface-2 p-3">
      <dt className="text-sm text-fg-2">{label}</dt>
      <dd className="text-xl font-semibold text-fg">{children}</dd>
      <dd className="text-xs text-fg-2">{hint}</dd>
    </div>
  )
}
