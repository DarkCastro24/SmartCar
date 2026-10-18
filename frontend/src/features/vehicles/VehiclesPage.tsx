import { Car, Plus } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '../../components/ui/Button'
import { Dialog } from '../../components/ui/Dialog'
import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/States'
import { vehicleName } from '../../lib/format'
import type { Vehicle } from '../../lib/types'
import { DeleteVehicleDialog } from './DeleteVehicleDialog'
import { IntervalsEditor } from './IntervalsEditor'
import { useSelectedVehicle } from './vehicle-context'
import { VehicleCard } from './VehicleCard'
import { VehicleForm } from './VehicleForm'

/** Qué ventana está abierta y para qué vehículo. */
type OpenDialog = { kind: 'add' } | { kind: 'edit' | 'intervals' | 'delete'; vehicle: Vehicle } | null

export default function VehiclesPage() {
  const { vehicles, vehicle: activeVehicle, selectVehicle, isLoading, error, refetch } = useSelectedVehicle()
  const navigate = useNavigate()
  const [dialog, setDialog] = useState<OpenDialog>(null)
  const close = () => setDialog(null)
  const target = dialog && dialog.kind !== 'add' ? dialog.vehicle : null
  const hasVehicles = vehicles.length > 0

  function activate(vehicle: Vehicle) {
    selectVehicle(vehicle.id)
    toast.success('Vehículo activo cambiado', {
      description: `Ahora ves los datos de ${vehicleName(vehicle)}.`,
      action: { label: 'Ver estado', onClick: () => navigate('/estado') },
    })
  }

  const addButton = (
    <Button onClick={() => setDialog({ kind: 'add' })} icon={<Plus aria-hidden className="size-4" />}>
      Agregar vehículo
    </Button>
  )

  let content
  if (isLoading) content = <LoadingState label="Cargando tus vehículos…" />
  else if (error) content = <ErrorState error={error} onRetry={refetch} />
  else if (!hasVehicles) {
    content = (
      <EmptyState
        icon={Car}
        title="Aún no tienes vehículos"
        description="Agrega tu carro para llevar el control de sus mantenimientos y del consumo de combustible."
        action={addButton}
      />
    )
  } else {
    content = (
      <ul className="grid gap-4 md:grid-cols-2">
        {vehicles.map((vehicle) => (
          <li key={vehicle.id} className="min-w-0">
            <VehicleCard
              vehicle={vehicle}
              active={vehicle.id === activeVehicle?.id}
              onUse={() => activate(vehicle)}
              onEdit={() => setDialog({ kind: 'edit', vehicle })}
              onIntervals={() => setDialog({ kind: 'intervals', vehicle })}
              onDelete={() => setDialog({ kind: 'delete', vehicle })}
            />
          </li>
        ))}
      </ul>
    )
  }

  // Si se borra el activo, VehicleProvider pasa solo al primero que quede
  const nextActive =
    dialog?.kind === 'delete' && dialog.vehicle.id === activeVehicle?.id
      ? vehicles.find((item) => item.id !== dialog.vehicle.id)
      : null

  return (
    <>
      <PageHeader
        title="Mis vehículos"
        description="El vehículo activo es el que ves en Estado, Registrar y Consultar."
        actions={hasVehicles && addButton}
      />

      {content}

      <Dialog
        open={dialog?.kind === 'add'}
        onClose={close}
        title="Agregar vehículo"
        description="Solo la marca y el modelo son obligatorios."
      >
        <VehicleForm onSaved={close} onCancel={close} />
      </Dialog>

      <Dialog open={dialog?.kind === 'edit'} onClose={close} title="Editar vehículo" description={target && vehicleName(target)}>
        {target && <VehicleForm vehicle={target} onSaved={close} onCancel={close} />}
      </Dialog>

      <Dialog
        open={dialog?.kind === 'intervals'}
        onClose={close}
        title="Intervalos de mantenimiento"
        description={target && vehicleName(target)}
      >
        {target && <IntervalsEditor vehicleId={target.id} onSaved={close} onCancel={close} />}
      </Dialog>

      <DeleteVehicleDialog vehicle={dialog?.kind === 'delete' ? target : null} nextActive={nextActive} onClose={close} />
    </>
  )
}
