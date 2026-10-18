// Armado de datos para las gráficas y listas de rendimiento (funciones puras).
import { parseISODate } from '../../lib/format'
import { MAINTENANCE_TYPES } from '../../lib/maintenance'
import type {
  MaintenanceCycleSummary,
  MaintenanceImpact,
  MaintenanceType,
  MonthlyCost,
  MpgSegment,
} from '../../lib/types'

const LOCALE = 'es-SV'
const monthShort = new Intl.DateTimeFormat(LOCALE, { month: 'short' })
const DAY_MS = 24 * 60 * 60 * 1000

// ---------------------------------------------------------------- Rendimiento (MPG)

export interface MpgPoint {
  /** Fecha de la carga como número (ms) para el eje X de tiempo */
  time: number
  date: string
  mpg: number
  miles: number
  gallons: number
  /** Mantenimientos hechos desde la carga anterior hasta esta */
  maintenance: string[]
}

export interface MaintenanceMarker {
  time: number
  date: string
  label: string
  /** false si queda demasiado cerca de la marca anterior: se dibuja la línea sin ícono */
  showIcon: boolean
}

/** Cada tramo de tanque lleno, con los mantenimientos que ocurrieron en él. */
export function buildMpgPoints(series: readonly MpgSegment[], impact: readonly MaintenanceImpact[]): MpgPoint[] {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date) || a.end_mileage - b.end_mileage)
  return sorted.map((segment, index) => {
    const previous = index > 0 ? sorted[index - 1].date : segment.date
    const maintenance = impact
      .filter((event) => (index === 0 ? event.date === segment.date : event.date > previous && event.date <= segment.date))
      .map((event) => event.label)
    return {
      time: parseISODate(segment.date).getTime(),
      date: segment.date,
      mpg: segment.mpg,
      miles: segment.miles,
      gallons: segment.gallons,
      maintenance: [...new Set(maintenance)],
    }
  })
}

/**
 * Marcas verticales: solo las que caen dentro del rango de la gráfica, una por fecha.
 * `minIconGap` es la distancia mínima entre íconos como fracción del ancho del eje.
 */
export function buildMaintenanceMarkers(
  impact: readonly MaintenanceImpact[],
  points: readonly MpgPoint[],
  minIconGap = 0.05,
): MaintenanceMarker[] {
  if (!points.length) return []
  const first = points[0].date
  const last = points[points.length - 1].date
  const byDate = new Map<string, string[]>()
  for (const event of impact) {
    if (event.date < first || event.date > last) continue
    const labels = byDate.get(event.date) ?? []
    if (!labels.includes(event.label)) labels.push(event.label)
    byDate.set(event.date, labels)
  }
  const [start, end] = timeDomain(points)
  let lastIconTime: number | null = null
  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, labels]) => {
      const time = parseISODate(date).getTime()
      const showIcon = lastIconTime == null || (time - lastIconTime) / (end - start) >= minIconGap
      if (showIcon) lastIconTime = time
      return { time, date, label: labels.join(', '), showIcon }
    })
}

/** Rango del eje X; con un solo punto se abre 15 días a cada lado. */
export function timeDomain(points: readonly MpgPoint[]): [number, number] {
  const start = points[0]?.time ?? 0
  const end = points[points.length - 1]?.time ?? 0
  return start === end ? [start - 15 * DAY_MS, end + 15 * DAY_MS] : [start, end]
}

/** Rango del eje Y en números enteros con un margen de 1 MPG. */
export function mpgDomain(points: readonly MpgPoint[]): [number, number] {
  const values = points.map((point) => point.mpg)
  if (!values.length) return [0, 1]
  return [Math.max(Math.floor(Math.min(...values)) - 1, 0), Math.ceil(Math.max(...values)) + 1]
}

/** Primer día de cada mes dentro del rango (para las marcas del eje X). */
export function monthTicks([start, end]: [number, number]) {
  const ticks: number[] = []
  const cursor = new Date(start)
  cursor.setDate(1)
  cursor.setHours(0, 0, 0, 0)
  if (cursor.getTime() < start) cursor.setMonth(cursor.getMonth() + 1)
  while (cursor.getTime() <= end) {
    ticks.push(cursor.getTime())
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return ticks
}

/** Mes corto de una fecha en milisegundos: "oct" */
export function formatTickMonth(time: number) {
  return monthShort.format(new Date(time))
}

// ---------------------------------------------------------------- Gasto por mes

export interface MonthlyCostRow {
  month: string
  maintenance: number
  fuel: number
  total: number
}

/** "2026-10" y 3 -> ["2026-08", "2026-09", "2026-10"] */
export function lastMonths(endMonth: string, count: number) {
  const [year, month] = endMonth.split('-').map(Number)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(year, month - 1 - (count - 1 - index), 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
}

/** Los últimos `count` meses hasta `endMonth`, con cero en los meses sin gastos. */
export function buildMonthlyCosts(byMonth: readonly MonthlyCost[], endMonth: string, count = 12): MonthlyCostRow[] {
  const known = new Map(byMonth.map((row) => [row.month, row]))
  return lastMonths(endMonth, count).map((month) => {
    const row = known.get(month)
    return {
      month,
      maintenance: row?.maintenance ?? 0,
      fuel: row?.fuel ?? 0,
      total: row?.total ?? 0,
    }
  })
}

export function sumCosts(rows: readonly MonthlyCostRow[]) {
  const round = (value: number) => Math.round(value * 100) / 100
  return {
    maintenance: round(rows.reduce((sum, row) => sum + row.maintenance, 0)),
    fuel: round(rows.reduce((sum, row) => sum + row.fuel, 0)),
    total: round(rows.reduce((sum, row) => sum + row.total, 0)),
  }
}

/** Marcas "redondas" desde 0 hasta cubrir `max`: 214 -> [0, 50, 100, 150, 200, 250] */
export function niceTicks(max: number, maxIntervals = 5) {
  if (max <= 0) return [0]
  const magnitude = 10 ** Math.floor(Math.log10(max / maxIntervals))
  const step =
    [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((size) => Math.ceil(max / size) <= maxIntervals) ??
    10 * magnitude
  return Array.from({ length: Math.ceil(max / step) + 1 }, (_, index) => Number((index * step).toFixed(6)))
}

/** Marcas del eje Y de dinero: $0, $150, $1.5K */
export function formatAxisMoney(value: number) {
  if (Math.abs(value) >= 1000) return `$${Number((value / 1000).toFixed(1))}K`
  return `$${value}`
}

// ---------------------------------------------------------------- Antes y después

export type ImpactTrend = 'mejora' | 'empeora' | 'igual'

export interface ImpactRow {
  id: number
  type: MaintenanceType
  label: string
  date: string
  before: number
  after: number
  changePct: number
  trend: ImpactTrend
}

/** Por debajo de este cambio (en %) se considera que el rendimiento quedó igual. */
export const NOTABLE_CHANGE_PCT = 1

/** Solo los mantenimientos con MPG antes y después; los más recientes primero. */
export function buildImpactRows(impact: readonly MaintenanceImpact[]): ImpactRow[] {
  return impact
    .filter((event) => event.mpg_before != null && event.mpg_after != null)
    .map((event) => {
      const before = event.mpg_before as number
      const after = event.mpg_after as number
      const changePct = event.change_pct ?? Math.round(((after - before) / before) * 1000) / 10
      const trend: ImpactTrend =
        Math.abs(changePct) < NOTABLE_CHANGE_PCT ? 'igual' : changePct > 0 ? 'mejora' : 'empeora'
      return { id: event.id, type: event.type, label: event.label, date: event.date, before, after, changePct, trend }
    })
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
}

// ---------------------------------------------------------------- Duración de cada cambio

export interface CycleRow {
  type: MaintenanceType
  label: string
  times: number
  avgMiles: number | null
  avgDays: number | null
}

/** Tipos con dos registros o más (con uno solo no hay duración que medir). */
export function buildCycleRows(cycles: readonly MaintenanceCycleSummary[]): CycleRow[] {
  const order = MAINTENANCE_TYPES.map((item) => item.value)
  return cycles
    .filter((cycle) => cycle.times >= 2 && (cycle.avg_miles != null || cycle.avg_days != null))
    .sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type))
    .map((cycle) => ({
      type: cycle.type,
      label: cycle.label,
      times: cycle.times,
      avgMiles: cycle.avg_miles,
      avgDays: cycle.avg_days,
    }))
}
