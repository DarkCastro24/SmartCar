import axios, { AxiosError } from 'axios'

import { readStorage, STORAGE_KEYS } from './storage'

export const API_URL = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/+$/, '')

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  // El plan gratis de Render "despierta" la API en ~1 minuto
  timeout: 70_000,
})

let authToken: string | null = readStorage(STORAGE_KEYS.token)
let unauthorizedHandler: (() => void) | null = null

export function setAuthToken(token: string | null) {
  authToken = token
}

/** Se llama cuando la API responde 401 (token vencido o inválido). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

api.interceptors.request.use((config) => {
  if (authToken) config.headers.Authorization = `Bearer ${authToken}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (error instanceof AxiosError && error.response?.status === 401 && authToken) {
      unauthorizedHandler?.()
    }
    return Promise.reject(error)
  },
)

interface ApiErrorBody {
  msg?: string
  errors?: Record<string, unknown>
}

/** Mensaje en español para mostrarle al usuario a partir de cualquier error. */
export function getErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado.'): string {
  if (error instanceof AxiosError) {
    if (error.code === 'ECONNABORTED') {
      return 'El servidor tardó demasiado en responder. Intenta de nuevo.'
    }
    if (!error.response) {
      return 'No se pudo conectar con el servidor. Revisa tu conexión.'
    }
    // Un 5xx trae la descripción en inglés de Flask o el HTML del proxy (Render reiniciando)
    if (error.response.status >= 500) return 'El servidor tuvo un problema. Intenta de nuevo en un momento.'
    const body = error.response.data as ApiErrorBody | undefined
    // Nunca el error.message de axios ("Request failed with status code 404")
    return body?.msg || fallback
  }
  // Errores propios de la app, como el de loginWithToken
  if (error instanceof Error && error.message) return error.message
  return fallback
}

/**
 * Errores por campo que devuelve el backend (marshmallow):
 * {"errors": {"mileage": ["..."]}} -> {"mileage": "..."}
 */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof AxiosError)) return {}
  const errors = (error.response?.data as ApiErrorBody | undefined)?.errors
  if (!errors || typeof errors !== 'object') return {}

  const result: Record<string, string> = {}
  for (const [field, messages] of Object.entries(errors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') result[field] = messages[0]
    else if (typeof messages === 'string') result[field] = messages
  }
  return result
}

/** La API respondió 401: el interceptor ya cerró la sesión y avisó al usuario. */
export function isUnauthorized(error: unknown) {
  return error instanceof AxiosError && error.response?.status === 401
}

export function isNotFound(error: unknown) {
  return error instanceof AxiosError && error.response?.status === 404
}
