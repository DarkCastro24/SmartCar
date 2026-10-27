import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { Toaster } from 'sonner'

import { GoogleProvider } from './app/GoogleProvider'
import { queryClient } from './app/queryClient'
import { router } from './app/router'
import { AuthProvider } from './features/auth/AuthProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster
            position="top-center"
            richColors
            closeButton
            theme="system"
            containerAriaLabel="Avisos"
            toastOptions={{ closeButtonAriaLabel: 'Cerrar aviso' }}
          />
        </AuthProvider>
      </QueryClientProvider>
    </GoogleProvider>
  </StrictMode>,
)
