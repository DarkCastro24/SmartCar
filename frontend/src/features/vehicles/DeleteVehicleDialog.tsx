import { toast } from 'sonner'

import { ConfirmDialog } from '../../components/ui/Dialog'
import { getErrorMessage } from '../../lib/api'
import { vehicleName } from '../../lib/format'
import { useDeleteVehicle } from '../../lib/queries'
import type { Vehicle } from '../../lib/types'

interface DeleteVehicleDialogProps {
  /** Vehículo a eliminar; null mantiene el diálogo cerrado. */
  vehicle: Vehicle | null
  /** Si se borra el vehículo activo, el que lo reemplaza (para avisarlo). */
  nextActive?: Vehicle | null
  onClose: () => void
}

export function DeleteVehicleDialog({ vehicle, nextActive, onClose }: DeleteVehicleDialogProps) {
  const deleteMutation = useDeleteVehicle()
  const name = vehicle ? vehicleName(vehicle) : ''

  function confirm() {
    if (!vehicle) return
    deleteMutation.mutate(vehicle.id, {
      onSuccess: () => {
        toast.success('Vehículo eliminado', { description: name })
        onClose()
      },
      onError: (error) => toast.error(getErrorMessage(error, 'No se pudo eliminar el vehículo.')),
    })
  }

  return (
    <ConfirmDialog
      open={vehicle !== null}
      onClose={onClose}
      onConfirm={confirm}
      loading={deleteMutation.isPending}
      title="¿Eliminar este vehículo?"
      confirmLabel="Eliminar vehículo"
      description={
        <>
          Se borrará <strong className="font-semibold text-fg">{name}</strong> junto con{' '}
          <strong className="font-semibold text-fg">todos sus mantenimientos y cargas de combustible</strong>. Esta
          acción no se puede deshacer.
          {nextActive && ` Como es el vehículo activo, la app pasará a ${vehicleName(nextActive)}.`}
        </>
      }
    />
  )
}
