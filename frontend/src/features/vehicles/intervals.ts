import { z } from 'zod'

import { formatNumber } from '../../lib/format'
import { MAINTENANCE_TYPES } from '../../lib/maintenance'
import type { Interval, IntervalInput } from '../../lib/types'

// Mismos rangos que el backend (app/schemas/interval_schema.py)
export const MILES_RANGE = { min: 100, max: 500_000 } as const
export const MONTHS_RANGE = { min: 1, max: 240 } as const

const NEED_ONE = 'Indica las millas, los meses o ambos.'
const MILES_MESSAGE = `Las millas van de ${formatNumber(MILES_RANGE.min)} a ${formatNumber(MILES_RANGE.max)}.`
const MONTHS_MESSAGE = `Los meses van de ${MONTHS_RANGE.min} a ${MONTHS_RANGE.max}.`

// Vacío = sin límite (null). Texto que no es número llega como NaN y se rechaza.
const milesField = z
  .number({ error: 'Escribe las millas solo con números.' })
  .int('Escribe las millas sin decimales.')
  .min(MILES_RANGE.min, MILES_MESSAGE)
  .max(MILES_RANGE.max, MILES_MESSAGE)
  .nullable()

const monthsField = z
  .number({ error: 'Escribe los meses solo con números.' })
  .int('Escribe los meses sin decimales.')
  .min(MONTHS_RANGE.min, MONTHS_MESSAGE)
  .max(MONTHS_RANGE.max, MONTHS_MESSAGE)
  .nullable()

export const intervalRowSchema = z
  .object({
    type: z.enum(MAINTENANCE_TYPES.map((item) => item.value)),
    every_miles: milesField,
    every_months: monthsField,
  })
  .superRefine((row, ctx) => {
    // Al menos un límite por fila; se marcan los dos campos
    if (row.every_miles == null && row.every_months == null) {
      ctx.addIssue({ code: 'custom', message: NEED_ONE, path: ['every_miles'] })
      ctx.addIssue({ code: 'custom', message: NEED_ONE, path: ['every_months'] })
    }
  })

export const intervalsFormSchema = z.object({ intervals: z.array(intervalRowSchema) })

export type IntervalsFormValues = z.infer<typeof intervalsFormSchema>

export function toIntervalsFormValues(intervals: Interval[]): IntervalsFormValues {
  return {
    intervals: intervals.map(({ type, every_miles, every_months }) => ({ type, every_miles, every_months })),
  }
}

/**
 * Filas que el usuario cambió respecto a lo guardado. Solo esas se envían en el
 * PUT, así un intervalo sugerido que no se tocó no queda como personalizado.
 */
export function changedIntervals(saved: Interval[], rows: IntervalInput[]): IntervalInput[] {
  const savedByType = new Map(saved.map((interval) => [interval.type, interval]))
  return rows
    .filter((row) => {
      const original = savedByType.get(row.type)
      return !original || original.every_miles !== row.every_miles || original.every_months !== row.every_months
    })
    .map(({ type, every_miles, every_months }) => ({ type, every_miles, every_months }))
}

/** "cada 5,000 mi o 6 meses" · "cada 48 meses" · "cada 5,000 mi" */
export function describeInterval(miles: number | null, months: number | null) {
  const parts = []
  if (miles != null) parts.push(`${formatNumber(miles)} mi`)
  if (months != null) parts.push(`${formatNumber(months)} ${months === 1 ? 'mes' : 'meses'}`)
  return parts.length ? `cada ${parts.join(' o ')}` : 'sin límite'
}
