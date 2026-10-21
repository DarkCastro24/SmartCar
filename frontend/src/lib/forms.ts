import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'

import { getErrorMessage, getFieldErrors } from './api'

/**
 * Convierte el texto de un input a número para react-hook-form.
 * Se usa con: register('mileage', { setValueAs: parseIntegerInput })
 * "" -> null (campo vacío) · "62,784" o "62.784" (miles) -> 62784 · "abc" -> NaN
 * Un decimal ("62784.5", "1.5") llega como decimal para que zod pida escribirlo
 * sin decimales, en vez de pegar los dígitos y guardar un número 10 veces mayor.
 */
export function parseIntegerInput(value: unknown): number | null {
  if (value === '' || value == null) return null
  if (typeof value === 'number') return value
  const text = String(value).replace(/\s/g, '')
  // Punto de miles bien formado: "62.784", "1.200.000"
  if (/^\d{1,3}(\.\d{3})+$/.test(text)) return Number(text.replace(/\./g, ''))
  return parseDecimalInput(text)
}

/**
 * Igual que parseIntegerInput pero acepta decimales:
 * "9.5" o "9,5" -> 9.5 · "1,200" o "$1,234.50" (coma de miles) -> 1200 / 1234.5
 * La coma es decimal solo si le siguen hasta `commaDecimals` dígitos (2 para
 * dinero, 3 para galones: "9,547" -> 9.547). Cualquier otra mezcla, como
 * "1.234,50", da NaN y zod muestra el error en vez de guardar otro monto.
 */
export function parseDecimalInput(value: unknown, commaDecimals = 2): number | null {
  if (value === '' || value == null) return null
  if (typeof value === 'number') return value
  const text = String(value).replace(/\s/g, '').replace(/^\$/, '')
  if (text === '') return null
  if (new RegExp(`^\\d*,\\d{1,${commaDecimals}}$`).test(text)) return Number(text.replace(',', '.'))
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) return Number(text.replace(/,/g, ''))
  return Number(text)
}

/** Texto vacío -> null (para campos opcionales como notas o placa). */
export function emptyToNull(value: unknown) {
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Muestra en cada campo del formulario los errores de validación del backend.
 * Devuelve true si aplicó alguno.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): boolean {
  const serverErrors = getFieldErrors(error)
  let applied = false
  for (const field of fields) {
    const message = serverErrors[field]
    if (message) {
      setError(field, { type: 'server', message })
      applied = true
    }
  }
  return applied
}

/** aria-describedby de un control: apunta al error si lo hay, si no a la ayuda. */
export function describedBy(id: string, error?: string, hint?: unknown) {
  if (error) return `${id}-error`
  return hint ? `${id}-hint` : undefined
}

/**
 * Pone en cada campo los errores de validación del backend y devuelve el
 * mensaje general para mostrar junto al botón de guardar (por ejemplo, la
 * regla del odómetro, que llega solo en "msg").
 */
export function serverErrorMessage<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
  fallback: string,
) {
  const applied = applyServerErrors(error, setError, fields)
  return applied ? 'Revisa los campos marcados.' : getErrorMessage(error, fallback)
}
