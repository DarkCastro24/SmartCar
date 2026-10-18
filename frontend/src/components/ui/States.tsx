import { LoaderCircle, RefreshCw, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { getErrorMessage } from '../../lib/api'
import { cn } from './cn'

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle aria-hidden className={cn('size-5 animate-spin', className)} />
}

export function LoadingState({ label = 'Cargando…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center gap-2 py-16 text-fg-2', className)}>
      <Spinner />
      <span className="text-sm">{label}</span>
    </div>
  )
}

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, title = 'No se pudo cargar la información', onRetry, className }: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-3 rounded-2xl border border-border bg-surface px-6 py-10 text-center', className)}
    >
      <TriangleAlert aria-hidden className="size-8 text-critical-text" />
      <div>
        <p className="font-semibold text-fg">{title}</p>
        <p className="mt-1 text-sm text-fg-2">{getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium hover:bg-surface-2"
        >
          <RefreshCw aria-hidden className="size-4" />
          Reintentar
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border-strong px-6 py-12 text-center',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-text">
        <Icon aria-hidden className="size-6" />
      </span>
      <div>
        <p className="font-semibold text-fg">{title}</p>
        {description && <p className="mx-auto mt-1 max-w-sm text-sm text-fg-2">{description}</p>}
      </div>
      {action}
    </div>
  )
}
