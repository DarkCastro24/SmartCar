import { describe, expect, it } from 'vitest'

import type { FuelLog, MaintenanceRecord } from '../../lib/types'
import { pricePerGallon, summarizeFuel, summarizeMaintenance } from './summary'

const record = (cost: number | null) => ({ cost }) as MaintenanceRecord
const log = (gallons: number, total_cost: number | null) => ({ gallons, total_cost }) as FuelLog

describe('resumen de lo filtrado', () => {
  it('cuenta mantenimientos y suma los costos sin errores de redondeo', () => {
    expect(summarizeMaintenance([record(0.1), record(0.2), record(null)])).toEqual({ count: 3, total: 0.3 })
    expect(summarizeMaintenance([])).toEqual({ count: 0, total: 0 })
  })

  it('suma total y galones de las cargas', () => {
    expect(summarizeFuel([log(9.547, 37.62), log(9.046, 38.37), log(4.5, null)])).toEqual({
      count: 3,
      total: 75.99,
      gallons: 23.093,
    })
  })
})

describe('precio por galón en vivo', () => {
  it('se calcula con galones y costo', () => {
    expect(pricePerGallon(10, 39.5)).toBeCloseTo(3.95)
  })

  it('no se muestra con datos incompletos o inválidos', () => {
    expect(pricePerGallon(null, 39.5)).toBeNull()
    expect(pricePerGallon(10, null)).toBeNull()
    expect(pricePerGallon(0, 39.5)).toBeNull()
    expect(pricePerGallon(Number.NaN, 39.5)).toBeNull()
  })
})
