import { MapPinOff } from 'lucide-react'
import { Link } from 'react-router'

import { buttonClasses } from '../components/ui/button-classes'
import { EmptyState } from '../components/ui/States'
import { useDocumentTitle } from '../lib/hooks'

export default function NotFoundPage() {
  useDocumentTitle('Página no encontrada')
  return (
    <EmptyState
      icon={MapPinOff}
      title="Esta página no existe"
      description="Revisa la dirección o vuelve al estado general de tu vehículo."
      action={
        <Link to="/estado" className={buttonClasses('primary')}>
          Ir al estado general
        </Link>
      }
    />
  )
}
