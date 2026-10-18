import { useId, useMemo } from 'react'

import type { StatusItem } from '../../lib/types'
import { MaintenanceCard } from './MaintenanceCard'
import { sortByUrgency } from './status-text'

/** Una tarjeta por componente, los más urgentes primero. */
export function MaintenanceSection({ items }: { items: StatusItem[] }) {
  const titleId = useId()
  const sorted = useMemo(() => sortByUrgency(items), [items])

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className="text-lg font-semibold text-fg">
        Mantenimientos
      </h2>
      <p className="mt-0.5 text-sm text-fg-2">Los más urgentes aparecen primero.</p>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((item) => (
          <li key={item.type}>
            <MaintenanceCard item={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}
