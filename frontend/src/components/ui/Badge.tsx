import type { ReactNode } from 'react'

import { STATUS_META } from '../../lib/maintenance'
import type { ItemStatus } from '../../lib/types'
import { cn } from './cn'

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-surface-2 px-2 py-0.5 text-xs font-medium text-fg-2',
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Estado de mantenimiento: siempre ícono + texto, nunca solo color. */
export function StatusBadge({ status, className }: { status: ItemStatus; className?: string }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold',
        meta.badgeClass,
        className,
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {meta.label}
    </span>
  )
}
