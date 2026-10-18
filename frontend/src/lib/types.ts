// Tipos que reflejan exactamente el JSON que devuelve el backend Flask.
// Las fechas llegan como texto ISO: "2026-10-18".

export type MaintenanceType =
  | 'oil_change'
  | 'air_filter'
  | 'cabin_filter'
  | 'spark_plugs'
  | 'brake_pads'
  | 'battery'

export type ItemStatus = 'al_dia' | 'proximo' | 'vencido' | 'sin_registro'

export interface User {
  id: number
  email: string
  name: string | null
  picture: string | null
  created_at: string
}

export interface LoginResponse {
  access_token: string
  user: User
  new_user: boolean
}

export interface Vehicle {
  id: number
  make: string
  model: string
  year: number | null
  plate: string | null
  color: string | null
  initial_mileage: number
  created_at: string
}

export interface VehicleInput {
  make: string
  model: string
  year?: number | null
  plate?: string | null
  color?: string | null
  initial_mileage?: number
}

export interface MaintenanceTypeInfo {
  value: MaintenanceType
  label: string
  default_every_miles: number | null
  default_every_months: number | null
}

export interface MaintenanceRecord {
  id: number
  vehicle_id: number
  type: MaintenanceType
  label: string
  date: string
  mileage: number
  cost: number | null
  notes: string | null
  created_at: string
}

export interface MaintenanceInput {
  type: MaintenanceType
  date: string
  mileage: number
  cost?: number | null
  notes?: string | null
}

export interface FuelLog {
  id: number
  vehicle_id: number
  date: string
  mileage: number
  gallons: number
  total_cost: number | null
  price_per_gallon: number | null
  full_tank: boolean
  notes: string | null
  created_at: string
}

export interface FuelInput {
  date: string
  mileage: number
  gallons: number
  total_cost?: number | null
  full_tank?: boolean
  notes?: string | null
}

export interface MaintenanceFilters {
  type?: MaintenanceType
  from?: string
  to?: string
}

export interface DateRangeFilters {
  from?: string
  to?: string
}

// ---------- Estado general (GET /vehicles/:id/status) ----------

export interface StatusItem {
  type: MaintenanceType
  label: string
  every_miles: number | null
  every_months: number | null
  last: MaintenanceRecord | null
  status: ItemStatus
  percent: number | null
  miles_since: number | null
  days_since: number | null
  next_due_mileage: number | null
  next_due_date: string | null
  miles_left: number | null // negativo = vencido hace N millas
  days_left: number | null // negativo = vencido hace N días
}

export interface VehicleStatus {
  vehicle: Vehicle
  current_mileage: number
  overall: ItemStatus
  summary: Record<ItemStatus, number>
  items: StatusItem[]
  fuel: { last_mpg: number | null; avg_mpg: number | null }
}

// ---------- Estadísticas (GET /vehicles/:id/stats) ----------

export interface MpgSegment {
  date: string
  start_mileage: number
  end_mileage: number
  miles: number
  gallons: number
  mpg: number
}

export interface MonthlyCost {
  month: string // "2026-10"
  maintenance: number
  fuel: number
  total: number
}

export interface MaintenanceImpact {
  id: number
  date: string
  mileage: number
  type: MaintenanceType
  label: string
  mpg_before: number | null
  mpg_after: number | null
  change_pct: number | null
}

export interface MaintenanceCycle {
  from_date: string
  to_date: string
  miles: number
  days: number
}

export interface MaintenanceCycleSummary {
  type: MaintenanceType
  label: string
  times: number
  avg_miles: number | null
  avg_days: number | null
  cycles: MaintenanceCycle[]
}

export interface VehicleStats {
  vehicle_id: number
  current_mileage: number
  miles_tracked: number
  fuel: {
    fill_ups: number
    total_gallons: number
    avg_mpg: number | null
    last_mpg: number | null
    best_mpg: number | null
    worst_mpg: number | null
    avg_price_per_gallon: number | null
    cost_per_mile: number | null
    mpg_series: MpgSegment[]
  }
  costs: {
    maintenance_total: number
    fuel_total: number
    total: number
    by_month: MonthlyCost[]
  }
  maintenance_impact: MaintenanceImpact[]
  maintenance_cycles: MaintenanceCycleSummary[]
}

// ---------- Intervalos (GET/PUT /vehicles/:id/intervals) ----------

export interface Interval {
  type: MaintenanceType
  label: string
  every_miles: number | null
  every_months: number | null
  is_custom: boolean
}

export interface IntervalInput {
  type: MaintenanceType
  every_miles: number | null
  every_months: number | null
}
