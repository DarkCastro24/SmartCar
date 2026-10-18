import { TriangleAlert } from 'lucide-react'

import { Button } from '../components/ui/Button'

/** Pantalla para errores inesperados al mostrar una ruta. */
export function RouteError() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlert aria-hidden className="size-10 text-critical-text" />
      <div>
        <h1 className="text-xl font-bold">Algo salió mal</h1>
        <p className="mt-1 text-fg-2">Ocurrió un error inesperado al mostrar esta pantalla.</p>
      </div>
      <Button onClick={() => window.location.assign('/estado')}>Volver al inicio</Button>
    </div>
  )
}
