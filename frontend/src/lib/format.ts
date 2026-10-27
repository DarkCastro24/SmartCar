// Formatos para El Salvador: 62,784 mi · $1,234.50 · 18 oct 2026
const LOCALE = 'es-SV'

const integerFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const decimalFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 1 })
const moneyFormat = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'USD' })
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short' })
const monthFormat = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric' })

const EMPTY = '—'

export function formatNumber(value: number | null | undefined, decimals = 0) {
  if (value == null || Number.isNaN(value)) return EMPTY
  return decimals === 0 ? integerFormat.format(value) : decimalFormat.format(value)
}

export function formatMiles(value: number | null | undefined) {
  return value == null ? EMPTY : `${integerFormat.format(value)} mi`
}

export function formatMoney(value: number | null | undefined) {
  return value == null ? EMPTY : moneyFormat.format(value)
}

export function formatMpg(value: number | null | undefined) {
  return value == null ? EMPTY : `${decimalFormat.format(value)} MPG`
}

export function formatGallons(value: number | null | undefined) {
  if (value == null) return EMPTY
  return `${new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 3, maximumFractionDigits: 3 }).format(value)} gal`
}

/**
 * "2026-10-18" -> Date local. Ojo: new Date("2026-10-18") la interpreta en UTC y
 * en El Salvador (UTC-6) mostraría el día anterior.
 */
export function parseISODate(iso: string): Date {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Fecha de hoy en la zona horaria del usuario, para los <input type="date">. */
export function todayISO() {
  return toISODate(new Date())
}

export function formatDate(iso: string | null | undefined) {
  return iso ? dateFormat.format(parseISODate(iso)) : EMPTY
}

export function formatShortDate(iso: string | null | undefined) {
  return iso ? shortDateFormat.format(parseISODate(iso)) : EMPTY
}

/** "2026-10" -> "oct 2026" */
export function formatMonth(month: string) {
  return monthFormat.format(parseISODate(`${month}-01`))
}

export function formatPercent(value: number | null | undefined, signed = false) {
  if (value == null) return EMPTY
  const text = `${decimalFormat.format(Math.abs(value))} %`
  if (!signed || value === 0) return value < 0 ? `-${text}` : text
  return value > 0 ? `+${text}` : `-${text}`
}

/** 30 -> "en 30 días", -5 -> "hace 5 días", 0 -> "hoy" */
export function formatRelativeDays(days: number | null | undefined) {
  if (days == null) return EMPTY
  if (days === 0) return 'hoy'
  const abs = Math.abs(days)
  const unit = abs === 1 ? 'día' : 'días'
  return days > 0 ? `en ${integerFormat.format(abs)} ${unit}` : `hace ${integerFormat.format(abs)} ${unit}`
}

export function vehicleName(vehicle: { make: string; model: string; year?: number | null }) {
  return [vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ')
}
