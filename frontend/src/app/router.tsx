/* oxlint-disable react/only-export-components -- el router no necesita fast refresh */
import { lazy } from 'react'
import { createBrowserRouter, Navigate } from 'react-router'

import { AppLayout } from '../components/layout/AppLayout'
import LoginPage from '../features/auth/LoginPage'
import { RequireAuth } from '../features/auth/RequireAuth'
import { VehicleProvider } from '../features/vehicles/VehicleProvider'
import NotFoundPage from './NotFoundPage'
import { RouteError } from './RouteError'

// Cada sección se descarga solo cuando se abre (las gráficas pesan)
const EstadoPage = lazy(() => import('../features/estado/EstadoPage'))
const RegistrarPage = lazy(() => import('../features/records/RegistrarPage'))
const ConsultarPage = lazy(() => import('../features/records/ConsultarPage'))
const VehiclesPage = lazy(() => import('../features/vehicles/VehiclesPage'))

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage />, errorElement: <RouteError /> },
  {
    path: '/',
    errorElement: <RouteError />,
    element: (
      <RequireAuth>
        <VehicleProvider>
          <AppLayout />
        </VehicleProvider>
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/estado" replace /> },
      { path: 'estado', element: <EstadoPage /> },
      { path: 'registrar', element: <RegistrarPage /> },
      { path: 'consultar', element: <ConsultarPage /> },
      { path: 'vehiculos', element: <VehiclesPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
