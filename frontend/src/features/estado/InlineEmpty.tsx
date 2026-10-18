import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface InlineEmptyProps {
  icon: LucideIcon
  title: string
  description: ReactNode
  action?: ReactNode
}

/** Estado vacío compacto para usar dentro de una tarjeta. */
export function InlineEmpty({ icon: Icon, title, description, action }: InlineEmptyProps) {
  return (
    <div className="mt-4 flex flex-col items-center gap-3 rounded-xl bg-surface-2 px-4 py-8 text-center">
      <Icon aria-hidden className="size-6 text-fg-2" />
      <div>
        <p className="font-medium text-fg">{title}</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-fg-2">{description}</p>
      </div>
      {action}
    </div>
  )
}
