import { toast } from 'sonner'

import { ConfirmDialog } from '../../components/ui/Dialog'
import { getErrorMessage, isUnauthorized } from '../../lib/api'
import { vehicleName } from '../../lib/format'
import { useDeleteVehicle } from '../../lib/queries'
import type { Vehicle } from '../../lib/types'

interface DeleteVehicleDialogProps {
  /** Vehículo a eliminar; null mantiene el diálogo cerrado. */
  vehicle: Vehicle | null
  /** Si se borra el vehículo activo, el que lo reemplaza (para avisarlo). */
  nextActive?: Vehicle | null
  onClose: () => void
  /** Se llama con el id borrado; cierra el diálogo solo si sigue mostrando ese vehículo. */
  onDeleted: (id: number) => void
}

export function DeleteVehicleDialog({ vehicle, nextActive, onClose, onDeleted }: DeleteVehicleDialogProps) {
  const deleteMutation = useDeleteVehicle()
  const name = vehicle ? vehicleName(vehicle) : ''

  function confirm() {
    if (!vehicle) return
    // Si el diálogo se cierra (Escape) mientras se borra y se abre otro, al
    // terminar solo se cierra el de este vehículo
    const target = vehicle
    deleteMutation.mutate(target.id, {
      onSuccess: () => {
        toast.success('Vehículo eliminado', { description: vehicleName(target) })
        onDeleted(target.id)
      },
      onError: (error) => {
        if (isUnauthorized(error)) return
        toast.error(getErrorMessage(error, 'No se pudo eliminar el vehículo.'))
      },
    })
  }

  return (
    <ConfirmDialog
      open={vehicle !== null}
      onClose={onClose}
      onConfirm={confirm}
      loading={deleteMutation.isPending && deleteMutation.variables === vehicle?.id}
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
