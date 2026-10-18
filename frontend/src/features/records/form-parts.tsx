import { ArrowRight, CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

/** Confirmación que queda a la vista después de guardar, con el siguiente paso. */
export function SavedNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="flex items-start gap-2 rounded-xl border border-good/30 bg-good/10 px-3 py-2 text-sm"
    >
      <CircleCheck aria-hidden className="mt-2.5 size-4 shrink-0 text-good-text" />
      <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between sm:gap-3">
        <p className="py-2 text-fg">{children}</p>
        <Link
          to="/estado"
          className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg font-semibold text-primary-text hover:underline"
        >
          Ver estado general
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </div>
  )
}
