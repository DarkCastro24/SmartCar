import { describe, expect, it } from 'vitest'

import { toISODate, todayISO } from '../../lib/format'
import type { FuelLog, MaintenanceRecord } from '../../lib/types'
import {
  fuelDefaults,
  fuelSchema,
  maintenanceDefaults,
  maintenanceSchema,
  type FuelFormValues,
  type MaintenanceFormValues,
} from './schemas'

function tomorrowISO() {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  return toISODate(date)
}

/** Primer mensaje de error de un campo, o undefined si el campo es válido. */
function errorOf(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) {
  return result.error?.issues.find((issue) => issue.path[0] === field)?.message
}

const validMaintenance: MaintenanceFormValues = {
  type: 'oil_change',
  date: '2026-10-01',
  mileage: 62800,
  cost: 45,
  notes: '  5W-30 sintético ',
}

describe('maintenanceSchema', () => {
  it('acepta un mantenimiento válido y limpia las notas', () => {
    const result = maintenanceSchema.safeParse(validMaintenance)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      type: 'oil_change',
      date: '2026-10-01',
      mileage: 62800,
      cost: 45,
      notes: '5W-30 sintético',
    })
  })

  it('deja costo y notas vacíos como null', () => {
    const result = maintenanceSchema.safeParse({ ...validMaintenance, cost: null, notes: '   ' })
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ cost: null, notes: null })
  })

  it('acepta la fecha de hoy', () => {
    expect(maintenanceSchema.safeParse({ ...validMaintenance, date: todayISO() }).success).toBe(true)
  })

  it('exige el tipo, la fecha y el millaje con mensajes en español', () => {
    const result = maintenanceSchema.safeParse({ ...validMaintenance, type: null, date: '', mileage: null })
    expect(result.success).toBe(false)
    expect(errorOf(result, 'type')).toBe('Elige qué mantenimiento le hiciste.')
    expect(errorOf(result, 'date')).toBe('Elige la fecha.')
    expect(errorOf(result, 'mileage')).toBe('Escribe el millaje del odómetro.')
  })

  it('rechaza fechas futuras', () => {
    const result = maintenanceSchema.safeParse({ ...validMaintenance, date: tomorrowISO() })
    expect(errorOf(result, 'date')).toBe('La fecha no puede ser futura.')
  })

  it('rechaza millas que no son números, negativas o con decimales', () => {
    expect(errorOf(maintenanceSchema.safeParse({ ...validMaintenance, mileage: Number.NaN }), 'mileage')).toBe(
      'Escribe las millas solo con números.',
    )
    expect(errorOf(maintenanceSchema.safeParse({ ...validMaintenance, mileage: -5 }), 'mileage')).toBe(
      'El millaje no puede ser negativo.',
    )
    expect(errorOf(maintenanceSchema.safeParse({ ...validMaintenance, mileage: 100.5 }), 'mileage')).toBe(
      'Escribe las millas sin decimales.',
    )
  })

  it('rechaza costos negativos o que no son números', () => {
    expect(errorOf(maintenanceSchema.safeParse({ ...validMaintenance, cost: -1 }), 'cost')).toBe(
      'El monto no puede ser negativo.',
    )
    expect(errorOf(maintenanceSchema.safeParse({ ...validMaintenance, cost: Number.NaN }), 'cost')).toBe(
      'Escribe un monto válido, por ejemplo 45.00.',
    )
  })

  it('rechaza notas de más de 1000 caracteres', () => {
    const result = maintenanceSchema.safeParse({ ...validMaintenance, notes: 'a'.repeat(1001) })
    expect(errorOf(result, 'notes')).toBe('Las notas pueden tener hasta 1000 caracteres.')
  })
})

const validFuel: FuelFormValues = {
  date: '2026-10-05',
  mileage: 62900,
  gallons: 9.8,
  total_cost: 39.5,
  full_tank: true,
  notes: '',
}

describe('fuelSchema', () => {
  it('acepta una carga válida', () => {
    const result = fuelSchema.safeParse(validFuel)
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ ...validFuel, notes: null })
  })

  it('acepta una carga parcial sin costo', () => {
    const result = fuelSchema.safeParse({ ...validFuel, full_tank: false, total_cost: null })
    expect(result.success).toBe(true)
    expect(result.data).toMatchObject({ full_tank: false, total_cost: null })
  })

  it('exige los galones y que sean mayores que cero', () => {
    expect(errorOf(fuelSchema.safeParse({ ...validFuel, gallons: null }), 'gallons')).toBe(
      'Escribe cuántos galones cargaste.',
    )
    expect(errorOf(fuelSchema.safeParse({ ...validFuel, gallons: 0 }), 'gallons')).toBe(
      'Los galones deben ser mayores que cero.',
    )
    expect(errorOf(fuelSchema.safeParse({ ...validFuel, gallons: Number.NaN }), 'gallons')).toBe(
      'Escribe los galones solo con números, por ejemplo 9.5.',
    )
  })

  it('rechaza más galones de los que caben en un tanque', () => {
    expect(errorOf(fuelSchema.safeParse({ ...validFuel, gallons: 250 }), 'gallons')).toBe(
      'Revisa los galones: el máximo es 200.',
    )
  })
})

describe('valores iniciales', () => {
  it('un formulario nuevo trae la fecha de hoy y los campos vacíos', () => {
    expect(maintenanceDefaults()).toEqual({ type: null, date: todayISO(), mileage: null, cost: null, notes: '' })
    expect(maintenanceDefaults(undefined, 'battery').type).toBe('battery')
    expect(fuelDefaults()).toMatchObject({ date: todayISO(), gallons: null, full_tank: true })
  })

  it('al editar copia los datos del registro', () => {
    const record: MaintenanceRecord = {
      id: 7,
      vehicle_id: 3,
      type: 'spark_plugs',
      label: 'Bujías',
      date: '2026-04-10',
      mileage: 57255,
      cost: 120,
      notes: null,
      created_at: '2026-04-10T00:00:00Z',
    }
    expect(maintenanceDefaults(record)).toEqual({
      type: 'spark_plugs',
      date: '2026-04-10',
      mileage: 57255,
      cost: 120,
      notes: '',
    })

    const log: FuelLog = {
      id: 9,
      vehicle_id: 3,
      date: '2026-10-07',
      mileage: 62464,
      gallons: 9.046,
      total_cost: 38.37,
      price_per_gallon: 4.242,
      full_tank: false,
      notes: 'Puma',
      created_at: '2026-10-07T00:00:00Z',
    }
    expect(fuelDefaults(log)).toEqual({
      date: '2026-10-07',
      mileage: 62464,
      gallons: 9.046,
      total_cost: 38.37,
      full_tank: false,
      notes: 'Puma',
    })
  })
})
