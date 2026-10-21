import { FilterX, TriangleAlert } from 'lucide-react'
import { useId, useState, type ComponentProps } from 'react'

import { Button } from '../../components/ui/Button'
import { Field, Input, Select } from '../../components/ui/Field'
import { useToday } from '../../lib/hooks'
import { isMaintenanceType, MAINTENANCE_TYPES } from '../../lib/maintenance'
import type { MaintenanceFilters } from '../../lib/types'
import { dateRangeError, hasActiveFilters, isISODate } from './params'

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
  const today = useToday()

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
          <DateFilterInput
            id={`${id}-from`}
            max={today}
            value={filters.from}
            invalid={Boolean(rangeError)}
            aria-describedby={rangeError ? errorId : undefined}
            onCommit={(from) => onChange({ ...filters, from })}
          />
        </Field>

        <Field label="Hasta" htmlFor={`${id}-to`} className="min-w-0 md:flex-1">
          <DateFilterInput
            id={`${id}-to`}
            max={today}
            value={filters.to}
            invalid={Boolean(rangeError)}
            aria-describedby={rangeError ? errorId : undefined}
            onCommit={(to) => onChange({ ...filters, to })}
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

type DateFilterInputProps = Omit<ComponentProps<typeof Input>, 'type' | 'value' | 'onChange'> & {
  /** Fecha que está en la URL */
  value?: string
  onCommit: (value: string | undefined) => void
}

/**
 * Input de fecha con borrador propio. Al escribir el año con el teclado el
 * navegador emite fechas a medias ("0002-03-15"); solo se sube a la URL una
 * fecha completa (o el campo vacío), así no se borra lo que se está escribiendo.
 */
function DateFilterInput({ value, onCommit, onBlur, ...props }: DateFilterInputProps) {
  const [draft, setDraft] = useState(value ?? '')
  // Si la URL cambia por fuera (Atrás, Limpiar filtros), el borrador la sigue
  const [synced, setSynced] = useState(value)
  if (value !== synced) {
    setSynced(value)
    setDraft(value ?? '')
  }

  return (
    <Input
      type="date"
      {...props}
      value={draft}
      onChange={(event) => {
        const next = event.target.value
        setDraft(next)
        // Vacío con badInput = fecha a medias (se borró el día para reescribirlo), no "sin filtro"
        const complete = next === '' ? !event.target.validity.badInput : isCompleteDate(next)
        if (complete) onCommit(next || undefined)
      }}
      onBlur={(event) => {
        // Al salir con una fecha a medias se vuelve a la que está aplicada
        if (draft !== '' && !isCompleteDate(draft)) setDraft(value ?? '')
        onBlur?.(event)
      }}
    />
  )
}

/** Fecha válida y con el año completo (descarta "0002-03-15" mientras se escribe 2026). */
function isCompleteDate(value: string) {
  return isISODate(value) && value >= '1900-01-01'
}
