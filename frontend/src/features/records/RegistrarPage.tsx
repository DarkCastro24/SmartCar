import { Car, Fuel, Wrench } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router'

import { Card, CardHeader } from '../../components/ui/Card'
import { PageHeader } from '../../components/ui/PageHeader'
import { Tabs, type TabItem } from '../../components/ui/Tabs'
import { vehicleName } from '../../lib/format'
import { useVehicleStatus } from '../../lib/queries'
import type { MaintenanceType, Vehicle } from '../../lib/types'
import { useSelectedVehicle } from '../vehicles/vehicle-context'
import { VehicleForm } from '../vehicles/VehicleForm'
import { VehicleGate } from '../vehicles/VehicleGate'
import { FuelForm } from './FuelForm'
import { MaintenanceForm } from './MaintenanceForm'
import { presetTypeFromParams, registerTabFromParams, type RegisterTab } from './params'

const TABS: TabItem<RegisterTab>[] = [
  { value: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
  { value: 'combustible', label: 'Combustible', icon: Fuel },
  { value: 'vehiculo', label: 'Vehículo', icon: Car },
]

export default function RegistrarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = registerTabFromParams(searchParams)
  const presetType = presetTypeFromParams(searchParams)

  return (
    <div className="max-w-2xl">
      <PageHeader title="Registrar" description="Anota cada mantenimiento y cada carga de combustible." />

      <Tabs
        items={TABS}
        value={tab}
        onChange={(next) => setSearchParams({ tipo: next })}
        ariaLabel="Qué quieres registrar"
        idPrefix="registrar"
        compact
        className="mb-4"
      />

      <div role="tabpanel" id="registrar-panel" aria-labelledby={`registrar-tab-${tab}`}>
        {tab === 'vehiculo' ? (
          <NewVehiclePanel />
        ) : (
          <VehicleGate>
            {(vehicle) => <RecordPanel vehicle={vehicle} kind={tab} presetType={presetType} />}
          </VehicleGate>
        )}
      </div>
    </div>
  )
}

interface RecordPanelProps {
  vehicle: Vehicle
  kind: 'mantenimiento' | 'combustible'
  presetType: MaintenanceType | null
}

function RecordPanel({ vehicle, kind, presetType }: RecordPanelProps) {
  const { data: status } = useVehicleStatus(vehicle.id)
  const currentMileage = status?.current_mileage

  return (
    <Card>
      <CardHeader
        title={kind === 'mantenimiento' ? 'Nuevo mantenimiento' : 'Nueva carga de combustible'}
        description={<VehicleLabel vehicle={vehicle} />}
      />
      {kind === 'mantenimiento' ? (
        // La key reinicia el formulario si cambia el tipo que llega por la URL
        <MaintenanceForm
          key={`${vehicle.id}-${presetType ?? ''}`}
          vehicleId={vehicle.id}
          defaultType={presetType}
          currentMileage={currentMileage}
        />
      ) : (
        <FuelForm key={vehicle.id} vehicleId={vehicle.id} currentMileage={currentMileage} />
      )}
    </Card>
  )
}

function VehicleLabel({ vehicle }: { vehicle: Vehicle }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-x-1.5">
      <Car aria-hidden className="size-4 shrink-0" />
      Para <strong className="font-semibold text-fg">{vehicleName(vehicle)}</strong>
      {vehicle.plate && <span>· {vehicle.plate}</span>}
    </span>
  )
}

function NewVehiclePanel() {
  const navigate = useNavigate()
  const { selectVehicle } = useSelectedVehicle()

  function handleSaved(vehicle: Vehicle) {
    selectVehicle(vehicle.id)
    navigate('/estado')
  }

  return (
    <Card>
      <CardHeader
        title="Nuevo vehículo"
        description="Después podrás cambiar de vehículo desde el selector de arriba."
      />
      <VehicleForm onSaved={handleSaved} />
    </Card>
  )
}
