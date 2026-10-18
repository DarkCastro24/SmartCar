import { GoogleLogin } from '@react-oauth/google'
import { Gauge, History, PlusCircle, type LucideIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { toast } from 'sonner'

import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Field'
import { Spinner } from '../../components/ui/States'
import { getErrorMessage } from '../../lib/api'
import { GOOGLE_CLIENT_ID } from '../../lib/config'
import { useDocumentTitle } from '../../lib/hooks'
import { useAuth } from './auth-context'

const FEATURES: Array<{ icon: LucideIcon; title: string; text: string }> = [
  { icon: PlusCircle, title: 'Registrar', text: 'Aceite, filtros, bujías, frenos, batería y combustible.' },
  { icon: History, title: 'Consultar', text: 'Todo el historial de tu carro con filtros por fecha.' },
  { icon: Gauge, title: 'Estado general', text: 'Qué toca pronto y cuánto rinde tu carro por galón.' },
]

export default function LoginPage() {
  useDocumentTitle('Iniciar sesión')
  const { isAuthenticated, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: string } | null)?.from ?? '/estado'
  if (isAuthenticated) return <Navigate to={from} replace />

  async function handleCredential(credential: string | undefined) {
    if (!credential) {
      setError('Google no devolvió la credencial. Intenta de nuevo.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { user, new_user } = await loginWithGoogle(credential)
      const name = user.name?.split(' ')[0] ?? ''
      toast.success(new_user ? `¡Bienvenido a SmartCar${name ? `, ${name}` : ''}!` : `Hola de nuevo${name ? `, ${name}` : ''}`)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo iniciar sesión.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <img src="/logo.svg" alt="" className="mb-4 size-16" />
          <h1 className="text-3xl font-bold tracking-tight text-fg">SmartCar</h1>
          <p className="mt-2 text-fg-2">Lleva el control de los mantenimientos y del rendimiento de tu carro.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <ul className="mb-6 space-y-4">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <Icon aria-hidden className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-fg">{title}</span>
                  <span className="block text-sm text-fg-2">{text}</span>
                </span>
              </li>
            ))}
          </ul>

          {GOOGLE_CLIENT_ID ? (
            <div className="flex min-h-11 flex-col items-center gap-3">
              {loading ? (
                <div role="status" className="flex flex-col items-center gap-2 text-center text-sm text-fg-2">
                  <span className="flex items-center gap-2">
                    <Spinner /> Iniciando sesión…
                  </span>
                  <span>Si el servidor estaba inactivo puede tardar hasta un minuto.</span>
                </div>
              ) : (
                <GoogleLogin
                  onSuccess={(response) => void handleCredential(response.credential)}
                  onError={() => setError('No se pudo iniciar sesión con Google. Intenta de nuevo.')}
                  text="continue_with"
                  shape="pill"
                  width="300"
                />
              )}
            </div>
          ) : (
            <p className="rounded-xl bg-warning/15 p-3 text-sm text-warning-text">
              Falta configurar <code className="font-mono">VITE_GOOGLE_CLIENT_ID</code> en el archivo{' '}
              <code className="font-mono">.env</code> del frontend.
            </p>
          )}

          {error && (
            <p role="alert" className="mt-4 rounded-xl bg-critical/10 p-3 text-center text-sm text-critical-text">
              {error}
            </p>
          )}

          <p className="mt-6 text-center text-xs text-fg-2">
            Usamos tu cuenta de Google solo para identificarte. Si es tu primera vez, tu cuenta se crea sola.
          </p>
        </div>

        {import.meta.env.DEV && <DevTokenLogin />}
      </div>
    </div>
  )
}

/** Solo en desarrollo: entrar con el token de `flask dev-token` sin configurar Google. */
function DevTokenLogin() {
  const { loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await loginWithToken(token)
      navigate('/estado', { replace: true })
    } catch (err) {
      setError(getErrorMessage(err, 'Token inválido.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <details className="mt-4 rounded-2xl border border-dashed border-border-strong p-4 text-sm">
      <summary className="cursor-pointer font-medium text-fg-2">Modo desarrollo: entrar con token</summary>
      <form onSubmit={onSubmit} className="mt-3 space-y-3">
        <p className="text-fg-2">
          En el backend ejecuta <code className="font-mono">flask dev-token tu_correo@gmail.com</code> y pega aquí el token.
        </p>
        <label htmlFor="dev-token" className="sr-only">
          Token de desarrollo
        </label>
        <Textarea
          id="dev-token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Bearer eyJhbGciOi…"
          className="font-mono text-xs"
          rows={3}
        />
        {error && (
          <p role="alert" className="text-critical-text">
            {error}
          </p>
        )}
        <Button type="submit" variant="secondary" loading={loading} className="w-full">
          Entrar con token
        </Button>
      </form>
    </details>
  )
}
