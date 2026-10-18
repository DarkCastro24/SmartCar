import { Gauge, History, PlusCircle, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  shortLabel: string
  icon: LucideIcon
}

/** Las tres secciones de la app. */
export const NAV_ITEMS: NavItem[] = [
  { to: '/estado', label: 'Estado general', shortLabel: 'Estado', icon: Gauge },
  { to: '/registrar', label: 'Registrar', shortLabel: 'Registrar', icon: PlusCircle },
  { to: '/consultar', label: 'Consultar', shortLabel: 'Consultar', icon: History },
]
