// Textos del estado de cada componente en lenguaje natural.
import { formatDate, formatMiles, formatNumber } from '../../lib/format'
import type { ItemStatus, MaintenanceType, StatusItem } from '../../lib/types'

/** Del más urgente al menos urgente. */
export const URGENCY_ORDER: readonly ItemStatus[] = ['vencido', 'proximo', 'sin_registro', 'al_dia']

/** Ordena por urgencia; con el mismo estado, primero el más avanzado. */
export function sortByUrgency(items: readonly StatusItem[]): StatusItem[] {
  return [...items].sort(
    (a, b) =>
      URGENCY_ORDER.indexOf(a.status) - URGENCY_ORDER.indexOf(b.status) || (b.percent ?? 0) - (a.percent ?? 0),
  )
}

/** Los componentes al día no necesitan un acceso directo para registrar. */
export function needsAttention(status: ItemStatus) {
  return status !== 'al_dia'
}

export function registerMaintenanceHref(type: MaintenanceType) {
  return `/registrar?tipo=mantenimiento&type=${type}`
}

function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`
}

/** 30 -> "30 días", 151 -> "5 meses", 1635 -> "4 años y 6 meses" (o siempre en días con exactDays) */
export function formatDuration(days: number, { exactDays = false } = {}) {
  if (exactDays || days < 90) return plural(days, 'día')
  const totalMonths = Math.round(days / 30.44)
  if (totalMonths < 24) return plural(totalMonths, 'mes', 'meses')
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12
  return months === 0 ? plural(years, 'año') : `${plural(years, 'año')} y ${plural(months, 'mes', 'meses')}`
}

/** 6 -> "6 meses", 12 -> "1 año", 48 -> "4 años" */
export function formatMonths(months: number) {
  return months % 12 === 0 ? plural(months / 12, 'año') : plural(months, 'mes', 'meses')
}

/** "Cada 5,000 mi o 6 meses" */
export function describeInterval(everyMiles: number | null, everyMonths: number | null) {
  const parts = [everyMiles ? formatMiles(everyMiles) : null, everyMonths ? formatMonths(everyMonths) : null]
  const text = parts.filter(Boolean).join(' o ')
  return text ? `Cada ${text}` : 'Sin intervalo definido'
}

/** "18 sep 2026 · 61,826 mi" o "Sin registro" */
export function describeLastService(item: StatusItem) {
  return item.last ? `${formatDate(item.last.date)} · ${formatMiles(item.last.mileage)}` : 'Sin registro'
}

/**
 * Lo que falta (o cuánto se pasó) en lenguaje natural. Los valores negativos de
 * miles_left y days_left significan que ya se pasó del intervalo.
 */
export function describeRemaining(item: StatusItem) {
  const { status, miles_left: milesLeft, days_left: daysLeft } = item
  if (status === 'sin_registro') return 'Registra el último para saber cuándo toca'

  if (status === 'vencido') {
    const overdue = [
      milesLeft != null && milesLeft < 0 ? formatMiles(-milesLeft) : null,
      daysLeft != null && daysLeft < 0 ? formatDuration(-daysLeft) : null,
    ].filter(Boolean)
    return overdue.length ? `Vencido hace ${overdue.join(' y ')}` : 'Toca hoy'
  }

  const left = [
    milesLeft != null ? formatMiles(milesLeft) : null,
    daysLeft != null ? formatDuration(daysLeft) : null,
  ].filter(Boolean)
  if (!left.length) return 'Sin intervalo definido'
  const first = milesLeft ?? daysLeft
  return `${first === 1 ? 'Falta' : 'Faltan'} ${left.join(' o ')}`
}

/** "Toca el 18 mar 2027 o a las 66,826 mi" (en pasado si ya venció). */
export function describeDue(item: StatusItem) {
  if (item.status === 'sin_registro') return null
  const parts = [
    item.next_due_date ? `el ${formatDate(item.next_due_date)}` : null,
    item.next_due_mileage != null ? `a las ${formatMiles(item.next_due_mileage)}` : null,
  ].filter(Boolean)
  if (!parts.length) return null
  return `${item.status === 'vencido' ? 'Tocaba' : 'Toca'} ${parts.join(' o ')}`
}

/** "1 vencido · 1 próximo" o "Todo al día" */
export function summarizeStatus(summary: Record<ItemStatus, number>) {
  const parts = [
    summary.vencido ? plural(summary.vencido, 'vencido') : null,
    summary.proximo ? plural(summary.proximo, 'próximo') : null,
    summary.sin_registro ? `${formatNumber(summary.sin_registro)} sin registro` : null,
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Todo al día'
}
