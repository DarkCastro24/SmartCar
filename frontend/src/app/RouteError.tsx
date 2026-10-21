import { TriangleAlert } from 'lucide-react'
import { useEffect } from 'react'
import { useRouteError } from 'react-router'

import { Button } from '../components/ui/Button'

const RELOAD_KEY = 'smartcar.chunk-reload'

/** Después de publicar una versión nueva, los archivos viejos desaparecen del servidor. */
function isChunkLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  return /dynamically imported module|Importing a module script failed|Loading chunk|error loading dynamically/i.test(message)
}

/** Pantalla para errores inesperados al mostrar una ruta. */
export function RouteError() {
  const error = useRouteError()
  const stale = isChunkLoadError(error)

  // Una sola recarga automática para traer la versión nueva; si vuelve a fallar se muestra el error
  useEffect(() => {
    if (!stale) return
    try {
      if (window.sessionStorage.getItem(RELOAD_KEY)) return
      window.sessionStorage.setItem(RELOAD_KEY, '1')
    } catch {
      return
    }
    window.location.reload()
  }, [stale])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <TriangleAlert aria-hidden className="size-10 text-critical-text" />
      <div>
        <h1 className="text-xl font-bold">{stale ? 'Hay una versión nueva' : 'Algo salió mal'}</h1>
        <p className="mt-1 text-fg-2">
          {stale
            ? 'SmartCar se actualizó. Recarga la página para continuar.'
            : 'Ocurrió un error inesperado al mostrar esta pantalla.'}
        </p>
      </div>
      <Button onClick={() => (stale ? window.location.reload() : window.location.assign('/estado'))}>
        {stale ? 'Recargar' : 'Volver al inicio'}
      </Button>
    </main>
  )
}
