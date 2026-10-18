import type { FuelLog, MaintenanceRecord } from '../../lib/types'

export interface RecordsSummary {
  count: number
  total: number
  gallons?: number
}

// Suma en centavos para no arrastrar errores de punto flotante (0.1 + 0.2)
function sumMoney(values: Array<number | null>) {
  return values.reduce<number>((cents, value) => cents + Math.round((value ?? 0) * 100), 0) / 100
}

export function summarizeMaintenance(records: MaintenanceRecord[]): RecordsSummary {
  return { count: records.length, total: sumMoney(records.map((record) => record.cost)) }
}

export function summarizeFuel(logs: FuelLog[]): RecordsSummary {
  const gallons = logs.reduce((sum, log) => sum + log.gallons, 0)
  return {
    count: logs.length,
    total: sumMoney(logs.map((log) => log.total_cost)),
    gallons: Math.round(gallons * 1000) / 1000,
  }
}

/** Precio por galón mientras el usuario escribe; null si aún no se puede calcular. */
export function pricePerGallon(gallons: unknown, totalCost: unknown): number | null {
  if (typeof gallons !== 'number' || typeof totalCost !== 'number') return null
  if (!Number.isFinite(gallons) || !Number.isFinite(totalCost) || gallons <= 0 || totalCost < 0) return null
  return totalCost / gallons
}
