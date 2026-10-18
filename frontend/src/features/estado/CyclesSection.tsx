import { Repeat } from 'lucide-react'
import { useId, useMemo } from 'react'

import { formatMiles, formatNumber } from '../../lib/format'
import { MAINTENANCE_META } from '../../lib/maintenance'
import type { MaintenanceCycleSummary, StatusItem } from '../../lib/types'
import { buildCycleRows, type CycleRow } from './chart-data'
import { InlineEmpty } from './InlineEmpty'
import { describeInterval, formatDuration } from './status-text'

interface CyclesSectionProps {
  cycles: MaintenanceCycleSummary[]
  /** Para comparar con el intervalo configurado de cada componente */
  items: StatusItem[]
}

/** Cuánto dura en promedio cada cambio (tipos con 2 registros o más). */
export function CyclesSection({ cycles, items }: CyclesSectionProps) {
  const titleId = useId()
  const rows = useMemo(() => buildCycleRows(cycles), [cycles])
  const intervals = useMemo(() => new Map(items.map((item) => [item.type, item])), [items])

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 id={titleId} className="text-base font-semibold text-fg">
        Duración de cada cambio
      </h2>
      <p className="mt-0.5 text-sm text-fg-2">Promedio de millas y días entre un cambio y el siguiente.</p>

      {rows.length === 0 ? (
        <InlineEmpty
          icon={Repeat}
          title="Aún no hay cambios repetidos"
          description="Cuando registres el mismo mantenimiento dos veces o más, aquí verás cuánto dura cada cambio."
        />
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {rows.map((row) => (
            <CycleItem key={row.type} row={row} interval={intervals.get(row.type)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function CycleItem({ row, interval }: { row: CycleRow; interval?: StatusItem }) {
  const Icon = MAINTENANCE_META[row.type].icon
  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex items-start gap-2">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-2" />
        <div className="min-w-0">
          <p className="font-medium text-fg">{row.label}</p>
          <p className="text-xs text-fg-2">{formatNumber(row.times)} registros</p>
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <dt className="text-xs text-fg-2">Millas entre cambios</dt>
          <dd className="text-lg font-semibold text-fg">{formatMiles(row.avgMiles)}</dd>
        </div>
        <div>
          <dt className="text-xs text-fg-2">Días entre cambios</dt>
          <dd className="text-lg font-semibold text-fg">
            {row.avgDays != null ? formatDuration(row.avgDays, { exactDays: true }) : '—'}
          </dd>
          {row.avgDays != null && row.avgDays >= 90 && (
            <dd className="text-xs text-fg-2">Unos {formatDuration(row.avgDays)}</dd>
          )}
        </div>
      </dl>
      {interval && (
        <p className="mt-2 text-xs text-fg-2">
          Intervalo actual: {describeInterval(interval.every_miles, interval.every_months).toLowerCase()}
        </p>
      )}
    </li>
  )
}
