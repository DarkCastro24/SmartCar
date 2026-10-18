// localStorage puede fallar (modo privado, almacenamiento bloqueado): nunca rompe la app.

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Sin almacenamiento la sesión dura hasta recargar la página
  }
}

export const STORAGE_KEYS = {
  token: 'smartcar.token',
  user: 'smartcar.user',
  vehicleId: 'smartcar.vehicleId',
} as const
