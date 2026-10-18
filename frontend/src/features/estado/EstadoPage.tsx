import { PageHeader } from '../../components/ui/PageHeader'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { useVehicleStats, useVehicleStatus } from '../../lib/queries'
import type { Vehicle } from '../../lib/types'
import { VehicleGate } from '../vehicles/VehicleGate'
import { CyclesSection } from './CyclesSection'
import { ImpactSection } from './ImpactSection'
import { MaintenanceSection } from './MaintenanceSection'
import { MonthlyCostChart } from './MonthlyCostChart'
import { MpgChart } from './MpgChart'
import { SummarySection } from './SummarySection'

export default function EstadoPage() {
  return (
    <>
      <PageHeader title="Estado general" description="Cómo está tu vehículo hoy y cómo ha rendido." />
      <VehicleGate>{(vehicle) => <VehicleDashboard vehicle={vehicle} />}</VehicleGate>
    </>
  )
}

/** Estado (semáforo por componente) y estadísticas del vehículo elegido. */
function VehicleDashboard({ vehicle }: { vehicle: Vehicle }) {
  const status = useVehicleStatus(vehicle.id)
  const stats = useVehicleStats(vehicle.id)

  if (status.isPending) return <LoadingState label="Calculando el estado del vehículo…" />
  if (status.isError) {
    return <ErrorState error={status.error} title="No se pudo cargar el estado" onRetry={() => status.refetch()} />
  }

  return (
    <div className="space-y-6">
      <SummarySection status={status.data} stats={stats.data} statsLoading={stats.isPending} />
      <MaintenanceSection items={status.data.items} />

      {stats.isPending ? (
        <LoadingState label="Cargando estadísticas…" />
      ) : stats.isError ? (
        <ErrorState error={stats.error} title="No se pudieron cargar las estadísticas" onRetry={() => stats.refetch()} />
      ) : (
        <>
          <MpgChart series={stats.data.fuel.mpg_series} impact={stats.data.maintenance_impact} />
          <ImpactSection impact={stats.data.maintenance_impact} />
          <MonthlyCostChart byMonth={stats.data.costs.by_month} />
          <CyclesSection cycles={stats.data.maintenance_cycles} items={status.data.items} />
        </>
      )}
    </div>
  )
}
