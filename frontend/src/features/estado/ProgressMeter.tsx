import { useId } from 'react'

import { cn } from '../../components/ui/cn'
import { STATUS_META } from '../../lib/maintenance'
import type { ItemStatus } from '../../lib/types'

/** Riel de un tono más claro que el relleno, del mismo color de estado. */
const TRACK_CLASS: Record<ItemStatus, string> = {
  al_dia: 'bg-good/15',
  proximo: 'bg-warning/20',
  vencido: 'bg-critical/15',
  sin_registro: 'bg-surface-2',
}

/** Medidor del avance del intervalo; el relleno se detiene en 100 % aunque se haya pasado. */
export function ProgressMeter({ percent, status }: { percent: number; status: ItemStatus }) {
  const labelId = useId()
  const filled = Math.min(Math.max(percent, 0), 100)
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span id={labelId} className="text-fg-2">
          Avance del intervalo
        </span>
        <span className="font-semibold text-fg tabular-nums">{percent} %</span>
      </div>
      <div
        role="meter"
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={filled}
        aria-valuetext={`${percent} % del intervalo`}
        className={cn('mt-1.5 h-2 overflow-hidden rounded-full', TRACK_CLASS[status])}
      >
        <div className={cn('h-full rounded-full', STATUS_META[status].barClass)} style={{ width: `${filled}%` }} />
      </div>
    </div>
  )
}
