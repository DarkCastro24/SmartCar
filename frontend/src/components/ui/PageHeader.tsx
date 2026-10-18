import type { ReactNode } from 'react'

import { useDocumentTitle } from '../../lib/hooks'

interface PageHeaderProps {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

/** Encabezado de cada sección; también pone el título de la pestaña. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  useDocumentTitle(title)
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold tracking-tight text-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
