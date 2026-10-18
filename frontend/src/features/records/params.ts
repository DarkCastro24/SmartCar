import { parseISODate, toISODate } from '../../lib/format'
import { isMaintenanceType } from '../../lib/maintenance'
import type { MaintenanceFilters, MaintenanceType } from '../../lib/types'

// Pestañas de cada sección, tal como se escriben en la URL (?tipo= y ?tab=)
export const REGISTER_TABS = ['mantenimiento', 'combustible', 'vehiculo'] as const
export type RegisterTab = (typeof REGISTER_TABS)[number]

export const HISTORY_TABS = ['mantenimientos', 'combustible'] as const
export type HistoryTab = (typeof HISTORY_TABS)[number]

const FILTER_KEYS = ['type', 'from', 'to'] as const

function isOneOf<T extends string>(options: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (options as readonly string[]).includes(value)
}

/** "2026-10-18" válido (descarta textos raros y fechas imposibles como 2026-02-30). */
export function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && toISODate(parseISODate(value)) === value
}

export function registerTabFromParams(params: URLSearchParams): RegisterTab {
  const tab = params.get('tipo')
  return isOneOf(REGISTER_TABS, tab) ? tab : 'mantenimiento'
}

export function historyTabFromParams(params: URLSearchParams): HistoryTab {
  const tab = params.get('tab')
  return isOneOf(HISTORY_TABS, tab) ? tab : 'mantenimientos'
}

/** ?type=oil_change preselecciona el tipo en Registrar (así enlaza el Estado general). */
export function presetTypeFromParams(params: URLSearchParams): MaintenanceType | null {
  const type = params.get('type')
  return isMaintenanceType(type) ? type : null
}

/** ?type=&from=&to= -> filtros. Lo que no es válido se ignora en vez de romper la consulta. */
export function filtersFromParams(params: URLSearchParams): MaintenanceFilters {
  const filters: MaintenanceFilters = {}
  const type = params.get('type')
  const from = params.get('from')
  const to = params.get('to')
  if (isMaintenanceType(type)) filters.type = type
  if (from && isISODate(from)) filters.from = from
  if (to && isISODate(to)) filters.to = to
  return filters
}

/** Escribe los filtros en la URL sin tocar los demás parámetros (como ?tab=). */
export function filtersToParams(filters: MaintenanceFilters, current?: URLSearchParams): URLSearchParams {
  const params = new URLSearchParams(current)
  for (const key of FILTER_KEYS) {
    const value = filters[key]
    if (value) params.set(key, value)
    else params.delete(key)
  }
  return params
}

export function hasActiveFilters(filters: MaintenanceFilters) {
  return FILTER_KEYS.some((key) => Boolean(filters[key]))
}

/** Mensaje si el rango de fechas no tiene sentido; null si está bien. */
export function dateRangeError({ from, to }: MaintenanceFilters): string | null {
  return from && to && from > to ? 'La fecha "Desde" no puede ser posterior a "Hasta".' : null
}
