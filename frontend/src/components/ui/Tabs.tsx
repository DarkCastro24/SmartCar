import type { LucideIcon } from 'lucide-react'
import { useRef, type KeyboardEvent } from 'react'

import { cn } from './cn'

export interface TabItem<T extends string> {
  value: T
  label: string
  icon?: LucideIcon
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  /** Si se indica, cada pestaña apunta a su panel: id="<idPrefix>-panel" */
  idPrefix?: string
  /** En el teléfono pone el ícono arriba del texto (útil con 3 pestañas) */
  compact?: boolean
  className?: string
}

/** Control segmentado accesible (flechas izquierda/derecha para moverse). */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  idPrefix,
  compact = false,
  className,
}: TabsProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([])

  function onKeyDown(event: KeyboardEvent, index: number) {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
    event.preventDefault()
    const next = (index + (event.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length
    onChange(items[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn('flex gap-1 rounded-2xl border border-border bg-surface-2 p-1', className)}
    >
      {items.map((item, index) => {
        const selected = item.value === value
        const Icon = item.icon
        return (
          <button
            key={item.value}
            ref={(element) => {
              refs.current[index] = element
            }}
            type="button"
            role="tab"
            id={idPrefix ? `${idPrefix}-tab-${item.value}` : undefined}
            aria-controls={idPrefix ? `${idPrefix}-panel` : undefined}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              'flex min-h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors',
              compact && 'max-sm:flex-col max-sm:gap-0.5 max-sm:px-1 max-sm:py-1.5 max-sm:text-xs',
              selected ? 'bg-surface text-fg shadow-sm' : 'text-fg-2 hover:text-fg',
            )}
          >
            {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
            <span className="truncate">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
