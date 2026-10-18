import { Lightbulb, Pencil, RotateCcw, SlidersHorizontal } from 'lucide-react'
import { useId } from 'react'
import type { FieldErrors, UseFormRegister } from 'react-hook-form'

import { Button } from '../../components/ui/Button'
import { cn } from '../../components/ui/cn'
import { parseIntegerInput } from '../../lib/forms'
import { MAINTENANCE_META } from '../../lib/maintenance'
import type { Interval, MaintenanceTypeInfo } from '../../lib/types'
import { UnitInput } from '../../components/ui/FormParts'
import { describeInterval, type IntervalsFormValues } from './intervals'

type RowErrors = NonNullable<FieldErrors<IntervalsFormValues>['intervals']>[number]

interface IntervalRowProps {
  index: number
  /** Lo guardado en el servidor (para saber si es personalizado). */
  interval: Interval
  /** Valores sugeridos de fábrica, para mostrarlos al lado de "Restablecer". */
  suggested?: MaintenanceTypeInfo
  register: UseFormRegister<IntervalsFormValues>
  errors?: RowErrors
  changed: boolean
  resetting: boolean
  onReset: () => void
}

/** Una fila del editor: "Cada [5000 mi] o [6 meses]". */
export function IntervalRow({ index, interval, suggested, register, errors, changed, resetting, onReset }: IntervalRowProps) {
  const id = useId()
  const meta = MAINTENANCE_META[interval.type]
  const Icon = meta.icon
  const errorMessage = errors?.every_miles?.message ?? errors?.every_months?.message
  const errorId = `${id}-error`

  return (
    <li className="space-y-3 py-4">
      <div className="flex items-center gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary-text">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <h3 className="font-medium text-fg">{meta.label}</h3>
          <span className="flex items-center gap-2">
            {changed && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-text">
                <Pencil aria-hidden className="size-3.5" />
                Sin guardar
              </span>
            )}
            <IntervalBadge custom={interval.is_custom} />
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-fg-2">
        <span aria-hidden>Cada</span>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-miles`} className="sr-only">
            {meta.label}: cada cuántas millas
          </label>
          <UnitInput
            id={`${id}-miles`}
            trailing="mi"
            inputMode="numeric"
            autoComplete="off"
            placeholder="—"
            invalid={Boolean(errors?.every_miles)}
            aria-describedby={errors?.every_miles ? errorId : undefined}
            {...register(`intervals.${index}.every_miles`, { setValueAs: parseIntegerInput })}
          />
        </div>
        <span aria-hidden>o</span>
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-months`} className="sr-only">
            {meta.label}: cada cuántos meses
          </label>
          <UnitInput
            id={`${id}-months`}
            trailing="meses"
            inputMode="numeric"
            autoComplete="off"
            placeholder="—"
            invalid={Boolean(errors?.every_months)}
            aria-describedby={errors?.every_months ? errorId : undefined}
            {...register(`intervals.${index}.every_months`, { setValueAs: parseIntegerInput })}
          />
        </div>
      </div>

      {errorMessage && (
        <p id={errorId} role="alert" className="text-sm text-critical-text">
          {errorMessage}
        </p>
      )}

      {interval.is_custom && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          {suggested && (
            <p className="text-sm text-fg-2">
              Sugerido: {describeInterval(suggested.default_every_miles, suggested.default_every_months)}
            </p>
          )}
          <Button
            variant="ghost"
            className="-mr-3 ml-auto"
            loading={resetting}
            icon={<RotateCcw aria-hidden className="size-4" />}
            onClick={onReset}
          >
            Restablecer<span className="sr-only"> {meta.label}</span>
          </Button>
        </div>
      )}
    </li>
  )
}

function IntervalBadge({ custom }: { custom: boolean }) {
  const Icon = custom ? SlidersHorizontal : Lightbulb
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        custom ? 'border-primary/30 bg-primary/12 text-primary-text' : 'border-border bg-surface-2 text-fg-2',
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {custom ? 'Personalizado' : 'Sugerido'}
    </span>
  )
}
