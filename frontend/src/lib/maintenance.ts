import {
  BatteryCharging,
  CircleCheck,
  CircleHelp,
  Clock,
  Disc,
  Droplet,
  Fan,
  TriangleAlert,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'

import type { ItemStatus, MaintenanceType } from './types'

export interface MaintenanceTypeMeta {
  value: MaintenanceType
  label: string
  icon: LucideIcon
}

/** Mismo orden y nombres que el backend (GET /api/maintenance-types). */
export const MAINTENANCE_TYPES: MaintenanceTypeMeta[] = [
  { value: 'oil_change', label: 'Cambio de aceite', icon: Droplet },
  { value: 'air_filter', label: 'Filtro de aire', icon: Wind },
  { value: 'cabin_filter', label: 'Filtro de cabina', icon: Fan },
  { value: 'spark_plugs', label: 'Bujías', icon: Zap },
  { value: 'brake_pads', label: 'Pastillas de freno', icon: Disc },
  { value: 'battery', label: 'Batería', icon: BatteryCharging },
]

export const MAINTENANCE_META = Object.fromEntries(
  MAINTENANCE_TYPES.map((item) => [item.value, item]),
) as Record<MaintenanceType, MaintenanceTypeMeta>

export function isMaintenanceType(value: unknown): value is MaintenanceType {
  return typeof value === 'string' && value in MAINTENANCE_META
}

export interface StatusMeta {
  label: string
  description: string
  icon: LucideIcon
  /** Clases para insignias: fondo suave + texto legible + borde */
  badgeClass: string
  /** Color de relleno para barras de progreso */
  barClass: string
}

/** Colores de estado reservados (nunca se reutilizan como colores de series). */
export const STATUS_META: Record<ItemStatus, StatusMeta> = {
  al_dia: {
    label: 'Al día',
    description: 'Todavía falta para el próximo mantenimiento',
    icon: CircleCheck,
    badgeClass: 'bg-good/12 text-good-text border-good/30',
    barClass: 'bg-good',
  },
  proximo: {
    label: 'Próximo',
    description: 'Se acerca el próximo mantenimiento',
    icon: Clock,
    badgeClass: 'bg-warning/15 text-warning-text border-warning/40',
    barClass: 'bg-warning',
  },
  vencido: {
    label: 'Vencido',
    description: 'Ya pasó la fecha o las millas recomendadas',
    icon: TriangleAlert,
    badgeClass: 'bg-critical/12 text-critical-text border-critical/35',
    barClass: 'bg-critical',
  },
  sin_registro: {
    label: 'Sin registro',
    description: 'Aún no hay mantenimientos de este tipo',
    icon: CircleHelp,
    badgeClass: 'bg-surface-2 text-fg-2 border-border',
    barClass: 'bg-border-strong',
  },
}
