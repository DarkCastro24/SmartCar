import { z } from 'zod'

import type { Vehicle } from '../../lib/types'

// Mismos límites que el backend (app/schemas/vehicle_schema.py)
const MAX_MILEAGE = 2_000_000
export const MIN_YEAR = 1900
/** Se acepta el modelo del próximo año, que se vende desde antes. */
export const MAX_YEAR = new Date().getFullYear() + 1

/** Texto opcional: vacío -> null para que el backend lo guarde como "sin dato". */
function optionalText(max: number, message: string) {
  return z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => value || null)
}

/*
 * Los campos numéricos usan register(..., { setValueAs: parseIntegerInput }):
 * vacío -> null y texto que no es número -> NaN (z.number lo rechaza).
 */
export const vehicleSchema = z.object({
  make: z.string().trim().min(1, 'Escribe la marca.').max(50, 'La marca puede tener hasta 50 caracteres.'),
  model: z.string().trim().min(1, 'Escribe el modelo.').max(50, 'El modelo puede tener hasta 50 caracteres.'),
  year: z
    .number({ error: 'Escribe el año solo con números, por ejemplo 2018.' })
    .int('Escribe el año sin decimales.')
    .min(MIN_YEAR, `Escribe un año entre ${MIN_YEAR} y ${MAX_YEAR}.`)
    .max(MAX_YEAR, `Escribe un año entre ${MIN_YEAR} y ${MAX_YEAR}.`)
    .nullable(),
  plate: optionalText(20, 'La placa puede tener hasta 20 caracteres.').transform(
    (value) => value?.toUpperCase() ?? null,
  ),
  color: optionalText(30, 'El color puede tener hasta 30 caracteres.'),
  initial_mileage: z
    .number({ error: 'Escribe las millas solo con números.' })
    .int('Escribe las millas sin decimales.')
    .min(0, 'El millaje no puede ser negativo.')
    .max(MAX_MILEAGE, 'Revisa el millaje: parece demasiado alto.')
    .nullable()
    // Vacío = 0, como en el backend
    .transform((value) => value ?? 0),
})

/** Lo que guarda el formulario (null en números vacíos). */
export type VehicleFormValues = z.input<typeof vehicleSchema>
/** Lo que se envía a la API después de validar. */
export type VehicleFormOutput = z.output<typeof vehicleSchema>

export const VEHICLE_FIELDS = ['make', 'model', 'year', 'plate', 'color', 'initial_mileage'] as const

/** Valores iniciales: los del vehículo a editar o un formulario vacío. */
export function vehicleDefaults(vehicle?: Vehicle): VehicleFormValues {
  return {
    make: vehicle?.make ?? '',
    model: vehicle?.model ?? '',
    year: vehicle?.year ?? null,
    plate: vehicle?.plate ?? '',
    color: vehicle?.color ?? '',
    initial_mileage: vehicle?.initial_mileage ?? null,
  }
}
