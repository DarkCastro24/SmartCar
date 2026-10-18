import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { api, setAuthToken, setUnauthorizedHandler } from '../../lib/api'
import { useMe } from '../../lib/queries'
import { readStorage, STORAGE_KEYS, writeStorage } from '../../lib/storage'
import type { LoginResponse, User } from '../../lib/types'
import { AuthContext, type AuthContextValue } from './auth-context'

function readStoredUser(): User | null {
  const raw = readStorage(STORAGE_KEYS.user)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

/** Acepta "eyJ...", "Bearer eyJ..." o la línea completa que imprime `flask dev-token`. */
function cleanToken(raw: string) {
  return raw
    .trim()
    .replace(/^Authorization:\s*/i, '')
    .replace(/^Bearer\s+/i, '')
    .trim()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(() => readStorage(STORAGE_KEYS.token))
  const [storedUser, setStoredUser] = useState<User | null>(readStoredUser)

  // Al abrir la app se piden los datos frescos del usuario (nombre y foto)
  const me = useMe(token !== null)
  const user = token ? (me.data ?? storedUser) : null

  useEffect(() => {
    if (me.data) writeStorage(STORAGE_KEYS.user, JSON.stringify(me.data))
  }, [me.data])

  const saveSession = useCallback(
    (newToken: string, newUser: User) => {
      queryClient.clear() // nada del usuario anterior queda en caché
      writeStorage(STORAGE_KEYS.token, newToken)
      writeStorage(STORAGE_KEYS.user, JSON.stringify(newUser))
      setAuthToken(newToken)
      setStoredUser(newUser)
      setToken(newToken)
    },
    [queryClient],
  )

  const logout = useCallback(
    (reason?: 'expired') => {
      writeStorage(STORAGE_KEYS.token, null)
      writeStorage(STORAGE_KEYS.user, null)
      setAuthToken(null)
      setToken(null)
      setStoredUser(null)
      queryClient.clear()
      if (reason === 'expired') toast.info('Tu sesión expiró. Inicia sesión de nuevo.')
    },
    [queryClient],
  )

  // Si la API responde 401 en cualquier pantalla, se cierra la sesión
  useEffect(() => {
    setUnauthorizedHandler(() => logout('expired'))
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const { data } = await api.post<LoginResponse>('/auth/google', { credential })
      saveSession(data.access_token, data.user)
      return data
    },
    [saveSession],
  )

  const loginWithToken = useCallback(
    async (rawToken: string) => {
      const newToken = cleanToken(rawToken)
      if (!newToken) throw new Error('Pega el token que imprimió flask dev-token.')
      const { data } = await api.get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${newToken}` },
      })
      saveSession(newToken, data)
      return data
    },
    [saveSession],
  )

  const value = useMemo<AuthContextValue>(
    () => ({ token, user, isAuthenticated: token !== null, loginWithGoogle, loginWithToken, logout }),
    [token, user, loginWithGoogle, loginWithToken, logout],
  )

  return <AuthContext value={value}>{children}</AuthContext>
}
