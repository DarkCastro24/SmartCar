import { CircleCheck } from 'lucide-react'
import { useId } from 'react'
import type { UseFormRegisterReturn } from 'react-hook-form'

import { MAINTENANCE_TYPES } from '../../lib/maintenance'

interface MaintenanceTypePickerProps {
  /** Resultado de register('type'): se reparte entre los radios del grupo. */
  registration: UseFormRegisterReturn
  error?: string
  legend?: string
}

/**
 * Tipo de mantenimiento como tarjetas. Por dentro son radios nativos, así que
 * funcionan con teclado (Tab para entrar, flechas para cambiar) y con lector de pantalla.
 */
export function MaintenanceTypePicker({
  registration,
  error,
  legend = 'Tipo de mantenimiento',
}: MaintenanceTypePickerProps) {
  const id = useId()
  const legendId = `${id}-legend`
  const errorId = `${id}-error`

  return (
    <fieldset
      role="radiogroup"
      aria-labelledby={legendId}
      aria-describedby={error ? errorId : undefined}
      aria-invalid={error ? true : undefined}
      aria-required
    >
      <legend id={legendId} className="mb-2 text-sm font-medium text-fg">
        {legend}
      </legend>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {MAINTENANCE_TYPES.map(({ value, label, icon: Icon }) => (
          <label
            key={value}
            className={
              'group relative flex min-h-14 cursor-pointer items-center gap-2.5 rounded-xl border border-border bg-surface py-2 pl-2.5 pr-6 ' +
              'text-sm font-medium text-fg transition-colors hover:bg-surface-2 ' +
              'has-checked:border-primary has-checked:bg-primary-soft has-checked:ring-1 has-checked:ring-primary ' +
              'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary-text'
            }
          >
            <input type="radio" value={value} className="sr-only" {...registration} />
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-fg-2 group-has-checked:bg-primary group-has-checked:text-white">
              <Icon aria-hidden className="size-5" />
            </span>
            <span className="min-w-0 leading-tight">{label}</span>
            <CircleCheck
              aria-hidden
              className="absolute right-1.5 top-1.5 hidden size-4 text-primary-text group-has-checked:block"
            />
          </label>
        ))}
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-sm text-critical-text">
          {error}
        </p>
      )}
    </fieldset>
  )
}
