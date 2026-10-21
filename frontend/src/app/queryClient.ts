import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'

import { isNotFound } from '../lib/api'
import { queryKeys } from '../lib/queries'

/**
 * Un 404 en algo de un vehículo suele significar que se borró desde otro
 * dispositivo: se vuelve a pedir la lista y VehicleProvider pasa solo al
 * primero que quede. /vehicles nunca da 404, así que no hay bucle.
 */
function refreshVehiclesOnNotFound(error: unknown) {
  if (isNotFound(error)) void queryClient.invalidateQueries({ queryKey: queryKeys.vehicles, exact: true })
}

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // Solo las consultas de un vehículo: ['vehicles', id, ...]
      if (query.queryKey[0] === 'vehicles' && typeof query.queryKey[1] === 'number') refreshVehiclesOnNotFound(error)
    },
  }),
  mutationCache: new MutationCache({ onError: refreshVehiclesOnNotFound }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // No reintentar errores 4xx (datos inválidos, no encontrado, sin permiso)
      retry: (failureCount, error) => {
        const status = error instanceof AxiosError ? error.response?.status : undefined
        if (status && status >= 400 && status < 500) return false
        return failureCount < 2
      },
    },
  },
})
