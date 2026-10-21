import { Wrench } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { ConfirmDialog, Dialog } from '../../components/ui/Dialog'
import { ErrorState, LoadingState } from '../../components/ui/States'
import { cn } from '../../components/ui/cn'
import { getErrorMessage, isUnauthorized } from '../../lib/api'
import { formatDate, formatMiles, formatMoney } from '../../lib/format'
import { MAINTENANCE_META } from '../../lib/maintenance'
import { useDeleteMaintenance, useMaintenanceRecords } from '../../lib/queries'
import type { MaintenanceFilters, MaintenanceRecord } from '../../lib/types'
import { HistoryEmpty, HistoryTable, RecordActions, RecordIcon, Td, Th } from './history-parts'
import { HistorySummary } from './HistorySummary'
import { MaintenanceForm } from './MaintenanceForm'
import { hasActiveFilters } from './params'
import { summarizeMaintenance } from './summary'

interface MaintenanceHistoryProps {
  vehicleId: number
  filters: MaintenanceFilters
  onClearFilters: () => void
}

/** Historial de mantenimientos: resumen, lista y los diálogos de editar y eliminar. */
export function MaintenanceHistory({ vehicleId, filters, onClearFilters }: MaintenanceHistoryProps) {
  const query = useMaintenanceRecords(vehicleId, filters)
  const deleteMutation = useDeleteMaintenance()
  const [editing, setEditing] = useState<MaintenanceRecord | null>(null)
  const [deleting, setDeleting] = useState<MaintenanceRecord | null>(null)
  const filtered = hasActiveFilters(filters)

  function confirmDelete() {
    // Si mientras se borra se cierra el diálogo (Escape) y se abre el de otro
    // registro, al terminar solo se cierra el de este
    const target = deleting
    if (!target) return
    deleteMutation.mutate(
      { id: target.id, vehicleId },
      {
        onSuccess: () => {
          toast.success('Mantenimiento eliminado', { description: describe(target) })
          setDeleting((current) => (current?.id === target.id ? null : current))
        },
        onError: (error) => {
          if (isUnauthorized(error)) return
          toast.error(getErrorMessage(error, 'No se pudo eliminar el mantenimiento.'))
        },
      },
    )
  }

  let content: ReactNode
  if (query.isPending) {
    content = <LoadingState label="Cargando mantenimientos…" />
  } else if (!query.data) {
    // Si falla solo un refresco, se siguen mostrando los datos que ya había
    content = <ErrorState error={query.error} onRetry={() => void query.refetch()} />
  } else if (query.data.length === 0) {
    content = (
      <HistoryEmpty
        filtered={filtered}
        icon={Wrench}
        emptyTitle="Aún no hay mantenimientos registrados"
        emptyDescription="Cuando anotes un cambio de aceite, un filtro u otro servicio, aparecerá aquí."
        registerLabel="Registrar mantenimiento"
        registerTo="/registrar?tipo=mantenimiento"
        onClearFilters={onClearFilters}
      />
    )
  } else {
    const listProps = { records: query.data, onEdit: setEditing, onDelete: setDeleting }
    // Mientras llegan los resultados del filtro nuevo se ven los anteriores: atenuados
    // y sin un resumen "de lo filtrado" que no corresponde
    const updating = query.isPlaceholderData
    content = (
      <div className={cn('space-y-4', updating && 'pointer-events-none opacity-60 transition-opacity')} aria-busy={updating || undefined}>
        {updating ? (
          <LoadingState label="Aplicando filtros…" className="py-3" />
        ) : (
          <HistorySummary summary={summarizeMaintenance(query.data)} filtered={filtered} />
        )}
        <MaintenanceCards {...listProps} />
        <MaintenanceTable {...listProps} />
      </div>
    )
  }

  return (
    <>
      {content}

      <Dialog open={editing !== null} onClose={() => setEditing(null)} title="Editar mantenimiento">
        {editing && (
          <MaintenanceForm
            vehicleId={vehicleId}
            record={editing}
            onSaved={(saved) => setEditing((current) => (current?.id === saved.id ? null : current))}
            onCancel={() => setEditing(null)}
          />
        )}
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteMutation.isPending && deleteMutation.variables?.id === deleting?.id}
        title="¿Eliminar este mantenimiento?"
        description={
          deleting && (
            <>
              Se borrará el registro de <strong className="font-semibold text-fg">{describe(deleting)}</strong>.
              Esta acción no se puede deshacer.
            </>
          )
        }
      />
    </>
  )
}

interface ListProps {
  records: MaintenanceRecord[]
  onEdit: (record: MaintenanceRecord) => void
  onDelete: (record: MaintenanceRecord) => void
}

/** Teléfono: una tarjeta por registro. */
function MaintenanceCards({ records, onEdit, onDelete }: ListProps) {
  return (
    <ul aria-label="Mantenimientos" className="space-y-2 md:hidden">
      {records.map((record) => {
        const meta = MAINTENANCE_META[record.type]
        return (
          <li key={record.id} className="flex gap-3 rounded-2xl border border-border bg-surface p-3">
            <RecordIcon icon={meta.icon} />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-semibold text-fg">{meta.label}</p>
                <p className="shrink-0 font-semibold tabular-nums text-fg">{formatMoney(record.cost)}</p>
              </div>
              {record.notes && <p className="mt-0.5 line-clamp-2 text-sm text-fg-2">{record.notes}</p>}
              <div className="mt-1 flex items-center justify-between gap-2">
                <p className="text-sm text-fg-2">
                  {formatDate(record.date)} ·{' '}
                  <span className="whitespace-nowrap tabular-nums">{formatMiles(record.mileage)}</span>
                </p>
                <div className="-my-1.5 -mr-1.5">
                  <RecordActions
                    label={describe(record)}
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record)}
                  />
                </div>
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/** Escritorio: tabla. */
function MaintenanceTable({ records, onEdit, onDelete }: ListProps) {
  return (
    <HistoryTable
      caption="Mantenimientos"
      head={
        <>
          <Th>Fecha</Th>
          <Th>Tipo</Th>
          <Th align="right">Millaje</Th>
          <Th align="right">Costo</Th>
          <Th>Notas</Th>
          <Th>
            <span className="sr-only">Acciones</span>
          </Th>
        </>
      }
    >
      {records.map((record) => {
        const meta = MAINTENANCE_META[record.type]
        const Icon = meta.icon
        return (
          <tr key={record.id} className="hover:bg-surface-2/50">
            <Td className="whitespace-nowrap">{formatDate(record.date)}</Td>
            <Td>
              <span className="flex items-center gap-2 font-medium whitespace-nowrap text-fg">
                <Icon aria-hidden className="size-4 shrink-0 text-fg-2" />
                {meta.label}
              </span>
            </Td>
            <Td align="right" className="whitespace-nowrap">
              {formatMiles(record.mileage)}
            </Td>
            <Td align="right">{formatMoney(record.cost)}</Td>
            <Td className="max-w-56 text-fg-2">
              <span className="block truncate" title={record.notes ?? undefined}>
                {record.notes ?? '—'}
              </span>
            </Td>
            <Td className="w-px">
              <div className="-my-1.5">
                <RecordActions label={describe(record)} onEdit={() => onEdit(record)} onDelete={() => onDelete(record)} />
              </div>
            </Td>
          </tr>
        )
      })}
    </HistoryTable>
  )
}

/** "Cambio de aceite del 18 sep 2026" */
function describe(record: MaintenanceRecord) {
  return `${MAINTENANCE_META[record.type].label} del ${formatDate(record.date)}`
}
