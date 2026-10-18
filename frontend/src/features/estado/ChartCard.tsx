import { ChartColumn, Table } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'

import { Tabs, type TabItem } from '../../components/ui/Tabs'

type View = 'chart' | 'table'

const VIEWS: TabItem<View>[] = [
  { value: 'chart', label: 'Gráfica', icon: ChartColumn },
  { value: 'table', label: 'Tabla', icon: Table },
]

interface ChartCardProps {
  title: string
  description?: ReactNode
  /** Leyenda o clave de la gráfica (a la izquierda del selector de vista) */
  legend?: ReactNode
  chart: ReactNode
  table: ReactNode
}

/** Tarjeta de gráfica con su vista de tabla equivalente. */
export function ChartCard({ title, description, legend, chart, table }: ChartCardProps) {
  const [view, setView] = useState<View>('chart')
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <h2 id={titleId} className="text-base font-semibold text-fg">
        {title}
      </h2>
      {description && <p className="mt-0.5 text-sm text-fg-2">{description}</p>}

      <div className="mt-4 mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">{legend}</div>
        <Tabs items={VIEWS} value={view} onChange={setView} ariaLabel={`Vista de ${title}`} className="w-full sm:w-56" />
      </div>

      {view === 'chart' ? (
        // El contorno de foco solo aparece al llegar con el teclado, no al tocar la gráfica
        <div className="[&_.recharts-surface:focus:not(:focus-visible)]:outline-none">{chart}</div>
      ) : (
        table
      )}
    </section>
  )
}

/** Clave de una serie: muestra del color (línea o barra) + nombre en color de texto. */
export function LegendItem({ label, swatchClass, shape }: { label: string; swatchClass: string; shape: 'line' | 'bar' }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-fg-2">
      <span
        aria-hidden
        className={shape === 'line' ? `h-0.5 w-4 rounded-full ${swatchClass}` : `size-3 rounded-[3px] ${swatchClass}`}
      />
      {label}
    </span>
  )
}
