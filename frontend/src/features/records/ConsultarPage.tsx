import { CalendarX2, Fuel, Wrench } from 'lucide-react'
import { useSearchParams } from 'react-router'

import { PageHeader } from '../../components/ui/PageHeader'
import { EmptyState } from '../../components/ui/States'
import { Tabs, type TabItem } from '../../components/ui/Tabs'
import type { MaintenanceFilters } from '../../lib/types'
import { VehicleGate } from '../vehicles/VehicleGate'
import { FuelHistory } from './FuelHistory'
import { HistoryFilters } from './HistoryFilters'
import { MaintenanceHistory } from './MaintenanceHistory'
import { dateRangeError, filtersFromParams, filtersToParams, historyTabFromParams, type HistoryTab } from './params'

const TABS: TabItem<HistoryTab>[] = [
  { value: 'mantenimientos', label: 'Mantenimientos', icon: Wrench },
  { value: 'combustible', label: 'Combustible', icon: Fuel },
]

export default function ConsultarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = historyTabFromParams(searchParams)
  const allFilters = filtersFromParams(searchParams)
  // El tipo solo filtra mantenimientos
  const filters: MaintenanceFilters = tab === 'mantenimientos' ? allFilters : { from: allFilters.from, to: allFilters.to }
  const rangeError = dateRangeError(filters)

  // Cada cambio crea una entrada en el historial: el botón atrás deshace el filtro
  function changeFilters(next: MaintenanceFilters) {
    setSearchParams(filtersToParams(next, searchParams))
  }

  function changeTab(next: HistoryTab) {
    const params = new URLSearchParams(searchParams)
    params.set('tab', next)
    if (next === 'combustible') params.delete('type')
    setSearchParams(params)
  }

  const clearFilters = () => changeFilters({})

  return (
    <>
      <PageHeader title="Consultar" description="Revisa, filtra y corrige tu historial." />
      <VehicleGate>
        {(vehicle) => (
          <div className="space-y-4">
            <Tabs
              items={TABS}
              value={tab}
              onChange={changeTab}
              ariaLabel="Qué historial ver"
              idPrefix="consultar"
              className="md:max-w-md"
            />

            <HistoryFilters filters={filters} onChange={changeFilters} showType={tab === 'mantenimientos'} />

            <div role="tabpanel" id="consultar-panel" aria-labelledby={`consultar-tab-${tab}`}>
              {rangeError ? (
                <EmptyState
                  icon={CalendarX2}
                  title="Revisa el rango de fechas"
                  description="Cuando “Desde” sea anterior o igual a “Hasta”, verás los registros aquí."
                />
              ) : tab === 'mantenimientos' ? (
                <MaintenanceHistory vehicleId={vehicle.id} filters={filters} onClearFilters={clearFilters} />
              ) : (
                <FuelHistory vehicleId={vehicle.id} filters={filters} onClearFilters={clearFilters} />
              )}
            </div>
          </div>
        )}
      </VehicleGate>
    </>
  )
}
