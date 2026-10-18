import type { XAxisTickContentProps } from 'recharts'
import type { ReactNode } from 'react'

import { parseISODate } from '../../lib/format'
import { formatTickMonth } from './chart-data'
import { CHART_COLORS } from './chart-theme'

/** Marca del eje X: el mes y, en enero o en la primera marca, el año debajo. */
export function MonthTick({ x, y, payload, index }: XAxisTickContentProps) {
  // Acepta un mes "2026-10" (eje de categorías) o una fecha en milisegundos (eje de tiempo)
  const date = typeof payload.value === 'string' ? parseISODate(`${payload.value}-01`) : new Date(Number(payload.value))
  const showYear = index === 0 || date.getMonth() === 0
  return (
    <text x={x} y={y} dy={12} textAnchor="middle" fill={CHART_COLORS.text} fontSize={12}>
      <tspan x={x}>{formatTickMonth(date.getTime())}</tspan>
      {showYear && (
        <tspan x={x} dy={14}>
          {date.getFullYear()}
        </tspan>
      )}
    </text>
  )
}

/** Caja del tooltip: el valor manda, la etiqueta acompaña. */
export function TooltipFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="min-w-40 rounded-xl border border-border bg-surface px-3 py-2 text-sm shadow-lg">
      <p className="text-xs text-fg-2">{title}</p>
      <div className="mt-1 space-y-1">{children}</div>
    </div>
  )
}

/** Fila del tooltip con una línea corta del color de la serie como clave. */
export function TooltipRow({ swatchClass, label, value }: { swatchClass?: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      {swatchClass && <span aria-hidden className={`h-0.5 w-3 shrink-0 rounded-full ${swatchClass}`} />}
      <span className="font-semibold text-fg tabular-nums">{value}</span>
      <span className="text-xs text-fg-2">{label}</span>
    </div>
  )
}
