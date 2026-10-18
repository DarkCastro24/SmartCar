import { describe, expect, it } from 'vitest'

import type { Vehicle } from '../../lib/types'
import { MAX_YEAR, vehicleDefaults, vehicleSchema, type VehicleFormValues } from './vehicle-schema'

const valid: VehicleFormValues = {
  make: 'Toyota',
  model: 'Corolla',
  year: 2018,
  plate: 'p123-456',
  color: 'Gris',
  initial_mileage: 52000,
}

/** Mensajes de error por campo, para comprobar el texto en español. */
function errorsOf(values: Partial<VehicleFormValues>) {
  const result = vehicleSchema.safeParse({ ...valid, ...values })
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]))
}

describe('vehicleSchema', () => {
  it('limpia los textos y pone la placa en mayúsculas', () => {
    const output = vehicleSchema.parse({ ...valid, make: '  Toyota ', plate: ' p123-456 ', color: ' Gris ' })
    expect(output).toEqual({
      make: 'Toyota',
      model: 'Corolla',
      year: 2018,
      plate: 'P123-456',
      color: 'Gris',
      initial_mileage: 52000,
    })
  })

  it('deja en null los opcionales vacíos y el millaje en 0', () => {
    const output = vehicleSchema.parse({ make: 'Nissan', model: 'Sentra', year: null, plate: '  ', color: '', initial_mileage: null })
    expect(output).toEqual({ make: 'Nissan', model: 'Sentra', year: null, plate: null, color: null, initial_mileage: 0 })
  })

  it('exige marca y modelo', () => {
    expect(errorsOf({ make: '', model: '   ' })).toEqual({
      make: 'Escribe la marca.',
      model: 'Escribe el modelo.',
    })
  })

  it('acepta años de 1900 al próximo año', () => {
    expect(errorsOf({ year: 1900 })).toEqual({})
    expect(errorsOf({ year: MAX_YEAR })).toEqual({})
    expect(MAX_YEAR).toBe(new Date().getFullYear() + 1)

    const message = `Escribe un año entre 1900 y ${MAX_YEAR}.`
    expect(errorsOf({ year: 1899 })).toEqual({ year: message })
    expect(errorsOf({ year: MAX_YEAR + 1 })).toEqual({ year: message })
    expect(errorsOf({ year: Number.NaN })).toEqual({ year: 'Escribe el año solo con números, por ejemplo 2018.' })
  })

  it('valida el millaje como entero no negativo', () => {
    expect(errorsOf({ initial_mileage: -1 })).toEqual({ initial_mileage: 'El millaje no puede ser negativo.' })
    expect(errorsOf({ initial_mileage: 10.5 })).toEqual({ initial_mileage: 'Escribe las millas sin decimales.' })
    expect(errorsOf({ initial_mileage: Number.NaN })).toEqual({
      initial_mileage: 'Escribe las millas solo con números.',
    })
    expect(errorsOf({ initial_mileage: 2_000_001 })).toEqual({
      initial_mileage: 'Revisa el millaje: parece demasiado alto.',
    })
  })

  it('respeta los largos máximos del backend', () => {
    expect(errorsOf({ plate: 'X'.repeat(21) })).toEqual({ plate: 'La placa puede tener hasta 20 caracteres.' })
    expect(errorsOf({ color: 'X'.repeat(31) })).toEqual({ color: 'El color puede tener hasta 30 caracteres.' })
    expect(errorsOf({ make: 'X'.repeat(51) })).toEqual({ make: 'La marca puede tener hasta 50 caracteres.' })
  })
})

describe('vehicleDefaults', () => {
  it('empieza vacío al registrar', () => {
    expect(vehicleDefaults()).toEqual({ make: '', model: '', year: null, plate: '', color: '', initial_mileage: null })
  })

  it('precarga el vehículo al editar', () => {
    const vehicle: Vehicle = {
      id: 4,
      make: 'Toyota',
      model: 'Corolla',
      year: null,
      plate: null,
      color: 'Gris',
      initial_mileage: 52000,
      created_at: '2026-10-18T23:06:53+00:00',
    }
    expect(vehicleDefaults(vehicle)).toEqual({
      make: 'Toyota',
      model: 'Corolla',
      year: null,
      plate: '',
      color: 'Gris',
      initial_mileage: 52000,
    })
  })
})
