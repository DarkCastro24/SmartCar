import { Fuel } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog, Dialog } from '../../components/ui/Dialog'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { getErrorMessage } from '../../lib/api'
import { formatDate, formatGallons, formatMiles, formatMoney } from '../../lib/format'
import { useDeleteFuelLog, useFuelLogs } from '../../lib/queries'
import type { DateRangeFilters, FuelLog } from '../../lib/types'
import { FuelForm } from './FuelForm'
import { HistoryEmpty, HistoryTable, RecordActions, RecordIcon, TankBadge, Td, Th } from './history-parts'
import { HistorySummary } from './HistorySummary'
import { hasActiveFilters } from './params'
import { summarizeFuel } from './summary'

interface FuelHistoryProps {
  vehicleId: number
  filters: DateRangeFilters
  onClearFilters: () => void
}

/** Historial de cargas de combustible: resumen, lista y los diálogos de editar y eliminar. */
export function FuelHistory({ vehicleId, filters, onClearFilters }: FuelHistoryProps) {
  const query = useFuelLogs(vehicleId, filters)
  const deleteMutation = useDeleteFuelLog()
  const [editing, setEditing] = useState<FuelLog | null>(null)
  const [deleting, setDeleting] = useState<FuelLog | null>(null)
  const filtered = hasActiveFilters(filters)

  function confirmDelete() {
    if (!deleting) return
    deleteMutation.mutate(
      { id: deleting.id, vehicleId },
      {
        onSuccess: () => {
          toast.success('Carga eliminada', {
            description: `${formatDate(deleting.date)} · ${formatGallons(deleting.gallons)}`,
          })
          setDeleting(null)
        },
        onError: (error) => toast.error(getErrorMessage(error, 'No se pudo eliminar la carga.')),
      },
    )
  }

  let content: ReactNode
  if (query.isPending) {
    content = <LoadingState label="Cargando cargas de combustible…" />
  } else if (query.error) {
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  } else if (query.data.length === 0) {
    content = (
      <HistoryEmpty
        filtered={filtered}
        icon={Fuel}
        emptyTitle="Aún no hay cargas de combustible"
        emptyDescription="Anota cada vez que llenes el tanque para conocer el rendimiento de tu carro."
        registerLabel="Registrar carga"
        registerTo="/registrar?tipo=combustible"
        onClearFilters={onClearFilters}
      />
    )
  } else {
    const listProps = { logs: query.data, onEdit: setEditing, onDelete: setDeleting }
    content = (
      <div className="space-y-4">
        <HistorySummary summary={summarizeFuel(query.data)} filtered={filtered} />
        <FuelCards {...listProps} />
        <FuelTable {...listProps} />
      </div>
    )
  }

  return (
    <>
      {content}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Editar carga de combustible">
        {editing && (
          <FuelForm
            vehicleId={vehicleId}
            log={editing}
            onSaved={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending}
        title="¿Eliminar esta carga?"
        description={
          deleting && (
            <>
              Se borrará la <strong className="font-semibold text-fg">{describe(deleting)}</strong> (
              {formatGallons(deleting.gallons)}). Esta acción no se puede deshacer.
            </>
          )
        }
      />
    </>
  )
}

interface ListProps {
  logs: FuelLog[]
  onEdit: (log: FuelLog) => void
  onDelete: (log: FuelLog) => void
}

/** Teléfono: una tarjeta por carga. */
function FuelCards({ logs, onEdit, onDelete }: ListProps) {
  return (
    <ul aria-label="Cargas de combustible" className="space-y-2 md:hidden">
      {logs.map((log) => (
        <li key={log.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
          <RecordIcon icon={Fuel} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="font-semibold text-fg">{formatDate(log.date)}</p>
              <p className="shrink-0 font-semibold tabular-nums text-fg">{formatMoney(log.total_cost)}</p>
            </div>
            <p className="mt-0.5 text-sm tabular-nums text-fg-2">
              {formatMiles(log.mileage)} · {formatGallons(log.gallons)}
              {log.price_per_gallon != null && ` · ${formatMoney(log.price_per_gallon)}/gal`}
            </p>
            {log.notes && <p className="mt-0.5 line-clamp-2 text-sm text-fg-2">{log.notes}</p>}
            <div className="mt-1 flex items-center justify-between gap-2">
              <TankBadge full={log.full_tank} />
              <div className="-my-1.5 -mr-1.5">
                <RecordActions label={describe(log)} onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

/** Escritorio: tabla. */
function FuelTable({ logs, onEdit, onDelete }: ListProps) {
  return (
    <HistoryTable
      caption="Cargas de combustible"
      head={
        <>
          <Th>Fecha</Th>
          <Th align="right">Millaje</Th>
          <Th align="right">Galones</Th>
          <Th align="right">Total</Th>
          <Th align="right">Precio/gal</Th>
          <Th>Tanque</Th>
          <Th>
            <span className="sr-only">Acciones</span>
          </Th>
        </>
      }
    >
      {logs.map((log) => (
        <tr key={log.id} className="hover:bg-surface-2/50">
          <Td className="whitespace-nowrap">
            <span className="block text-fg">{formatDate(log.date)}</span>
            {log.notes && (
              <span className="block max-w-48 truncate text-xs text-fg-2" title={log.notes}>
                {log.notes}
              </span>
            )}
          </Td>
          <Td align="right" className="whitespace-nowrap">
            {formatMiles(log.mileage)}
          </Td>
          <Td align="right" className="whitespace-nowrap">
            {formatGallons(log.gallons)}
          </Td>
          <Td align="right">{formatMoney(log.total_cost)}</Td>
          <Td align="right">{formatMoney(log.price_per_gallon)}</Td>
          <Td>
            <TankBadge full={log.full_tank} />
          </Td>
          <Td className="w-px">
            <div className="-my-1.5">
              <RecordActions label={describe(log)} onEdit={() => onEdit(log)} onDelete={() => onDelete(log)} />
            </div>
          </Td>
        </tr>
      ))}
    </HistoryTable>
  )
}

/** "carga del 18 oct 2026" */
function describe(log: FuelLog) {
  return `carga del ${formatDate(log.date)}`
}
