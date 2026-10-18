// Formatos propios de esta sección (los generales están en src/lib/format.ts).
const LOCALE = 'es-SV'
const EMPTY = '—'

const costPerMileFormat = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 3,
})
const mpgFixedFormat = new Intl.NumberFormat(LOCALE, { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** 0.128 -> "$0.128" (el costo por milla son centavos: hacen falta 3 decimales) */
export function formatCostPerMile(value: number | null | undefined) {
  return value == null ? EMPTY : costPerMileFormat.format(value)
}

/** Siempre con un decimal para poder comparar: 34 -> "34.0" */
export function formatMpgValue(value: number | null | undefined) {
  return value == null ? EMPTY : mpgFixedFormat.format(value)
}

/** 34 -> "34.0 MPG" */
export function formatMpgFixed(value: number | null | undefined) {
  return value == null ? EMPTY : `${mpgFixedFormat.format(value)} MPG`
}
