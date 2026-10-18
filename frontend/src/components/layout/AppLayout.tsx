import { Suspense } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { cn } from '../ui/cn'
import { LoadingState } from '../ui/States'
import { NAV_ITEMS } from './nav'
import { UserMenu } from './UserMenu'
import { VehicleSwitcher } from './VehicleSwitcher'

/** Estructura común: encabezado arriba y, en el teléfono, navegación abajo. */
export function AppLayout() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-4 sm:px-6">
          <Link to="/estado" className="flex shrink-0 items-center gap-2 font-bold text-fg" aria-label="SmartCar, inicio">
            <img src="/logo.svg" alt="" className="size-8" />
            <span className="hidden text-lg sm:inline">SmartCar</span>
          </Link>

          <nav aria-label="Secciones" className="ml-4 hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                    isActive ? 'bg-primary-soft text-primary-text' : 'text-fg-2 hover:bg-surface-2 hover:text-fg',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center gap-2">
            <VehicleSwitcher />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 sm:px-6 md:pb-12">
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </main>

      <nav
        aria-label="Secciones"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                    isActive ? 'text-primary-text' : 'text-fg-2 hover:text-fg',
                  )
                }
              >
                <Icon aria-hidden className="size-6" />
                {item.shortLabel}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
