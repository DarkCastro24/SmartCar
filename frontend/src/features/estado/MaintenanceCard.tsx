import { Plus } from 'lucide-react'
import { useId } from 'react'
import { Link } from 'react-router'

import { StatusBadge } from '../../components/ui/Badge'
import { buttonClasses } from '../../components/ui/button-classes'
import { MAINTENANCE_META } from '../../lib/maintenance'
import type { StatusItem } from '../../lib/types'
import { ProgressMeter } from './ProgressMeter'
import {
  describeDue,
  describeInterval,
  describeLastService,
  describeRemaining,
  needsAttention,
  registerMaintenanceHref,
} from './status-text'

/** Estado de un componente: avance, último mantenimiento y lo que falta. */
export function MaintenanceCard({ item }: { item: StatusItem }) {
  const titleId = useId()
  const Icon = MAINTENANCE_META[item.type].icon
  const due = describeDue(item)

  return (
    <article
      aria-labelledby={titleId}
      className="flex h-full flex-col gap-4 rounded-2xl border border-border bg-surface p-4"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-fg-2">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 id={titleId} className="font-semibold text-fg">
            {item.label}
          </h3>
          <p className="text-xs text-fg-2">{describeInterval(item.every_miles, item.every_months)}</p>
        </div>
        <StatusBadge status={item.status} className="shrink-0" />
      </div>

      {item.percent != null && <ProgressMeter percent={item.percent} status={item.status} />}

      <dl className="text-sm">
        <dt className="text-xs text-fg-2">Último mantenimiento</dt>
        <dd className="text-fg">{describeLastService(item)}</dd>
      </dl>

      <div>
        <p className="font-medium text-fg">{describeRemaining(item)}</p>
        {due && <p className="mt-0.5 text-sm text-fg-2">{due}</p>}
      </div>

      {needsAttention(item.status) && (
        <Link
          to={registerMaintenanceHref(item.type)}
          aria-label={`Registrar ${item.label.toLowerCase()}`}
          className={buttonClasses('secondary', 'md', 'mt-auto self-start')}
        >
          <Plus aria-hidden className="size-4" />
          Registrar
        </Link>
      )}
    </article>
  )
}
