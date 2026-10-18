import { GoogleOAuthProvider } from '@react-oauth/google'
import type { ReactNode } from 'react'

import { GOOGLE_CLIENT_ID } from '../lib/config'

/** El script de Google solo se carga si hay Client ID configurado. */
export function GoogleProvider({ children }: { children: ReactNode }) {
  if (!GOOGLE_CLIENT_ID) return children
  return <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{children}</GoogleOAuthProvider>
}
