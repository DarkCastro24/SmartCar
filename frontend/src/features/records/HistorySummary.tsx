import { cn } from '../../components/ui/cn'
import { formatMoney, formatNumber } from '../../lib/format'
import type { RecordsSummary } from './summary'

interface HistorySummaryProps {
  summary: RecordsSummary
  filtered: boolean
}

/** Totales de lo que se está viendo (con o sin filtros). */
export function HistorySummary({ summary, filtered }: HistorySummaryProps) {
  const hasGallons = summary.gallons != null
  return (
    <section aria-label="Resumen" className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-fg-2">
        {filtered ? 'Resumen de lo filtrado' : 'Resumen de todo el historial'}
      </p>
      <dl className={cn('grid gap-2', hasGallons ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
        <Stat label="Registros" value={formatNumber(summary.count)} />
        <Stat label="Total gastado" value={formatMoney(summary.total)} />
        {/* Un decimal basta para el total y cabe en el teléfono */}
        {hasGallons && <Stat label="Galones" value={`${formatNumber(summary.gallons, 1)} gal`} />}
      </dl>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface px-3 py-2.5">
      <dt className="truncate text-xs text-fg-2">{label}</dt>
      <dd className="mt-0.5 text-base font-semibold tabular-nums text-fg sm:text-lg">{value}</dd>
    </div>
  )
}
