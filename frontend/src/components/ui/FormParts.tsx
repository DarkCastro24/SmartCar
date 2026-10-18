import { Save, TriangleAlert } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { Button } from './Button'
import { cn } from './cn'
import { Input } from './Field'

interface UnitInputProps extends ComponentProps<typeof Input> {
  /** Unidad antes del número, como "$" */
  leading?: string
  /** Unidad después del número, como "mi" o "gal" */
  trailing?: string
}

/** Input numérico con su unidad a la vista. */
export function UnitInput({ leading, trailing, className, ...props }: UnitInputProps) {
  return (
    <div className="relative">
      {leading && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-fg-2">
          {leading}
        </span>
      )}
      <Input className={cn('tabular-nums', leading && 'pl-7', trailing && 'pr-12', className)} {...props} />
      {trailing && (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-fg-2">
          {trailing}
        </span>
      )}
    </div>
  )
}

/** Error general del formulario (por ejemplo, la regla del odómetro). */
export function FormError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-critical/35 bg-critical/10 px-3 py-2.5 text-sm text-critical-text"
    >
      <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}

interface FormFooterProps {
  submitLabel: string
  submitting: boolean
  error: string | null
  notice?: ReactNode
  onCancel?: () => void
}

/** Botones del formulario con el error o la confirmación justo al lado. */
export function FormFooter({ submitLabel, submitting, error, notice, onCancel }: FormFooterProps) {
  return (
    <div className="space-y-3 border-t border-border pt-4">
      {error ? <FormError message={error} /> : notice}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={submitting}>
            Cancelar
          </Button>
        )}
        <Button type="submit" loading={submitting} icon={<Save aria-hidden className="size-4" />}>
          {submitLabel}
        </Button>
      </div>
    </div>
  )
}
