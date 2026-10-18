import { createContext, useContext } from 'react'

import type { LoginResponse, User } from '../../lib/types'

export interface AuthContextValue {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  /** Envía el `credential` del botón de Google al backend y guarda la sesión. */
  loginWithGoogle: (credential: string) => Promise<LoginResponse>
  /** Solo para desarrollo: entra con un token de `flask dev-token`. */
  loginWithToken: (token: string) => Promise<User>
  logout: (reason?: 'expired') => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return context
}
