import { useEffect, useState } from 'react'

import { todayISO } from './format'

/** Título de la pestaña del navegador: "Registrar · SmartCar" */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · SmartCar` : 'SmartCar'
  }, [title])
}

/**
 * Fecha de hoy ("2026-10-18") que se actualiza sola al pasar la medianoche:
 * la PWA puede quedar abierta de un día para otro en el teléfono.
 */
export function useToday() {
  const [today, setToday] = useState(todayISO)

  useEffect(() => {
    const update = () => setToday(todayISO())
    const timer = window.setInterval(update, 60_000)
    document.addEventListener('visibilitychange', update)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', update)
      window.removeEventListener('focus', update)
    }
  }, [])

  return today
}
