import { ArrowRight, Info, Minus, TrendingDown, TrendingUp, Wrench, type LucideIcon } from 'lucide-react'
import { useId, useMemo } from 'react'

import { cn } from '../../components/ui/cn'
import { formatDate, formatPercent } from '../../lib/format'
import { MAINTENANCE_META } from '../../lib/maintenance'
import type { MaintenanceImpact } from '../../lib/types'
import { buildImpactRows, type ImpactRow, type ImpactTrend } from './chart-data'
import { formatMpgValue } from './formats'
import { InlineEmpty } from './InlineEmpty'

const TREND_META: Record<ImpactTrend, { icon: LucideIcon; text: (change: number) => string; className: string }> = {
  mejora: { icon: TrendingUp, text: (change) => `Mejora ${formatPercent(change)}`, className: 'text-good-text' },
  empeora: {
    icon: TrendingDown,
    text: (change) => `Empeora ${formatPercent(Math.abs(change))}`,
    className: 'text-critical-text',
  },
  igual: {
    icon: Minus,
    text: (change) => `Sin cambio notable (${formatPercent(change, true)})`,
    className: 'text-fg-2',
  },
}

/** MPG promedio antes y después de cada mantenimiento. */
export function ImpactSection({ impact }: { impact: MaintenanceImpact[] }) {
  const titleId = useId()
  const rows = useMemo(() => buildImpactRows(impact), [impact])

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 id={titleId} className="text-base font-semibold text-fg">
        Antes y después de cada mantenimiento
      </h2>
      <p className="mt-0.5 text-sm text-fg-2">
        MPG promedio de hasta 3 tramos antes y 3 después de cada mantenimiento.
      </p>

      {rows.length === 0 ? (
        <InlineEmpty
          icon={Wrench}
          title="Todavía no hay comparaciones"
          description="Se necesitan cargas con el tanque lleno antes y después de un mantenimiento para comparar el rendimiento."
        />
      ) : (
        <>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {rows.map((row) => (
              <ImpactItem key={row.id} row={row} />
            ))}
          </ul>
          <p className="mt-4 flex items-start gap-2 text-xs text-fg-2">
            <Info aria-hidden className="mt-px size-4 shrink-0" />
            Si dos mantenimientos están muy cerca, la comparación mezcla el efecto de ambos.
          </p>
        </>
      )}
    </section>
  )
}

function ImpactItem({ row }: { row: ImpactRow }) {
  const Icon = MAINTENANCE_META[row.type].icon
  const trend = TREND_META[row.trend]
  const TrendIcon = trend.icon

  return (
    <li className="rounded-xl border border-border p-3">
      <div className="flex items-start gap-2">
        <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-fg-2" />
        <div className="min-w-0">
          <p className="font-medium text-fg">{row.label}</p>
          <p className="text-xs text-fg-2">{formatDate(row.date)}</p>
        </div>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-fg tabular-nums">
        <span className="sr-only">Pasó de</span>
        <span>{formatMpgValue(row.before)}</span>
        <ArrowRight aria-hidden className="size-4 text-fg-2" />
        <span className="sr-only">a</span>
        <span className="font-semibold">{formatMpgValue(row.after)}</span>
        <span className="text-sm text-fg-2">MPG</span>
      </p>
      <p className={cn('mt-1 flex items-center gap-1.5 text-sm font-medium', trend.className)}>
        <TrendIcon aria-hidden className="size-4 shrink-0" />
        {trend.text(row.changePct)}
      </p>
    </li>
  )
}
