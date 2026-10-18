import { z } from 'zod'

import { todayISO } from '../../lib/format'
import { MAINTENANCE_TYPES } from '../../lib/maintenance'
import type { FuelLog, MaintenanceRecord, MaintenanceType } from '../../lib/types'

// Mismos límites que el backend (app/schemas/record_schemas.py)
const MAX_MILEAGE = 2_000_000
const MAX_GALLONS = 200
const MAX_NOTES = 1000
// La base guarda montos de hasta 8 dígitos enteros; un monto mayor es un error de dedo
const MAX_COST = 100_000

const MAINTENANCE_VALUES = MAINTENANCE_TYPES.map((item) => item.value)

/*
 * Los campos numéricos usan register(..., { setValueAs: parseIntegerInput }):
 * vacío -> null y texto que no es número -> NaN. Cada esquema obligatorio tiene
 * dos pasos: el primero rechaza NaN y deja pasar null; el segundo (pipe) exige el
 * valor y así el tipo de salida queda sin null.
 */

const dateField = z
  .iso.date({ error: (issue) => (issue.input ? 'Escribe una fecha válida.' : 'Elige la fecha.') })
  .refine((value) => value <= todayISO(), 'La fecha no puede ser futura.')

const mileageField = z
  .number({ error: 'Escribe las millas solo con números.' })
  .nullable()
  .pipe(
    z
      .number({ error: 'Escribe el millaje del odómetro.' })
      .int('Escribe las millas sin decimales.')
      .min(0, 'El millaje no puede ser negativo.')
      .max(MAX_MILEAGE, 'Revisa el millaje: parece demasiado alto.'),
  )

const optionalMoneyField = z
  .number({ error: 'Escribe un monto válido, por ejemplo 45.00.' })
  .min(0, 'El monto no puede ser negativo.')
  .max(MAX_COST, 'Revisa el monto: parece demasiado alto.')
  .nullable()

const notesField = z
  .string()
  .trim()
  .max(MAX_NOTES, `Las notas pueden tener hasta ${MAX_NOTES} caracteres.`)
  .transform((value) => value || null)

export const maintenanceSchema = z.object({
  type: z
    .enum(MAINTENANCE_VALUES)
    .nullable()
    .pipe(z.enum(MAINTENANCE_VALUES, 'Elige qué mantenimiento le hiciste.')),
  date: dateField,
  mileage: mileageField,
  cost: optionalMoneyField,
  notes: notesField,
})

export const fuelSchema = z.object({
  date: dateField,
  mileage: mileageField,
  gallons: z
    .number({ error: 'Escribe los galones solo con números, por ejemplo 9.5.' })
    .nullable()
    .pipe(
      z
        .number({ error: 'Escribe cuántos galones cargaste.' })
        .gt(0, 'Los galones deben ser mayores que cero.')
        .max(MAX_GALLONS, `Revisa los galones: el máximo es ${MAX_GALLONS}.`),
    ),
  total_cost: optionalMoneyField,
  full_tank: z.boolean(),
  notes: notesField,
})

/** Lo que guarda el formulario (con null en campos vacíos). */
export type MaintenanceFormValues = z.input<typeof maintenanceSchema>
export type FuelFormValues = z.input<typeof fuelSchema>
/** Lo que se envía a la API después de validar. */
export type MaintenanceFormOutput = z.output<typeof maintenanceSchema>
export type FuelFormOutput = z.output<typeof fuelSchema>

/** Valores iniciales: los del registro a editar o un formulario limpio con la fecha de hoy. */
export function maintenanceDefaults(
  record?: MaintenanceRecord,
  type: MaintenanceType | null = null,
): MaintenanceFormValues {
  if (record) {
    return {
      type: record.type,
      date: record.date,
      mileage: record.mileage,
      cost: record.cost,
      notes: record.notes ?? '',
    }
  }
  return { type, date: todayISO(), mileage: null, cost: null, notes: '' }
}

export function fuelDefaults(log?: FuelLog): FuelFormValues {
  if (log) {
    return {
      date: log.date,
      mileage: log.mileage,
      gallons: log.gallons,
      total_cost: log.total_cost,
      full_tank: log.full_tank,
      notes: log.notes ?? '',
    }
  }
  return { date: todayISO(), mileage: null, gallons: null, total_cost: null, full_tank: true, notes: '' }
}
