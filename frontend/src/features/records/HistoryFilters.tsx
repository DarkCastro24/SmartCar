import { FilterX, TriangleAlert } from 'lucide-react'
import { useId } from 'react'

import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { todayISO } from '../../lib/format'
import { isMaintenanceType, MAINTENANCE_TYPES } from '../../lib/maintenance'
import type { MaintenanceFilters } from '../../lib/types'
import { dateRangeError, hasActiveFilters } from './params'

interface HistoryFiltersProps {
  filters: MaintenanceFilters
  onChange: (filters: MaintenanceFilters) => void
  /** El filtro por tipo solo aplica a mantenimientos. */
  showType: boolean
}

/** Filtros de Consultar. Viven en la URL, así que el botón atrás los recuerda. */
export function HistoryFilters({ filters, onChange, showType }: HistoryFiltersProps) {
  const id = useId()
  const rangeError = dateRangeError(filters)
  const errorId = `${id}-range-error`
  const today = todayISO()

  return (
    <section aria-label="Filtros" className="rounded-2xl border border-border bg-surface p-4">
      <div className="grid grid-cols-2 gap-3 md:flex md:items-end">
        {showType && (
          <Field label="Tipo" htmlFor={`${id}-type`} className="col-span-2 md:flex-1">
            <Select
              id={`${id}-type`}
              value={filters.type ?? ''}
              onChange={(event) => {
                const value = event.target.value
                onChange({ ...filters, type: isMaintenanceType(value) ? value : undefined })
              }}
            >
              <option value="">Todos los tipos</option>
              {MAINTENANCE_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="Desde" htmlFor={`${id}-from`} className="min-w-0 md:flex-1">
          <Input
            id={`${id}-from`}
            type="date"
            max={today}
            value={filters.from ?? ''}
            invalid={Boolean(rangeError)}
            aria-describedby={rangeError ? errorId : undefined}
            onChange={(event) => onChange({ ...filters, from: event.target.value || undefined })}
          />
        </Field>

        <Field label="Hasta" htmlFor={`${id}-to`} className="min-w-0 md:flex-1">
          <Input
            id={`${id}-to`}
            type="date"
            max={today}
            value={filters.to ?? ''}
            invalid={Boolean(rangeError)}
            aria-describedby={rangeError ? errorId : undefined}
            onChange={(event) => onChange({ ...filters, to: event.target.value || undefined })}
          />
        </Field>

        <Button
          variant="secondary"
          className="col-span-2"
          icon={<FilterX aria-hidden className="size-4" />}
          disabled={!hasActiveFilters(filters)}
          onClick={() => onChange({})}
        >
          Limpiar filtros
        </Button>
      </div>

      {rangeError && (
        <p id={errorId} role="alert" className="mt-3 flex items-center gap-2 text-sm text-critical-text">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          {rangeError}
        </p>
      )}
    </section>
  )
}
