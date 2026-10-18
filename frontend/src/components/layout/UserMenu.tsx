import { Car, LogOut } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'

import { useAuth } from '../../features/auth/auth-context'

function initials(name: string | null, email: string) {
  const source = name?.trim() || email
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function UserMenu() {
  const { user, logout } = useAuth()
  const containerRef = useRef<HTMLDivElement>(null)
  const { pathname } = useLocation()
  // El menú queda abierto solo en la pantalla donde se abrió: al navegar se cierra
  const [openOn, setOpenOn] = useState<string | null>(null)
  const open = openOn === pathname
  const setOpen = (value: boolean) => setOpenOn(value ? pathname : null)

  // Cerrar al tocar fuera o con Escape
  useEffect(() => {
    if (!open) return
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpenOn(null)
    }
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setOpenOn(null)
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (!user) return null

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Menú de usuario"
        className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border bg-primary-soft text-sm font-semibold text-primary-text"
      >
        {user.picture ? (
          <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-full object-cover" />
        ) : (
          initials(user.name, user.email)
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-30 w-64 rounded-2xl border border-border bg-surface p-2 shadow-lg"
        >
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold text-fg">{user.name ?? 'Usuario'}</p>
            <p className="truncate text-sm text-fg-2">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <Link
            to="/vehiculos"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-fg hover:bg-surface-2"
          >
            <Car aria-hidden className="size-4 text-fg-2" />
            Mis vehículos
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-critical-text hover:bg-surface-2"
          >
            <LogOut aria-hidden className="size-4" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
