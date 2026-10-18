import { ChevronDown } from 'lucide-react'
import type { ComponentProps, ReactNode } from 'react'

import { cn } from './cn'

const controlClass = cn(
  'w-full rounded-xl border border-border bg-surface px-3 text-base text-fg placeholder:text-muted',
  'transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25',
  'aria-[invalid=true]:border-critical aria-[invalid=true]:focus:ring-critical/25',
  'disabled:cursor-not-allowed disabled:opacity-60',
)

interface FieldProps {
  label: ReactNode
  htmlFor: string
  error?: string
  hint?: ReactNode
  optional?: boolean
  className?: string
  children: ReactNode
}

/** Etiqueta + control + mensaje de ayuda o de error. */
export function Field({ label, htmlFor, error, hint, optional, className, children }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-fg">
        {label}
        {optional && <span className="font-normal text-fg-2"> (opcional)</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-sm text-critical-text">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${htmlFor}-hint`} className="text-sm text-fg-2">
            {hint}
          </p>
        )
      )}
    </div>
  )
}

type InvalidProp = { invalid?: boolean }

export function Input({ className, invalid, ...props }: ComponentProps<'input'> & InvalidProp) {
  return <input className={cn(controlClass, 'h-11', className)} aria-invalid={invalid || undefined} {...props} />
}

export function Textarea({ className, invalid, ...props }: ComponentProps<'textarea'> & InvalidProp) {
  return (
    <textarea
      className={cn(controlClass, 'min-h-20 py-2.5', className)}
      aria-invalid={invalid || undefined}
      {...props}
    />
  )
}

export function Select({ className, invalid, children, ...props }: ComponentProps<'select'> & InvalidProp) {
  return (
    <div className="relative">
      <select
        className={cn(controlClass, 'h-11 appearance-none pr-10', className)}
        aria-invalid={invalid || undefined}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-2"
      />
    </div>
  )
}

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-surface p-3 hover:bg-surface-2',
        className,
      )}
    >
      <input id={id} type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" {...props} />
      <span>
        <span className="block text-sm font-medium text-fg">{label}</span>
        {description && <span className="mt-0.5 block text-sm text-fg-2">{description}</span>}
      </span>
    </label>
  )
}
