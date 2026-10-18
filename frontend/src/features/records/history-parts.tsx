import { CircleCheck, CircleDashed, FilterX, Pencil, SearchX, Trash2, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Button } from '../../components/ui/Button'
import { buttonClasses } from '../../components/ui/button-classes'
import { cn } from '../../components/ui/cn'
import { EmptyState } from '../../components/ui/States'

const ICON_BUTTON =
  'inline-flex size-11 items-center justify-center rounded-xl text-fg-2 transition-colors hover:bg-surface-2'

interface RecordActionsProps {
  /** Describe el registro para los lectores de pantalla: "Cambio de aceite del 18 sept 2026" */
  label: string
  onEdit: () => void
  onDelete: () => void
}

/** Botones de ícono Editar y Eliminar (44 px, con aria-label). */
export function RecordActions({ label, onEdit, onDelete }: RecordActionsProps) {
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className={cn(ICON_BUTTON, 'hover:text-fg')} aria-label={`Editar ${label}`} onClick={onEdit}>
        <Pencil aria-hidden className="size-4" />
      </button>
      <button
        type="button"
        className={cn(ICON_BUTTON, 'hover:text-critical-text')}
        aria-label={`Eliminar ${label}`}
        onClick={onDelete}
      >
        <Trash2 aria-hidden className="size-4" />
      </button>
    </div>
  )
}

/** Tanque lleno o carga parcial: ícono + texto. */
export function TankBadge({ full }: { full: boolean }) {
  const Icon = full ? CircleCheck : CircleDashed
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium',
        full ? 'border-primary/30 bg-primary-soft text-primary-text' : 'border-border bg-surface-2 text-fg-2',
      )}
    >
      <Icon aria-hidden className="size-3.5" />
      {full ? 'Tanque lleno' : 'Parcial'}
    </span>
  )
}

/** Ícono en un círculo suave, al inicio de cada tarjeta. */
export function RecordIcon({ icon: Icon }: { icon: LucideIcon }) {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-2">
      <Icon aria-hidden className="size-5" />
    </span>
  )
}

interface HistoryEmptyProps {
  filtered: boolean
  icon: LucideIcon
  /** "Aún no hay mantenimientos registrados" */
  emptyTitle: string
  emptyDescription: string
  registerLabel: string
  registerTo: string
  onClearFilters: () => void
}

/** Distingue "todavía no hay nada" de "nada coincide con los filtros". */
export function HistoryEmpty({
  filtered,
  icon,
  emptyTitle,
  emptyDescription,
  registerLabel,
  registerTo,
  onClearFilters,
}: HistoryEmptyProps) {
  if (filtered) {
    return (
      <EmptyState
        icon={SearchX}
        title="Ningún registro coincide con los filtros"
        description="Prueba con otro tipo o con un rango de fechas más amplio."
        action={
          <Button variant="secondary" icon={<FilterX aria-hidden className="size-4" />} onClick={onClearFilters}>
            Limpiar filtros
          </Button>
        }
      />
    )
  }
  return (
    <EmptyState
      icon={icon}
      title={emptyTitle}
      description={emptyDescription}
      action={
        <Link to={registerTo} className={buttonClasses('primary')}>
          {registerLabel}
        </Link>
      }
    />
  )
}

/** Tabla de escritorio con encabezado fijo de estilo. */
export function HistoryTable({ caption, head, children }: { caption: string; head: ReactNode; children: ReactNode }) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface md:block">
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-fg-2">
          <tr>{head}</tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  )
}

export function Th({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right'; className?: string }) {
  return (
    <th scope="col" className={cn('px-4 py-3 font-semibold', align === 'right' && 'text-right', className)}>
      {children}
    </th>
  )
}

export function Td({ children, align = 'left', className }: { children?: ReactNode; align?: 'left' | 'right'; className?: string }) {
  return (
    <td className={cn('px-4 py-2 align-middle', align === 'right' && 'text-right tabular-nums', className)}>{children}</td>
  )
}
