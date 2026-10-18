// Datos de ejemplo para las pruebas de esta sección.
import type { MaintenanceImpact, StatusItem } from '../../lib/types'

export function makeStatusItem(overrides: Partial<StatusItem> = {}): StatusItem {
  return {
    type: 'oil_change',
    label: 'Cambio de aceite',
    every_miles: 5000,
    every_months: 6,
    last: {
      id: 1,
      vehicle_id: 1,
      type: 'oil_change',
      label: 'Cambio de aceite',
      date: '2026-09-18',
      mileage: 61826,
      cost: 45,
      notes: null,
      created_at: '2026-09-18T12:00:00Z',
    },
    status: 'al_dia',
    percent: 19,
    miles_since: 958,
    days_since: 30,
    next_due_mileage: 66826,
    next_due_date: '2027-03-18',
    miles_left: 4042,
    days_left: 151,
    ...overrides,
  }
}

export function makeImpact(overrides: Partial<MaintenanceImpact> = {}): MaintenanceImpact {
  return {
    id: 1,
    date: '2026-04-10',
    mileage: 57255,
    type: 'spark_plugs',
    label: 'Bujías',
    mpg_before: 30.7,
    mpg_after: 33.9,
    change_pct: 10.4,
    ...overrides,
  }
}
