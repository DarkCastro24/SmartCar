import { useEffect } from 'react'

/** Título de la pestaña del navegador: "Registrar · SmartCar" */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} · SmartCar` : 'SmartCar'
  }, [title])
}
