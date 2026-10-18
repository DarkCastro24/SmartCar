import type { Vehicle } from '../../lib/types'

// PROVISIONAL: lo reemplaza la implementación completa del formulario de vehículos.
export interface VehicleFormProps {
  /** Si viene, el formulario edita ese vehículo; si no, registra uno nuevo. */
  vehicle?: Vehicle
  /** Se llama con el vehículo guardado (nuevo o editado). */
  onSaved?: (vehicle: Vehicle) => void
  onCancel?: () => void
}

export function VehicleForm({ vehicle }: VehicleFormProps) {
  return <p className="text-sm text-fg-2">Formulario de vehículo {vehicle ? `#${vehicle.id}` : 'nuevo'}</p>
}
